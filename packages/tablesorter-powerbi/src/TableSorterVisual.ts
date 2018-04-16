/*
 * Copyright (C) 2016 Microsoft
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import "powerbi-visuals-tools/templates/visuals/.api/v1.11.0/PowerBI-visuals";
import { formatting, filter, dataview } from "../powerbi-visuals-utils";
import { ITableSorterVisualRow, IRankingInfo } from "./interfaces";
import {
    logger,
    UpdateType,
    calcUpdateType,
    get,
} from "@essex/visual-utils";
import colors from "@essex/visual-styling";
import * as $ from "jquery";
import * as d3 from "d3";
import {
    TableSorter,
    ITableSorterRow,
    ITableSorterSettings,
    ICellFormatterObject,
    DEFAULT_TABLESORTER_SETTINGS,
} from "@essex/tablesorter";
import converter from "./dataConversion";
import { Promise } from "es6-promise";
import MyDataProvider from "./TableSorterVisual.dataProvider";
import { default as buildConfig, LOWER_NUMBER_HIGHER_VALUE } from "./ConfigBuilder";

import IVisual = powerbi.extensibility.visual.IVisual;
import DataViewTable = powerbi.DataViewTable;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import DataView = powerbi.DataView;
import TSSettings from "./settings";

/* tslint:disable */
const log = logger("essex:widget:TableSorterVisual");
const CSS_MODULE = require("!css!sass!./css/TableSorterVisual.scss");
const vendorPrefix = (function getVendorPrefix() {
  const styles = window.getComputedStyle(document.documentElement, "");
  return (Array.prototype.slice
          .call(styles)
          .join("")
          .match(/-(moz|webkit|ms)-/) || (styles["OLink"] === "" && ["", "-o-"])
         )[0];
})();
const merge = require("lodash/object/merge"); // tslint:disable-line
const debounce = require("lodash/function/debounce"); //tslint:disable-line
const find = require("lodash/collection/find"); // tslint:disable-line
const isEqual = require("lodash/lang/isEqual"); // tslint:disable-line
/* tslint:enable */

/**
 * The visual which wraps TableSorter
 */
export default class TableSorterVisual implements IVisual {

    /**
     * The default settings for the visual
     */
    private static VISUAL_DEFAULT_SETTINGS: ITableSorterSettings =
        $.extend(true, {}, DEFAULT_TABLESORTER_SETTINGS, {
        presentation: {
            columnColors: (idx: number) => {
                return colors[idx % colors.length];
            },
        },
        experimental: {
            serverSideSorting: false,
            serverSideFiltering: false,
        },
    });

    public tableSorter: TableSorter;
    private dataViewTable: DataViewTable;
    /**
     * The list of listeners on the table sorter
     */
    private listeners: Array<{ destroy: () => void }> = [];
    private dataView: powerbi.DataView;
    private host: IVisualHost;
    private selectionManager: powerbi.extensibility.ISelectionManager;
    private waitingForMoreData: boolean;
    private waitingForSort: boolean;
    private handlingUpdate: boolean;
    private prevUpdateOptions: VisualUpdateOptions;
    private destroyed = false;

    // Stores our current set of data.
    private _data: {
        data: ITableSorterVisualRow[],
        cols: string[],
        rankingInfo: IRankingInfo,
    };

    /**
     * My css module
     */
    private myCssModule: any;

    /**
     * The initial set of settings to use
     */
    private initialSettings: ITableSorterSettings;

    /**
     * The formatter to use for numbers
     */
    private numberFormatter: formatting.IValueFormatter;

    /**
     * The current load promise
     */
    private loadResolver: (data: any[]) => void;

    /**
     * The set of settings loaded into table sorter
     */
    private visualSettings: TSSettings = TSSettings.create<TSSettings>();

    /**
     * Tablesorters parent element
     */
    private element: JQuery;

    /**
     * A simple debounced function to update the configuration
     */
    private configurationUpdater = debounce(() => {
        if (!this.destroyed) {
            const config = this.tableSorter.configuration;
            const objects: powerbi.VisualObjectInstancesToPersist = {
                merge: [
                    <VisualObjectInstance>{
                        objectName: "layout",
                        properties: {
                            layout: JSON.stringify(config),
                        },
                        selector: undefined,
                    },
                ],
            };
            log("Updating Config");
            this.host.persistProperties(objects);
        }
    }, this.userInteractionDebounce);

    /**
     * The constructor for the visual
     * @param options The constructor options
     * @param initialSettings The initial set of settings to use
     * @param updateTypeGetterOverride An override for the update type getter.
     * @param userInteractionDebounce The debounce delay after some user action to actually perform computationally
     * expensive operations.
     */
    public constructor(
        options: VisualConstructorOptions,
        initialSettings?: ITableSorterSettings,
        private userInteractionDebounce = 100,
        private defaultPrecision = undefined) { // tslint:disable-line
        this.host = options.host;
        this.initialSettings = merge({
            presentation: {
                numberFormatter: (numVal: number, row: any, col: any) => {
                    const colName = col && col.column && col.column.column;
                    const actualVal = colName && row[colName];
                    if (colName && (actualVal === null || actualVal === undefined)) { // tslint:disable-line
                        numVal = actualVal;
                    }
                    return this.numberFormatter.format(numVal);
                },
                cellFormatter: this.cellFormatter.bind(this),
            },
        }, initialSettings || {});

        this.element = $(`<div><div class="lineup"></div></div>`);

        const className = CSS_MODULE && CSS_MODULE.locals && CSS_MODULE.locals.className;
        if (className) {
            this.element.append($(`<style>${CSS_MODULE}$</style>`));
            this.element.addClass(className);
        }

        this.numberFormatter = formatting.valueFormatter.create({
            value: 0,
            format: "0",
            precision: this.defaultPrecision,
        });
        this.selectionManager = this.host.createSelectionManager();
        this.tableSorter = new TableSorter(this.element.find(".lineup"), undefined, this.userInteractionDebounce);
        this.tableSorter.settings = this.initialSettings;
        this.listeners = [
            this.tableSorter.events.on("selectionChanged", (rows: ITableSorterVisualRow[]) => this.onSelectionChanged(rows)),
            this.tableSorter.events.on(TableSorter.EVENTS.CLEAR_SELECTION, () => this.onSelectionChanged()),
            this.tableSorter.events.on(TableSorter.EVENTS.LOAD_LINEUP, () => {
                // We use this.tableSorter.data where because this data is after it has been sorted/filtered...
                updateRankingColumns(this._data.rankingInfo, this.tableSorter.data);
            }),
            this.tableSorter.events.on("configurationChanged", (config: any) => {
            if (!this.handlingUpdate) {
                this.configurationUpdater();
            }
        })];

        options.element.appendChild(this.element[0]);
    }

    /**
     * Setter for dimensions
     */
    private _dimensions: { width: number; height: number }; // tslint:disable-line
    public set dimensions(value: { width: number; height: number }) {
        this._dimensions = value;
        if (this.tableSorter) {
            this.tableSorter.dimensions = value;
        }
    }

    /**
     * Getter for dimensions
     */
    public get dimensions() {
        return this._dimensions;
    }

    /**
     * The IVisual.update function
     * Called when the visual is being initialized.
     * Update is called for data updates, resizes & formatting changes
     * @param options The update options
     * @param vm The View Model (not used)
     * @param type The optional update type to use
     */
    public update(options: VisualUpdateOptions, vm?: any, type?: UpdateType) {
        if (!this.destroyed) {
            const updateType = type !== undefined ? type : calcUpdateType(this.prevUpdateOptions, options);
            this.prevUpdateOptions = options;
            this.handlingUpdate = true;
            this.dataView = options.dataViews && options.dataViews[0];
            this.dataViewTable = this.dataView && this.dataView.table;
            log("Update Type: ", updateType);

            const oldSettings = this.visualSettings;
            this.visualSettings = this.visualSettings.receiveFromPBI(this.dataView);

            // Assume that data updates won't happen when resizing
            const newDims = { width: options.viewport.width, height: options.viewport.height };
            if ((updateType & UpdateType.Resize)) {
                this.dimensions = newDims;
            }

            if (updateType & UpdateType.Settings) {
                this.loadSettingsFromPowerBI(oldSettings, this.visualSettings);
            }

            if (updateType & UpdateType.Data ||
                // If the layout has changed, we need to reload table sorter
                this.hasLayoutChanged(updateType, options) ||

                // The data may not have changed, but we are loading
                // Necessary because sometimes the user "changes" the filter, but it doesn't actually change the dataset.
                // ie. If the user selects the min value and the max value of the dataset as a filter.
                this.loadResolver ||

                // If the color settings have changed, we need to rerender
                hasColorSettingsChanged(oldSettings, this.visualSettings)) {

                // If we explicitly are loading more data OR If we had no data before, then data has been loaded
                this.waitingForMoreData = false;
                this.waitingForSort = false;

                this.loadDataFromPowerBI(oldSettings, updateType);
            }

            this.handlingUpdate = false;
        }
    }

    /**
     * The IVisual.enumerateObjectInstances function
     * Enumerates the instances for the objects that appear in the power bi panel
     */
    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] {
        let instances = [] as VisualObjectInstance[];
        const otherInstances = this.visualSettings.buildEnumerationObjects(options.objectName, this.dataView, false);
        if (otherInstances && otherInstances.length) {
            instances = instances.concat(otherInstances);
        }
        return options.objectName === "layout" ? <any>{} : instances.filter(n => Object.keys(n.properties).length > 0);
    }

    /**
     * The IVisual.destroy function
     * Destroys this visual
     */
    public destroy() {
        if (!this.destroyed) {
            if (this.listeners) {
                this.listeners.forEach(n => n.destroy());
                this.listeners.length = 0;
            }
            if (this.tableSorter) {
                this.tableSorter.destroy();
                delete this.tableSorter;
            }
            this.destroyed = true;
        }
    }

    /**
     * Restores the selection from PowerBI
     */
    private restoreSelection() {
        const objects = get(this.dataView, (d) => d.metadata.objects);
        const filterProperty = { objectName: "general", propertyName: "filter" };
        const objFilter = dataview.DataViewObjects.getValue(objects, filterProperty);
        const selection = filter.FilterManager.restoreSelectionIds(objFilter as any);
        this.setSelectionOnSelectionManager(selection);

        // Restore the selection to tablesorter if necessary
        const idMap = (selection || []).reduce((acc, cur) => { acc[cur.getKey()] = 1; return acc; }, {});
        const rows = ((this._data ? this._data.data : undefined) || []).filter(n => !!idMap[n.id]);
        this.tableSorter.selection = rows;
    }

    /**
     * A debounced version of the selection changed event listener
     * @param rows The rows that are selected
     */
    private onSelectionChanged(rows?: ITableSorterVisualRow[]) {
        const { multiSelect } = this.tableSorter.settings.selection;
        const ids = (rows || []).map(n => n.identity);
        const selectors = ids.map(n => n.getSelector());

        this.setSelectionOnSelectionManager(ids);

        // Since we have selection within the selectionManager, apply the filter
        this.selectionManager.applySelectionFilter();

        // calls host.onSelect
        this.setSelectionOnSelectionManager(ids, true);
    }

    /**
     * Sets the selected ids on the selection manager
     * @param ids The ids to select
     * @param forceManual If true, selection will be performed through selectionManager.select method
     */
    private setSelectionOnSelectionManager(ids: powerbi.visuals.ISelectionId[], forceManual = false) {
        const selectIds = () => {
            if (ids.length > 0 && this.selectionManager.select) {
                this.selectionManager.select(ids);
            } else if (this.selectionManager.clear) {
                this.selectionManager.clear();
            }
        };

        // This avoids an extra host.onSelect call, which causes visuals to repaint
        if (!forceManual && this.selectionManager["setSelectionIds"]) {
            this.selectionManager["setSelectionIds"](ids);
        } else if (!forceManual && this.selectionManager["selectedIds"]) {
            this.selectionManager["selectedIds"] = ids;
        } else {
            selectIds();
        }
    }

    /**
     * Returns true if the layout has changed in the PBI settings
     * @param updateType The current update type that caused this check
     * @param options The update options that caused this check
     */
    private hasLayoutChanged(updateType: UpdateType, options: VisualUpdateOptions) {
        if (updateType & UpdateType.Settings &&
            options.dataViews && options.dataViews.length) {
            if (this.dataView.metadata && this.dataView.metadata.objects && this.dataView.metadata.objects["layout"]) {
                // Basically string compares the two layouts to see if anything has changed
                const layoutChanged = this.dataView.metadata.objects["layout"]["layout"] !== JSON.stringify(this.tableSorter.configuration);
                if (layoutChanged) {
                    log("Layout changed!");
                }
                return layoutChanged;
            }
        }
        return false;
    }

    /**
     * Handles all of the data loading required from power bi during an update call
     * @param oldSettings The settings before the update
     * @param updateType The type of update being performed
     */
    private loadDataFromPowerBI(oldSettings: TSSettings, updateType: UpdateType) {
        if (this.dataViewTable) {
            const rankSettings = this.visualSettings.rankSettings;
            const oldRankSettings = oldSettings.rankSettings;
            const newData = converter(
                this.dataView,
                this.selectionManager.getSelectionIds(),
                rankSettings as any,
                () => this.host.createSelectionIdBuilder());

            const config = buildConfig(
                this.dataView,
                newData.data,
                rankSettings,

                // We really only want to reset the rank columns IF the user is JUST toggling the reverse option,
                // Otherwise, this can just be true if we are loading from a refresh
                oldRankSettings.reverseBars !== rankSettings.reverseBars && updateType === UpdateType.Settings,
                rankSettings.reverseBars);
            const selectedRows = newData.data.filter(n => n.selected);

            this.tableSorter.configuration = config;
            this._data = newData;
            if (this.loadResolver) {
                log("Resolving additional data");
                const resolver = this.loadResolver;
                delete this.loadResolver;
                resolver(newData.data);
            } else {
                log("Loading data into MyDataProvider");
                const domainInfo = config.columns
                    .filter(n => !!n.domain)
                    .reduce((a, b) => { a[b.column] = b.domain; return a; }, {});
                this.tableSorter.dataProvider = this.createDataProvider(newData, domainInfo);
            }
            this.tableSorter.selection = selectedRows;
        }
    }

    /**
     * Loads the settings object from PBI during an update call
     * @param oldState The state before the update call
     * @param newState The state during the update call
     */
    private loadSettingsFromPowerBI(oldState: TSSettings, newState: TSSettings) {
        if (this.dataView) {
            // Make sure we have the default values
            const updatedSettings: ITableSorterSettings =
                $.extend(true,
                    {},
                    this.tableSorter.settings,
                    TableSorterVisual.VISUAL_DEFAULT_SETTINGS,
                    this.initialSettings || { },
                    newState.toJSONObject());

            const unitsOrPrecisionChanged =
                oldState.presentation.labelPrecision !== newState.presentation.labelPrecision ||
                oldState.presentation.labelDisplayUnits !== newState.presentation.labelDisplayUnits;

            // If the units or precision changes, we need to update the formatter
            if (unitsOrPrecisionChanged) {
                this.numberFormatter = formatting.valueFormatter.create({
                    value: newState.presentation.labelDisplayUnits || 0,
                    format: "0",
                    precision: newState.presentation.labelPrecision || this.defaultPrecision,
                });
            }

            // If the header text color changes, we need to set the style
            const newHeaderTextColor = newState.presentation.headerTextColor;
            if (oldState.presentation.headerTextColor !== newHeaderTextColor) {
                this.element.find(".lu-header").css("color", newHeaderTextColor || ""); // tslint:disable-line
            }

            // If these things change, we need to force a rerender
            if (unitsOrPrecisionChanged ||
                (oldState.rankSettings.histogram !== newState.rankSettings.histogram) ||
                (oldState.presentation.textColor !== newState.presentation.textColor)) {
                this.tableSorter.rerenderValues();
            }

            this.tableSorter.settings = updatedSettings;

            this.restoreSelection();
        }
    }

    /**
     * Creates a data provider with the given set of data
     * @param newData The data to load
     */
    private createDataProvider(newData: { data: any[] }, domainInfo: any) {
        return new MyDataProvider(newData.data, domainInfo);
    }

    /**
     * The cell formatter for TableSorter
     * @param selection The d3 selection for the cells being formatted.
     */
    private cellFormatter(selection: d3.Selection<ICellFormatterObject>) {
        const getColumnColor = (d: ICellFormatterObject) => {
            if (this._data && this._data.rankingInfo) {
                const { values, column, colors: rankColors } = this._data.rankingInfo;
                const cellColName = d.column && d.column.column && d.column.column.column;
                const rankColName = column.displayName;

                // If this is  the column we are ranking, then color it
                return cellColName === rankColName ? rankColors[d.row[rankColName]] : undefined;
            }
        };
        const rankHistogram = this.visualSettings.rankSettings.histogram;
        const isConfidence = (d: ICellFormatterObject) => {
            // Path: Object -> Layout Column -> Lineup Column -> Config
            const config = get(d, v => v.column.column.config, {});
            return config.isConfidence;
        };
        selection
            .style({
                "background": (d) => {
                    return rankHistogram && isConfidence(d) && d.label > 1 ?
                        vendorPrefix + `linear-gradient(bottom, rgba(0,0,0,.2) ${d.label}%, rgba(0,0,0,0) ${d.label}%)` :
                        getColumnColor(d);
                },
                "width": (d) => `${d["width"] + (rankHistogram && isConfidence(d) ? 2 : 0)}px`,
                "margin-left": (d) => rankHistogram && isConfidence(d) ? `-1px` : undefined,
                "color": (d) => {
                    if (this.visualSettings.presentation.textColor) {
                        return this.visualSettings.presentation.textColor;
                    }
                    const color = getColumnColor(d) || "#ffffff";
                    const d3Color = d3.hcl(color);
                    return d3Color.l <= 60 ? "#ececec" : "#333333";
                },
            })
            .text((d) => isConfidence(d) && (d.label + "") === "0" ? " - " : d.label);
    }
}

/**
 * Updates the data to have the current values of the ranking info, by taking into account filtering and sorting.
 * @param rankingInfo The ranking info to use when updating the column values
 * @param data The current set of data
 */
function updateRankingColumns(rankingInfo: IRankingInfo, data: ITableSorterRow[]) {
    "use strict";
    if (rankingInfo) {
        // const data = this._data.data;
        const ranks = rankingInfo.values.slice(0).reverse();
        const runningRankTotal = {};
        const rankCounts = {};
        data.forEach(result => {
            const itemRank = result[rankingInfo.column.displayName];
            ranks.forEach(rank => {
                if (LOWER_NUMBER_HIGHER_VALUE ? (itemRank <= rank) : (itemRank >= rank)) {
                    rankCounts[rank] = (rankCounts[rank] || 0) + 1;
                }
            });
        });
        const precision = Math.max((data.length + "").length - 2, 0);
        data.forEach((result, j) => {
            // The bucket that this item belongs to
            const itemRank = result[rankingInfo.column.displayName];

            // Go through each bucket in the entire dataset
            for (const rank of ranks) {
                const positionInBucket = runningRankTotal[rank] = runningRankTotal[rank] || 0;
                const propName = `GENERATED_RANK_LEVEL_${rank}`;
                let value = 0;
                if (LOWER_NUMBER_HIGHER_VALUE ? (itemRank <= rank) : (itemRank >= rank)) {
                    const position = ((rankCounts[rank] - runningRankTotal[rank]) / rankCounts[rank]) * 100;
                    value = parseFloat(position.toFixed(precision));
                    runningRankTotal[rank] = positionInBucket + 1;
                }
                result[propName] = value;
            }
        });
    }
}

/**
 * Returns true if any of the color settings have changed.
 * @param state The previous state
 * @param newState The new state
 */
function hasColorSettingsChanged(state: TSSettings, newState: TSSettings) {
    "use strict";
    if (state && newState) {
        const oldSettings = get(state, v => v.rankSettings, {});
        const newSettings = get(newState, v => v.rankSettings, {});
        const oldGradient = get(state, v => v.rankSettings.rankGradients, {});
        const newGradient = get(newState, v => v.rankSettings.rankGradients, {});
        const changed =
            oldSettings.reverseBars !== newSettings.reverseBars ||
            oldSettings.colorMode !== newSettings.colorMode ||
            oldGradient.endColor !== newGradient.endColor ||
            oldGradient.startColor !== newGradient.startColor ||
            oldGradient.endValue !== newGradient.endValue ||
            oldGradient.startValue !== newGradient.startValue;
        if (!changed) {
            const oldSeriesColors = oldSettings.rankInstanceColors || {};
            const newSeriesColors = newSettings.rankInstanceColors || {};

            // If the entries are different, or any of the values are different
            return !isEqual(Object.keys(oldSeriesColors), Object.keys(newSeriesColors)) ||
                Object.keys(oldSeriesColors).filter(n => newSeriesColors[n] !== oldSeriesColors[n]).length > 0;
        }
        return changed;
    }
    return true;
}
