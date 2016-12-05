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

import {
    VisualBase,
    Visual,
    logger,
    colors,
    updateTypeGetter,
    UpdateType,
    createPropertyPersister,
    PropertyPersister,
    get,
} from "essex.powerbi.base";
import * as $ from "jquery";
import * as d3 from "d3";
import { TableSorter } from "../TableSorter";
import { dateTimeFormatCalculator } from "./Utils";
import {
    ITableSorterRow,
    ITableSorterSettings,
    ITableSorterSort,
    ITableSorterFilter,
    INumericalFilter,
    ICellFormatterObject,
    IColorSettings,
} from "../models";
import { Promise } from "es6-promise";
import capabilities from "./TableSorterVisual.capabilities";
import MyDataProvider from "./TableSorterVisual.dataProvider";
import { default as buildConfig, calculateRankingInfo, calculateRankColors, LOWER_NUMBER_HIGHER_VALUE } from "./ConfigBuilder";
import { DEFAULT_TABLESORTER_SETTINGS } from "../TableSorter.defaults";

import * as _ from "lodash";
import IVisual = powerbi.IVisual;
import DataViewTable = powerbi.DataViewTable;
import IVisualHostServices = powerbi.IVisualHostServices;
import VisualCapabilities = powerbi.VisualCapabilities;
import VisualInitOptions = powerbi.VisualInitOptions;
import VisualUpdateOptions = powerbi.VisualUpdateOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import DataView = powerbi.DataView;
import SelectionId = powerbi.visuals.SelectionId;
import SelectionManager = powerbi.visuals.utility.SelectionManager;
import SQExprBuilder = powerbi.data.SQExprBuilder;
import valueFormatterFactory = powerbi.visuals.valueFormatter.create;
import IValueFormatter = powerbi.visuals.IValueFormatter;
import TSSettings from "./settings";

/* tslint:disable */
const log = logger("essex:widget:TableSorterVisual");
const CSS_MODULE = require("!css!sass!./css/TableSorterVisual.scss");
/* tslint:enable */

/**
 * The visual which wraps TableSorter
 */
@Visual(require("../build.json").output.PowerBI)
export default class TableSorterVisual extends VisualBase implements IVisual {

    /**
     * The set of capabilities for the visual
     */
    public static capabilities: VisualCapabilities = capabilities;

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
    private listeners: { destroy: () => void }[] = [];
    private dataView: powerbi.DataView;
    private host: IVisualHostServices;
    private selectionManager: SelectionManager;
    private waitingForMoreData: boolean;
    private waitingForSort: boolean;
    private handlingUpdate: boolean;
    private updateType: () => UpdateType;
    private propertyPersister: PropertyPersister;
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
    private numberFormatter: IValueFormatter;

    /**
     * The current load promise
     */
    private loadResolver: (data: any[]) => void;

    private visualSettings: TSSettings;

    /**
     * A simple debounced function to update the configuration
     */
    private configurationUpdater = _.debounce(() => {
        const config = this.tableSorter.configuration;
        const objects: powerbi.VisualObjectInstancesToPersist = {
            merge: [
                <VisualObjectInstance>{
                    objectName: "layout",
                    properties: {
                        "layout": JSON.stringify(config),
                    },
                    selector: undefined,
                },
            ],
        };
        log("Updating Config");
        this.propertyPersister.persist(false, objects);
    }, 100);

    /**
     * A debounced version of the selection changed event listener
     * @param rows The rows that are selected
     */
    private onSelectionChanged = _.debounce((rows?: ITableSorterVisualRow[]) => {
        let filter: powerbi.data.SemanticFilter;
        let { multiSelect } = this.tableSorter.settings.selection;
        if (rows && rows.length) {
            let expr = rows[0].filterExpr;

            // If we are allowing multiSelect
            if (rows.length > 0 && multiSelect) {
                rows.slice(1).forEach((r) => {
                expr = powerbi.data.SQExprBuilder.or(expr, r.filterExpr);
                });
            }
            filter = powerbi.data.SemanticFilter.fromSQExpr(expr);
        }

        // rows are what are currently selected in lineup
        if (rows && rows.length) {
            // HACK
            this.selectionManager.clear();
            rows.forEach((r) => this.selectionManager.select(r.identity, true));
        } else {
            this.selectionManager.clear();
        }

        let operation = "merge";
        if (!filter) {
            operation = "remove";
        }

        this.propertyPersister.persist(true, {
            [operation]: [
                <powerbi.VisualObjectInstance>{
                    objectName: "general",
                    selector: undefined,
                    properties: {
                        "filter": filter,
                    },
                },
            ],
        });
    }, 100);

    /**
     * The constructor for the visual
     * @param noCss If true, no css will be loaded
     * @param initialSettings The initial set of settings to use
     * @param updateTypeGetterOverride An override for the update type gettter.
     */
    public constructor(noCss: boolean = false, initialSettings?: ITableSorterSettings, updateTypeGetterOverride?: () => UpdateType) {
        super("TableSorter", noCss);
        this.initialSettings = initialSettings || {
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
        };

        const className = CSS_MODULE && CSS_MODULE.locals && CSS_MODULE.locals.className;
        if (className) {
            this.element.addClass(className);
        }

        this.numberFormatter = valueFormatterFactory({
            value: 0,
            format: "0",
        });
        this.updateType = updateTypeGetterOverride ? updateTypeGetterOverride : updateTypeGetter(this);
        this.visualSettings = TSSettings.create<TSSettings>();
    }

    /* tslint:disable */
    public get template() {
         return `
            <div>
                <div class="lineup"></div>
            </div>
        `.trim().replace(/\n/g, "");
    }
    /* tslint:enable */

    /**
     * Setter for dimensions
     */
    private _dimensions: { width: number; height: number }; // tslint:disable-line
    public set dimensions (value: { width: number; height: number }) {
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
     * Converts the data from power bi to a data we can use
     * @param view The dataview to load
     * @param selectedIds The list of selected ids
     * @param settings The color settings to use when converting the dataView
     */
    private static converter(view: DataView, selectedIds: any, settings?: IColorSettings) {
        let data: ITableSorterVisualRow[] = [];
        let cols: string[];
        let rankingInfo: IRankingInfo;
        if (view && view.table) {
            let table = view.table;
            let baseRi = calculateRankingInfo(view);
            if (baseRi) {
                rankingInfo = <any>baseRi;
                rankingInfo.colors = calculateRankColors(baseRi.values, settings);
            }
            const dateCols = table.columns.map((n, i) => ({ idx: i, col: n })).filter(n => n.col.type.dateTime).map(n => {
                return {
                    idx: n.idx,
                    col: n.col,
                    calculator: dateTimeFormatCalculator(),
                };
            });
            cols = table.columns.filter(n => !!n)/*.filter(n => !n.roles["Confidence"])*/.map(n => n.displayName);
            table.rows.forEach((row, rowIndex) => {
                let identity: any;
                let newId: any;
                if (view.categorical && view.categorical.categories && view.categorical.categories.length) {
                    identity = view.categorical.categories[0].identity[rowIndex];
                    newId = SelectionId.createWithId(identity);
                } else {
                    newId = SelectionId.createNull();
                }

                // The below is busted > 100
                // let identity = SelectionId.createWithId(this.dataViewTable.identity[rowIndex]);
                let result: ITableSorterVisualRow = {
                    id: newId.key + rowIndex,
                    identity: newId,
                    equals: (b) => (<ITableSorterVisualRow>b).identity.equals(newId),
                    filterExpr: identity && identity.expr,
                    selected: !!_.find(selectedIds, (id: SelectionId) => id.equals(newId)),
                };

                // Copy over column data
                row.forEach((colInRow, i) => result[table.columns[i].displayName] = colInRow);

                dateCols.forEach(c => {
                    c.calculator.addToCalculation(result[c.col.displayName]);
                });

                data.push(result);
            });

            dateCols.forEach(n => {
                const formatter = valueFormatterFactory({
                    format: n.col.format || n.calculator.getFormat(),
                });
                data.forEach(result => {
                    result[n.col.displayName] = formatter.format(result[n.col.displayName]);
                });
            });
        }
        return {
            data,
            cols,
            rankingInfo,
        };
    }

    /**
     * The IVIsual.init function
     * Called when the visual is being initialized
     */
    public init(options: VisualInitOptions): void {
        if (!this.destroyed) {
            super.init(options);

            const className = this.myCssModule && this.myCssModule.locals && this.myCssModule.locals.className;
            if (className) {
                this.element.addClass(className);
            }

            this.host = options.host;

            this.propertyPersister = createPropertyPersister(this.host, 100);
            this.selectionManager = new SelectionManager({
                hostServices: options.host,
            });
            this.tableSorter = new TableSorter(this.element.find(".lineup"));
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

            this.dimensions = { width: options.viewport.width, height: options.viewport.height };
        }
    }

    /**
     * The IVisual.update function
     * Called when the visual is being initialized.
     * Update is called for data updates, resizes & formatting changes
     */
    public update(options: VisualUpdateOptions) {
        if (!this.destroyed) {
            const updateType = this.updateType();
            this.handlingUpdate = true;
            this.dataView = options.dataViews && options.dataViews[0];
            this.dataViewTable = this.dataView && this.dataView.table;
            log("Update Type: ", updateType);
            super.update(options);

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
        let instances = (super.enumerateObjectInstances(options) || []) as VisualObjectInstance[];

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
     * Gets the css used for this element
     */
    protected getCss(): string[] {
        return (super.getCss() || []).concat(CSS_MODULE);
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
            let newData = TableSorterVisual.converter(
                this.dataView,
                this.selectionManager.getSelectionIds(),
                rankSettings);

            let config = buildConfig(
                this.dataView,
                newData.data,
                rankSettings,

                // We really only want to reset the rank columns IF the user is JUST toggling the reverse option,
                // Otherwise, this can just be true if we are loading from a refresh
                oldRankSettings.reverseBars !== rankSettings.reverseBars && updateType === UpdateType.Settings,
                rankSettings.reverseBars);
            let selectedRows = newData.data.filter(n => n.selected);

            this.tableSorter.configuration = config;
            this._data = newData;
            if (this.loadResolver) {
                log("Resolving additional data");
                let resolver = this.loadResolver;
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
            let updatedSettings: ITableSorterSettings =
                $.extend(true,
                    {},
                    this.tableSorter.settings,
                    TableSorterVisual.VISUAL_DEFAULT_SETTINGS,
                    this.initialSettings || { },
                    newState.toJSONObject());

            if (oldState.presentation.labelPrecision !== newState.presentation.labelPrecision ||
                oldState.presentation.labelDisplayUnits !== newState.presentation.labelDisplayUnits) {
                this.numberFormatter = valueFormatterFactory({
                    value: newState.presentation.labelDisplayUnits || 0,
                    format: "0",
                    precision: newState.presentation.labelPrecision || undefined,
                });
                this.tableSorter.rerenderValues();
            }

            this.tableSorter.settings = updatedSettings;
        }
    }

    /**
     * Creates a data provider with the given set of data
     * @param newData The data to load
     */
    private createDataProvider(newData: { data: any[] }, domainInfo: any) {
        let firstLoad = true;
        return new MyDataProvider(
            newData.data,
            domainInfo,
            (newQuery) => {
                // If it is a new query
                const canLoadMore = firstLoad || newQuery || !!this.dataView.metadata.segment;
                log(`CanLoadMore: ${canLoadMore}`);
                return canLoadMore;
            },
            (options, newQuery, sortChanged, filterChanged) => {
                firstLoad = false;
                this.waitingForMoreData = true;
                return new Promise((resolve, reject) => {
                    if (newQuery) {
                        if (filterChanged) {
                            this.propertyPersister.persist(false, this.buildSelfFilter(options.query));
                        }
                        if (sortChanged) {
                            this.handleSort(options.sort[0]);
                        }
                    } else {
                        this.host.loadMoreData();
                    }
                    this.loadResolver = resolve;
                });
            });
    }

    /**
     * Handles the sort from the data provider by emitting it to powerbi
     * * Note * Not currently used
     * @param rawSort The sort being performed
     */
    private handleSort(rawSort: ITableSorterSort) {
        /* tslint:disable */
        let args: powerbi.CustomSortEventArgs = null;
        /* tslint:enable */
        if (rawSort) {
            let sorts = [rawSort];
            if (rawSort.stack) {
                sorts = rawSort.stack.columns.map(n => {
                    // TODO: Add Weighting Somehow
                    return {
                        column: n.column,
                        asc: rawSort.asc,
                    };
                });
            }
            let sortDescriptors = sorts.map(sort => {
                let pbiCol = this.dataViewTable.columns.filter((c) => !!c && c.displayName === sort.column)[0];
                return {
                    queryName: pbiCol.queryName,
                    sortDirection: sort.asc ? powerbi.SortDirection.Ascending : powerbi.SortDirection.Descending,
                };
            });
            args = {
                sortDescriptors: sortDescriptors,
            };
        }
        this.waitingForSort = true;
        this.host.onCustomSort(args);
    }

    /**
     * Builds a self filter for PBI from the list of filters
     * @param filters The set of filters that table sorter has applied
     */
    private buildSelfFilter(filters: ITableSorterFilter[]) {
        let operation = "remove";
        let filter: powerbi.data.SemanticFilter;
        if (filters && filters.length) {
            operation = "replace";
            let finalExpr: powerbi.data.SQExpr;
            filters.forEach(m => {
                const col = this.dataViewTable.columns.filter(n => n.displayName === m.column)[0];
                const colExpr = <powerbi.data.SQExpr>col.expr;
                let currExpr: powerbi.data.SQExpr;
                if (typeof m.value === "string") {
                    currExpr = SQExprBuilder.contains(colExpr, SQExprBuilder.text(<string>m.value));
                } else if ((<INumericalFilter>m.value).domain) {
                    const numFilter = m.value as INumericalFilter;
                    currExpr = powerbi.data.SQExprBuilder.between(
                        colExpr,
                        powerbi.data.SQExprBuilder.decimal(numFilter.domain[0]),
                        powerbi.data.SQExprBuilder.decimal(numFilter.domain[1])
                    );
                }
                finalExpr = finalExpr ? powerbi.data.SQExprBuilder.and(finalExpr, currExpr) : currExpr;
            });
            filter = powerbi.data.SemanticFilter.fromSQExpr(finalExpr);
        }
        return {
            [operation]: [
                <powerbi.VisualObjectInstance>{
                    objectName: "general",
                    selector: undefined,
                    properties: {
                        "selfFilter": filter,
                    },
                },
            ],
        };
    }

    /**
     * The cell formatter for TableSorter
     * @param selection The d3 selection for the cells being formatted.
     */
    private cellFormatter(selection: d3.Selection<ICellFormatterObject>) {
        if (this._data && this._data.rankingInfo) {
            const { values, column, colors } = this._data.rankingInfo;
            const getColumnColor = (d: ICellFormatterObject) => {
                const colName = d.column && d.column.column && d.column.column.column;
                return colName !== column.displayName && !d.isRank ?
                    undefined :
                    colors[d.row[column.displayName]];
            };
            selection
                .style({
                    "background-color": getColumnColor,
                    "color": (d) => {
                        const color = getColumnColor(d) || "#ffffff";
                        const d3Color = d3.hcl(color);
                        return d3Color.l <= 60 ? "#ececec" : "#333333";
                    },
                })
                .text((d) => {
                    // Path: Object -> Layout Column -> Lineup Column -> Config
                    const config = get(d, v => v.column.column.config, {});
                    const isConfidence = config.isConfidence;
                    return isConfidence && (d.label + "") === "0" ? " - " : d.label;
                });
        }
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
            for (let i = 0; i < ranks.length; i++) {
                const rank = ranks[i];
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
        let changed =
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
            return !_.isEqual(Object.keys(oldSeriesColors), Object.keys(newSeriesColors)) ||
                Object.keys(oldSeriesColors).filter(n => newSeriesColors[n] !== oldSeriesColors[n]).length > 0;
        }
        return changed;
    }
    return true;
}


/**
 * A simple interface to describe the data requirements for the table sorter visual row
 */
interface ITableSorterVisualRow extends ITableSorterRow, powerbi.visuals.SelectableDataPoint {

    /**
     * The expression that will exactly match this row
     */
    filterExpr: powerbi.data.SQExpr;
}

/**
 * A simple interface to describe the ranking info calculated from a dataView
 */
interface IRankingInfo {
    column: powerbi.DataViewMetadataColumn;
    values: any[];
    colors: {
        [rank: string]: string;
    };
}
