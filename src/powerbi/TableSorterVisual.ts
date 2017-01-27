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

import { VisualBase, Visual, logger } from "essex.powerbi.base";
import { updateTypeGetter, UpdateType, createPropertyPersister, PropertyPersister } from "essex.powerbi.base/src/lib/Utils";
import { TableSorter  } from "../TableSorter";
import { dateTimeFormatCalculator } from "./Utils";
import {
    ITableSorterRow,
    ITableSorterSettings,
    ITableSorterSort,
    ITableSorterFilter,
    INumericalFilter,
} from "../models";
import { Promise } from "es6-promise";
import capabilities from "./TableSorterVisual.capabilities";
import MyDataProvider from "./TableSorterVisual.dataProvider";
import buildConfig from "./ConfigBuilder";
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

/* tslint:disable */
const log = logger("essex:widget:TableSorterVisual");
const colors = require("essex.powerbi.base/src/colors");
const CSS_MODULE = require("!css!sass!./css/TableSorterVisual.scss");
/* tslint:enable */

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
    private dataView: powerbi.DataView;
    private host: IVisualHostServices;
    private selectionManager: SelectionManager;
    private waitingForMoreData: boolean;
    private waitingForSort: boolean;
    private handlingUpdate: boolean;
    private updateType: () => UpdateType;
    private propertyPersister: PropertyPersister;

    // Stores our current set of data.
    private _data: { data: ITableSorterVisualRow[], cols: string[] };

    /**
     * My css module
     */
    private myCssModule: any;

    /**
     * The initial set of settings to use
     */
    private initialSettings: ITableSorterSettings;

    /**
     * The display units for the values
     */
    private labelDisplayUnits = 0;

    /**
     * The precision to use with the values
     */
    private labelPrecision: number;

    /**
     * The formatter to use for numbers
     */
    private numberFormatter: IValueFormatter;

    /**
     * The current load promise
     */
    private loadResolver: (data: any[]) => void;

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
     * Selects the given rows
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
     */
    public constructor(noCss: boolean = false, initialSettings?: ITableSorterSettings, updateTypeGetterOverride?: () => UpdateType) {
        super(noCss);
        this.initialSettings = initialSettings || {
            presentation: {
                numberFormatter: (d: number) => this.numberFormatter.format(d),
            },
        };

        const className = CSS_MODULE && CSS_MODULE.locals && CSS_MODULE.locals.className;
        if (className) {
            this.element.addClass(className);
        }

        this.numberFormatter = valueFormatterFactory({
            value: this.labelDisplayUnits,
            format: "0",
            precision: this.labelPrecision,
        });
        this.updateType = updateTypeGetterOverride ? updateTypeGetterOverride : updateTypeGetter(this);
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
     */
    private static converter(view: DataView, selectedIds: any) {
        let data: ITableSorterVisualRow[] = [];
        let cols: string[];
        if (view && view.table) {
            let table = view.table;
            const dateCols = table.columns.map((n, i) => ({ idx: i, col: n })).filter(n => n.col.type.dateTime).map(n => {
                return {
                    idx: n.idx,
                    col: n.col,
                    calculator: dateTimeFormatCalculator(),
                };
            });
            cols = table.columns.filter(n => !!n).map(n => n.displayName);
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
        };
    }

    /** This is called once when the visual is initialially created */
    public init(options: VisualInitOptions): void {
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
        this.tableSorter.events.on("selectionChanged", (rows: ITableSorterVisualRow[]) => this.onSelectionChanged(rows));
        this.tableSorter.events.on(TableSorter.EVENTS.CLEAR_SELECTION, () => this.onSelectionChanged());
        this.tableSorter.events.on("configurationChanged", (config: any) => {
            if (!this.handlingUpdate) {
                this.configurationUpdater();
            }
        });

        this.dimensions = { width: options.viewport.width, height: options.viewport.height };
    }

    /** Update is called for data updates, resizes & formatting changes */
    public update(options: VisualUpdateOptions) {
        const updateType = this.updateType();
        this.handlingUpdate = true;
        this.dataView = options.dataViews && options.dataViews[0];
        this.dataViewTable = this.dataView && this.dataView.table;
        log("Update Type: ", updateType);
        super.update(options);

        // Assume that data updates won't happen when resizing
        const newDims = { width: options.viewport.width, height: options.viewport.height };
        if ((updateType & UpdateType.Resize)) {
            this.dimensions = newDims;
        }

        if (updateType & UpdateType.Settings) {
            this.loadSettingsFromPowerBI();
        }

        if (updateType & UpdateType.Data ||
            // If the layout has changed, we need to reload table sorter
            this.hasLayoutChanged(updateType, options) ||

            // The data may not have changed, but we are loading
            // Necessary because sometimes the user "changes" the filter, but it doesn't actually change the dataset. 
            // ie. If the user selects the min value and the max value of the dataset as a filter.
            this.loadResolver) {
            // If we explicitly are loading more data OR If we had no data before, then data has been loaded
            this.waitingForMoreData = false;
            this.waitingForSort = false;

            this.loadDataFromPowerBI();
        }

        this.handlingUpdate = false;
    }

    /**
     * Enumerates the instances for the objects that appear in the power bi panel
     */
    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] {
        let instances = super.enumerateObjectInstances(options) || [{
            /* tslint:disable */
            selector: null,
            /* tslint:enable */
            objectName: options.objectName,
            properties: {},
        }];
        $.extend(true, instances[0].properties, this.tableSorter.settings[options.objectName]);
        if (options.objectName === "presentation") {
            $.extend(true, instances[0].properties, {
                labelDisplayUnits: this.labelDisplayUnits,
                labelPrecision: this.labelPrecision,
            });
        }
        return options.objectName === "layout" ? <any>{} : instances;
    }

    /**
     * Gets the css used for this element
     */
    protected getCss(): string[] {
        return (super.getCss() || []).concat(CSS_MODULE);
    }

    /**
     * Returns true if the layout has changed in the PBI settings
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
     * Event listener for when the visual data's changes
     */
    private loadDataFromPowerBI() {
        if (this.dataViewTable) {
            let newData = TableSorterVisual.converter(this.dataView, this.selectionManager.getSelectionIds());
            let config = buildConfig(this.dataView, newData.data);
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
                this.tableSorter.dataProvider = this.createDataProvider(newData);
            }
            this.tableSorter.selection = selectedRows;
        }
    }

    /**
     * Creates a data provider with the given set of data
     */
    private createDataProvider(newData: { data: any[] }) {
        let firstLoad = true;
        return new MyDataProvider(
            newData.data,
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
     * Listener for when the visual settings changed
     */
    private loadSettingsFromPowerBI() {
        if (this.dataView) {
            // Make sure we have the default values
            let updatedSettings: ITableSorterSettings =
                $.extend(true, {}, this.tableSorter.settings, TableSorterVisual.VISUAL_DEFAULT_SETTINGS, this.initialSettings || {});

            // Copy over new values
            let newObjs = $.extend(true, {}, <ITableSorterSettings>this.dataView.metadata.objects);
            const presObjs = newObjs && newObjs.presentation;
            if (newObjs) {
                for (let section in newObjs) {
                    if (newObjs.hasOwnProperty(section)) {
                        let values = newObjs[section];
                        for (let prop in values) {
                            if (updatedSettings[section] && typeof(updatedSettings[section][prop]) !== "undefined") {
                                updatedSettings[section][prop] = values[prop];
                            }
                        }
                    }
                }
            }

            let newLabelPrecision = (presObjs && presObjs.labelPrecision) || 0;
            let newLabelDisplayUnits = (presObjs && presObjs.labelDisplayUnits) || 0;
            if (newLabelPrecision !== this.labelPrecision ||
                newLabelDisplayUnits !== this.labelDisplayUnits) {
                this.labelPrecision = newLabelPrecision;
                this.labelDisplayUnits = newLabelDisplayUnits;
                this.numberFormatter = valueFormatterFactory({
                    value: this.labelDisplayUnits || 0,
                    format: "0",
                    precision: newLabelPrecision || undefined,
                });
                this.tableSorter.rerenderValues();
            }

            this.tableSorter.settings = updatedSettings;
        }
    }
}

/**
 * The lineup data
 */
interface ITableSorterVisualRow extends ITableSorterRow, powerbi.visuals.SelectableDataPoint {

    /**
     * The expression that will exactly match this row
     */
    filterExpr: powerbi.data.SQExpr;
}
