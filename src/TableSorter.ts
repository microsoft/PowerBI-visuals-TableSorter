import { default as EventEmitter } from "../base/EventEmitter";
import { logger } from "essex.powerbi.base";
import { JSONDataProvider } from "./providers/JSONDataProvider";
import * as _  from "lodash";
import * as d3 from "d3";
import {
    IQueryOptions,
    IQueryResult,
    IDataProvider,
    ITableSorterColumn,
    ITableSorterRow,
    ITableSorterSettings,
    ITableSorterConfiguration,
    ITableSorterSort,
    ITableSorterFilter,
} from "./models";
import * as $ from "jquery";
/* tslint:disable */
const LineUpLib = require("lineup-v1");
const log = logger("essex:widget:tablesorter:TableSorter");
const EVENTS_NS = ".lineup";
/* tslint:enable */

/**
 * Thin wrapper around the lineup library
 */
export class TableSorter {

    /**
     * A quick reference for the providers
     */
    public static PROVIDERS = {
        JSON: JSONDataProvider
    };

    /**
     * The list of events that we expose
     */
    public static EVENTS = {
        SORT_CHANGED: "sortChanged",
        FILTER_CHANGED: "filterChanged",
        CONFIG_CHANGED: "configurationChanged",
        SELECTION_CHANGED: "selectionChanged",
        LOAD_MORE_DATA: "loadMoreData",
        CLEAR_SELECTION: "clearSelection",
    };

    /**
     * Represents the settings
     */
    public static DEFAULT_SETTINGS: ITableSorterSettings = {
        selection: {
            singleSelect: true,
            multiSelect: false,
        },
        presentation: {
            columnColors: <any>d3.scale.category20(),
            stacked: true,
            values: false,
            histograms: true,
            animation: true,
            tooltips: false,
        },
    };

    /**
     * The default numbering format to use when formatting numbers to display in lineup
     */
    public static DEFAULT_NUMBER_FORMATTER = d3.format(".3n");

    /**
     * Returns true if the given object is numeric
     */
    private static isNumeric = (obj: any) => (obj - parseFloat(obj) + 1) >= 0;

    /**
     * My lineup instance
     */
    public lineupImpl: any;

    /**
     * The dimensions
     */
    private _dimensions: { width: number; height: number; };

    /**
     * The currently loading promise
     */
    private loadingPromise: PromiseLike<any>;

    /**
     * The set of options used to query for new data
     */
    private queryOptions: IQueryOptions = { };

    /**
     * Represents the last query that we performed
     */
    private lastQuery: IQueryOptions;

    /**
     * My element
     */
    private element: JQuery;

    /**
     * THe current set of data in this lineup
     */
    private _data: ITableSorterRow[];

    /**
     * The current configuration of the LineUp instance
     */
    private _configuration: ITableSorterConfiguration;

    /**
     * Whether or not we are currently saving the configuration
     */
    private savingConfiguration: boolean;

    /**
     * True if we are currently sorting lineup per the grid
     */
    private sortingFromConfig: boolean;

    /**
     * Whether or not this is destroyed
     */
    private destroyed: boolean;

    /**
     * The template for the grid
     */
    private template: string = `
        <div class="lineup-component">
            <div class="nav">
                <ul>
                    <li class="clear-selection" title="Clear Selection">
                        <a>
                            <span class="fa-stack">
                                <i class="fa fa-check fa-stack-1x"></i>
                                <i class="fa fa-ban fa-stack-2x"></i>
                            </span>
                        </a>
                    </li>
                    <li class="add-column" title="Add Column">
                        <a>
                            <span class="fa-stack">
                                <i class="fa fa-columns fa-stack-2x"></i>
                                <i class="fa fa-plus-circle fa-stack-1x"></i>
                            </span>
                        </a>
                    </li>
                    <li class="add-stacked-column" title="Add Stacked Column">
                        <a>
                            <span class="fa-stack">
                                <i class="fa fa-bars fa-stack-2x"></i>
                                <i class="fa fa-plus-circle fa-stack-1x"></i>
                            </span>
                        </a>
                    </li>
                </ul>
                <hr/>       
            </div>
            <div style="position:relative">
                <div class="grid"></div>
                <div class='load-spinner'><div>
            </div>
        </div>
    `.trim();

    /**
     * A boolean indicating whehter or not we are currently loading more data
     */
    private _loadingData = false;
    private get loadingData() {
        return this._loadingData;
    }

    /**
     * Setter for if we are loading data
     */
    private _toggleClass = _.debounce(() => this.element.toggleClass("loading", this.loadingData), 100);
    private set loadingData(value: boolean) {
        this._loadingData = value;
        if (value) {
            this.element.addClass("loading");
        }
        this._toggleClass();
    }

    private _selectedRows: ITableSorterRow[] = [];
    private _eventEmitter: EventEmitter;
    private _settings: ITableSorterSettings = $.extend(true, {}, TableSorter.DEFAULT_SETTINGS);
    /**
     * The configuration for the lineup viewer
     */
    private lineUpConfig: ITableSorterSettings = <any>{
        svgLayout: {
            mode: "separate"
        },
        numberformat: (d: number) => {
            const formatter =
                this.settings.presentation.numberFormatter || TableSorter.DEFAULT_NUMBER_FORMATTER;
            return formatter(d);
        },
        interaction: {
            multiselect: () => this.settings.selection.multiSelect
        },
        sorting: {
            external: true
        },
        filtering: {
            external: true
        },
        histograms: {
            generator: (columnImpl: any, callback: Function) => this.generateHistogram(columnImpl, callback)
        },
    };

    /**
     * Constructor for the lineups
     */
    constructor(element: JQuery, dataProvider?: IDataProvider) {
        this.element = $(this.template);
        this.element.find(".clear-selection").on("click", () => {
            if (this.lineupImpl) {
                this.lineupImpl.clearSelection();
            }
            this.raiseClearSelection();
        });
        this.element.find(".add-column").on("click", () => {
            if (this.lineupImpl) {
                this.lineupImpl.addNewSingleColumnDialog();
            }
        });
        this.element.find(".add-stacked-column").on("click", () => {
            if (this.lineupImpl) {
                this.lineupImpl.addNewStackedColumnDialog();
            }
        });
        this._eventEmitter = new EventEmitter();
        element.append(this.element);
        this.loadingData = true;

        if (dataProvider) {
            this.dataProvider = dataProvider;
        }
    }

    /**
     * getter for the dimensions
     */
    public get dimensions() {
        return this._dimensions;
    }

    /**
     * Resizer function to update lineups rendering
     */
    private bodyUpdater = _.debounce(() => {
        if (this.lineupImpl) {
            this.lineupImpl.updateBody();
        }
    }, 100);

    /**
     * setter for the dimensions
     */
    public set dimensions(value) {
        this._dimensions = value;
        if (this.lineupImpl && this.lineupImpl.$container && value) {
            const wrapper = $(this.lineupImpl.$container.node()).find("div.lu-wrapper");
            wrapper.css({
                height: (value.height - wrapper.offset().top - 2) + "px",
                width: "100%",
            });
        }
        this.bodyUpdater();
    }

    /**
     * Gets the data provider
     */
    private _dataProvider: IDataProvider;
    public get dataProvider() {
        return this._dataProvider;
    }

    /**
     * Sets the data provider to use
     * TODO: Evaluate whether or not this should just be a ctor arg
     */
    public set dataProvider(dataProvider: IDataProvider) {
        // Reset query vars
        this.loadingData = false;
        this.lastQuery = undefined;

        this._dataProvider = dataProvider;
        if (this._dataProvider) {
            this.runQuery(true);
        } else if (this.lineupImpl) {
            this.lineupImpl.destroy();
            delete this.lineupImpl;
        }
    }

    /**
     * Gets the current set of data loaded into tablesorter
     */
    public get data() {
        return this._data.slice(0);
    }

    /**
     * Gets the events object
     */
    public get events() {
        return this._eventEmitter;
    }

    /**
     * Gets the settings
     */
    public get settings() {
        return this._settings;
    }

    /**
     * Gets the current selection
     */
    public get selection() {
        return this._selectedRows;
    }

    /**
     * Sets the selection of lineup
     */
    public set selection(value: ITableSorterRow[]) {
        this._selectedRows = value;
        if (this.lineupImpl) {
            this.lineupImpl.select(value);
        }
    }

    /**
     * Sets the settings
     */
    public set settings(value: ITableSorterSettings) {
        let newSettings: ITableSorterSettings = $.extend(true, {}, TableSorter.DEFAULT_SETTINGS, value);
        newSettings.selection.singleSelect = !newSettings.selection.multiSelect;

        /** Apply the settings to lineup */
        if (this.lineupImpl) {
            let presProps = newSettings.presentation;
            for (let key in presProps) {
                if (presProps.hasOwnProperty(key)) {
                    this.lineupImpl.changeRenderingOption(key, presProps[key]);
                }
            }
            this.lineupImpl.changeInteractionOption("tooltips", newSettings.presentation.tooltips);
        }

        this.lineUpConfig["columnColors"] = newSettings.presentation.columnColors;

        // Sets the tooltips configuration
        this.lineUpConfig["interaction"].tooltips = newSettings.presentation.tooltips;

        this._settings = newSettings;
    }

    /**
     * Gets this configuration
     */
    public get configuration(): ITableSorterConfiguration {
        return this._configuration;
    }

    /**
     * Sets the column configuration that is used
     */
    public set configuration(value: ITableSorterConfiguration) {
        this._configuration = value;

        this.queryOptions.sort = value.sort ? [value.sort] : [];

        const primary = value && value.layout && value.layout.primary;
        if (primary) {
            this.queryOptions.query = TableSorter.getFiltersFromLayout(primary);
        }

        this.applyConfigurationToLineup();
    }

    /**
     * Derives the desciption for the given column
     */
    public static createConfigurationFromData(data: ITableSorterRow[]): ITableSorterConfiguration {
        interface IMinMax {
            min?: number;
            max?: number;
        }

        const EXCLUDED_DATA_COLS = {
            selected: true,
            equals: true,
        };

        function getDataColumnNames(): string[] {
            if (data && data.length) {
                return Object.keys(data[0]).filter((k) => !EXCLUDED_DATA_COLS[k]);
            }
            return [];
        }

        function updateMinMax(minMax: IMinMax, value: number) {
            if (+value > minMax.max) {
                minMax.max = value;
            } else if (+value < minMax.min) {
                minMax.min = +value;
            }
        }

        function isNumeric(v: any) {
            // Assume that if null or undefined, it is numeric
            /* tslint:disable */
            return v === 0 || v === null || v === undefined || TableSorter.isNumeric(v);
            /* tslint:enable */
        }

        function analyzeColumn(columnName: string) {
            const minMax: IMinMax = { min: Number.MAX_VALUE, max: 0 };
            const allNumeric = data.every((row) => isNumeric(row[columnName]));
            if (allNumeric) {
                data.forEach((row) => updateMinMax(minMax, row[columnName]));
            }
            return {allNumeric, minMax};
        }

        function createLineUpColumn(colName: string): ITableSorterColumn {
            const result: ITableSorterColumn = { column: colName, type: "string" };
            let { allNumeric, minMax } = analyzeColumn(colName);

            if (allNumeric) {
                result.type = "number";
                result.domain = [minMax.min, minMax.max];
            }

            // If is a string, try to see if it is a category
            if (result.type === "string") {
                let sset = d3.set(data.map((row) => row[colName]));
                if (sset.size() <= Math.max(20, data.length * 0.2)) { // at most 20 percent unique values
                    result.type = "categorical";
                    result.categories = sset.values().sort();
                }
            }
            return result;
        }

        const columns: ITableSorterColumn[] = getDataColumnNames().map(createLineUpColumn);
        return {
            primaryKey: "id",
            columns,
        };
    }

    /**
     * Gets filters from a layout obj
     */
    public static getFiltersFromLayout(layoutObj: any) {
        if (layoutObj) {
            let filters: ITableSorterFilter[] = [];
            layoutObj.forEach((n: any) => {
                if (n.filter) {
                    filters.push({
                        column: n.column,
                        value: n.filter || undefined,
                    });
                } else if (n.domain) {
                    filters.push({
                        column: n.column,
                        value: {
                            domain: n.domain,
                            range: n.range,
                        },
                    });
                }
            });
            return filters;
        }
    }

    /**
     * Gets the sort from lineup
     */
    public getSortFromLineUp(): ITableSorterSort {
        if (this.lineupImpl && this.lineupImpl.storage) {
            let primary = this.lineupImpl.storage.config.columnBundles.primary;
            let col = primary.sortedColumn;
            if (col) {
                if (col.column) {
                    return {
                        column: col.column.column,
                        asc: primary.sortingOrderAsc,
                    };
                }
                let totalWidth = d3.sum(col.childrenWidths);
                return {
                    stack: {
                        name: col.label,
                        columns: col.children.map((a: any, i: number) => {
                            return {
                                column: a.column.column,
                                weight: col.childrenWidths[i] / totalWidth,
                            };
                        }),
                    },
                    asc: primary.sortingOrderAsc,
                };
            }
        }
    }

    /**
     * Gets the current set of query options
     */
    public getQueryOptions() {
        return _.merge({}, this.queryOptions);
    }

    /**
     * Rerenders the values of the rows
     */
    public rerenderValues() {
        if (this.lineupImpl) {
            // Sort of hacky, toggle the values to get it to rerender
            const values = this.settings.presentation.values;
            this.lineupImpl.changeRenderingOption("values", !values);
            this.lineupImpl.changeRenderingOption("values", values);
        }
    }

    /**
     * Function to destroy itself
     */
    public destroy() {
        this.destroyed = true;
        if (this.lineupImpl) {
            /* tslint:disable */ 
            if (this.lineupImpl.listeners) {
                this.lineupImpl.listeners.on(EVENTS_NS, null);
            }
            this.lineupImpl.scrolled = () => {};
            /* tslint:enable */
            this.lineupImpl.destroy();
        }
    }

    /**
     * Checks to see if more data should be loaded based on the viewport
     */
    protected checkLoadMoreData(scroll: boolean) {
        if (!this.destroyed) {
            const scrollElement = $(this.lineupImpl.$container.node()).find("div.lu-wrapper")[0];
            const sizeProp = "Height";
            const posProp = "Top";
            const scrollSize = scrollElement["scroll" + sizeProp];
            const scrollPos = scrollElement["scroll" + posProp];
            const shouldScrollLoad = scrollSize - (scrollPos + scrollElement["client" + sizeProp]) < 200;
            if (shouldScrollLoad && !this.loadingData) {
                return this.runQuery(false);
            }
        }
    }

    /**
     * Runs the current query against the data provider
     */
    private runQuery(newQuery: boolean) {
        // If there is already a thing goin, stop it
        if (newQuery && this.loadingPromise) {
            this.loadingPromise["cancel"] = true;
        }

        if (!this.dataProvider) {
            return;
        }

        // Let everyone know we are loading more data
        this.raiseLoadMoreData();

        // We should only attempt to load more data, if we don't already have data loaded, or there is more to be loaded
        return this.dataProvider.canQuery(this.queryOptions).then((value) => {
            if (value) {
                this.loadingData = true;
                let promise = this.loadingPromise = this.dataProvider.query(this.queryOptions).then(r => {
                    // if this promise hasn't been cancelled
                    if ((!promise || !promise["cancel"]) && !this.destroyed) {
                        this.loadingPromise = undefined;
                        this.loadDataFromQueryResult(r);

                        this.loadingData = false;

                        // make sure we don't need to load more after this, in case it doesn't all fit on the screen
                        setTimeout(() => {
                            this.checkLoadMoreData(false);
                            if (!this.loadingPromise) {
                                this.loadingData = false;
                            }
                        }, 10);
                    }
                }, () => this.loadingData = false);
                return promise;
            } else {
                this.loadingData = false;
            }
        });
    }

    /**
     * Loads data from a query result
     */
    private loadDataFromQueryResult(r: IQueryResult) {
        this._data = this._data || [];
        this._data = r.replace ? r.results : this._data.concat(r.results);

        // derive a description file
        let config = this.configuration ?
            $.extend(true, {}, this.configuration) : TableSorter.createConfigurationFromData(this._data);

        // Primary Key needs to always be ID
        config.primaryKey = "id";

        this.loadLineup(config);

        if (this.lineupImpl) {
            this.lineupImpl.select(this.selection);
        }

        // Reapply the configuration to lineup
        this.applyConfigurationToLineup();

        // Store the configuration after it was possibly changed by load data
        this.saveConfiguration();
    }

    /**
     * Loads the actual lineup impl from the given spec document
     */
    private loadLineup(config: ITableSorterConfiguration) {
        let spec: any = {};
        // spec.name = name;
        spec.dataspec = config;
        delete spec.dataspec.file;
        delete spec.dataspec.separator;
        spec.dataspec.data = this._data;
        spec.storage = LineUpLib.createLocalStorage(this._data, config.columns, config.layout, config.primaryKey);

        if (this.lineupImpl) {
            this.lineupImpl.changeDataStorage(spec);
        } else {
            let finalOptions = $.extend(true, this.lineUpConfig, {
                renderingOptions: $.extend(true, {}, this.settings.presentation)
            });
            this.lineupImpl = LineUpLib.create(spec, d3.select(this.element.find(".grid")[0]), finalOptions);
            this.dimensions = this.dimensions;

            this.attachLineupListeners();

            this.settings = this.settings;
        }
    }

    /**
     * Attaches our event listeners to lineup
     */
    private attachLineupListeners() {
        this.lineupImpl.listeners.on(`change-sortcriteria${EVENTS_NS}`, (ele: JQuery, column: any, asc: boolean) => {
            // This only works for single columns and not grouped columns
            this.onLineUpSorted(column && column.column && column.column.id, asc);
        });
        this.lineupImpl.listeners.on(`multiselected${EVENTS_NS}`, (rows: ITableSorterRow[]) => {
            if (this.settings.selection.multiSelect) {
                this._selectedRows = rows;
                this.raiseSelectionChanged(rows);
            }
        });
        this.lineupImpl.listeners.on(`selected${EVENTS_NS}`, (row: ITableSorterRow) => {
            if (!this.settings.selection.multiSelect) {
                this._selectedRows = row ? [row] : [];
                this.raiseSelectionChanged(this.selection);
            }
        });
        this.lineupImpl.listeners.on(`columns-changed${EVENTS_NS}`, () => this.onLineUpColumnsChanged());
        this.lineupImpl.listeners.on(`change-filter${EVENTS_NS}`, (x: JQuery, column: any) => this.onLineUpFiltered(column));
        let scrolled = this.lineupImpl.scrolled;
        let me = this;

        // The use of `function` here is intentional, we need to pass along the correct scope
        this.lineupImpl.scrolled = function(...args: any[]) {
            me.checkLoadMoreData(true);
            return scrolled.apply(this, args);
        };
    }

    /**
     * Generates the histogram for lineup
     */
    private generateHistogram(columnImpl: any, callback: Function) {
        let column = this.getColumnByName(columnImpl.column.column);
        this.dataProvider.generateHistogram(column, this.queryOptions).then((h) => {
            let perc = 1 / h.length;
            let values = h.map((v, i) => ({
                x: perc * i,
                y: v,
                dx: perc,
            }));
            callback(values);
        });
    }

    /**
     * Retrieves our columns by name
     */
    private getColumnByName(colName: string) {
        return this.configuration && this.configuration.columns && this.configuration.columns.filter(c => c.column === colName)[0];
    }

    /**
     * Gets the current list of filters from lineup
     */
    private getFiltersFromLineup(filteredColumn?: any) {
        let fDesc = filteredColumn && filteredColumn.description();
        let descs = this.lineupImpl.storage.getColumnLayout()
            .map(((d: any) => {
                // Because of how we reload the data while filtering, the columns can get out of sync
                let base = d.description();
                if (fDesc && fDesc.column === base.column) {
                    base = fDesc;
                    d = filteredColumn;
                }
                if (d.scale) {
                    base.domain = d.scale.domain();
                }
                return base;
            }));
        let filters: ITableSorterFilter[] = [];
        descs.forEach((n: any) => {
            if (n.filter) {
                filters.push({
                    column: n.column,
                    value: n.filter || undefined,
                });
            } else if (n.domain) {
                filters.push({
                    column: n.column,
                    value: {
                        domain: n.domain,
                        range: n.range,
                    },
                });
            }
        });
        return filters;
    }

    /**
     * Returns a configuration based on lineup settings
     */
    private getConfigurationFromLineup(filteredColumn?: any) {
        // HACK: filteredColumn is ghetto fix, cause when we filter a column, we reload lineup with new data/columns
        // but the UI remains open, and has a reference to an old column.
        // full spec
        let dataSpec: any = this.lineupImpl.spec.dataspec;
        let s: ITableSorterConfiguration = $.extend(true, {}, {
            columns: dataSpec.columns.map((n: any) => {
                return _.merge({}, n, {
                    // domain: [0, 40000]
                });
            }),
            primaryKey: dataSpec.primaryKey,
        });
        // create current layout
        let descs = this.lineupImpl.storage.getColumnLayout()
            .map((d: any) => {
                let base = d.description();
                if (filteredColumn) {
                    const fDesc = filteredColumn.description();
                    if (fDesc.column === base.column) {
                        base = fDesc;
                        d = filteredColumn;
                    }
                }
                let result = _.merge({}, base, {
                    domain: d.scale ? d.scale.domain() : undefined
                });
                // If it is set to false or whatever, just remove it
                if (!result.filter) {
                    delete result.filter;
                }
                return result;
            });
        // s.filters = this.getFiltersFromLineup();
        s.layout = _.groupBy(descs, (d: any) => d.columnBundle || "primary");
        const lineupSort = this.getSortFromLineUp();
        if (lineupSort) {
            s.sort = lineupSort;
        }
        return s;
    }

    /**
     * Saves the current layout
     */
    private saveConfiguration(filteredColumn?: any) {
        if (!this.savingConfiguration) {
            const currentConfig = this.configuration;
            const newConfig = this.getConfigurationFromLineup(filteredColumn);
            if (!_.isEqual(currentConfig, newConfig)) {
                this.savingConfiguration = true;
                this.configuration = newConfig;
                this.raiseConfigurationChanged(this.configuration, currentConfig);
                this.savingConfiguration = false;
            }
        }
    }

    /**
     * Applies our external config to lineup
     */
    private applyConfigurationToLineup() {
        if (this.lineupImpl) {
            let currentSort = this.getSortFromLineUp();
            if (this.configuration && this.configuration.sort && (!currentSort || !_.isEqual(currentSort, this.configuration.sort))) {
                this.sortingFromConfig = true;
                let sort = this.configuration.sort;
                this.lineupImpl.sortBy(sort.stack ? sort.stack.name : sort.column, sort.asc);
                this.sortingFromConfig = false;
            }
        }
    }

    /**
     * Listener for when the lineup columns are changed.
     */
    private onLineUpColumnsChanged() {
        this.saveConfiguration();
    }

    /**
     * Listener for line up being sorted
     */
    private onLineUpSorted(column: string, asc: boolean) {
        if (!this.sortingFromConfig) {
            this.saveConfiguration();
            this.raiseSortChanged(column, asc);
            let newSort = this.getSortFromLineUp();

            // Set the new sort value
            this.queryOptions.sort = newSort ? [newSort] : undefined;

            if (this.dataProvider && this.dataProvider.sort) {
                this.dataProvider.sort(newSort);
            }

            // We are starting over since we sorted
            this.runQuery(true);
        }
    }

    /**
     * Listener for lineup being filtered
     */
    private onLineUpFiltered(column: any) {
        let colName = column.column && column.column.column;
        let ourColumn = this.configuration.columns.filter(n => n.column === colName)[0];
        let filter: ITableSorterFilter;
        if (ourColumn.type === "number") {
            filter = {
                column: colName,
                value: {
                    domain: column.scale.domain(),
                    range: column.scale.range(),
                },
            };
        } else {
            filter = {
                column: colName,
                value: column.filter || undefined,
            };
        }

        const newFilters = this.getFiltersFromLineup(column);
        if (!_.isEqual(newFilters, this.queryOptions.query)) {
            this.saveConfiguration(column);
            this.raiseFilterChanged(filter);

            // Set the new filter value
            this.queryOptions.query = this.getFiltersFromLineup(column);

            if (this.dataProvider && this.dataProvider.filter) {
                this.dataProvider.filter(filter);
            }

            // We are starting over since we filtered
            this.runQuery(true);
        }
    }

    /**
     * Raises the configuration changed event
     */
    private raiseConfigurationChanged(configuration: ITableSorterConfiguration, oldConfig: ITableSorterConfiguration) {
        this.events.raiseEvent(TableSorter.EVENTS.CONFIG_CHANGED, configuration, oldConfig);
    }

    /**
     * Raises the filter changed event
     */
    private raiseSortChanged(column: string, asc: boolean) {
        this.events.raiseEvent(TableSorter.EVENTS.SORT_CHANGED, column, asc);
    }

    /**
     * Raises the filter changed event
     */
    private raiseFilterChanged(filter: any) {
        this.events.raiseEvent(TableSorter.EVENTS.FILTER_CHANGED, filter);
    }

    /**
     * Raises the selection changed event
     */
    private raiseSelectionChanged(rows: ITableSorterRow[]) {
        this.events.raiseEvent(TableSorter.EVENTS.SELECTION_CHANGED, rows);
    }

    /**
     * Raises the load more data event
     */
    private raiseLoadMoreData() {
        this.events.raiseEvent(TableSorter.EVENTS.LOAD_MORE_DATA);
    }

    /**
     * Raises the load more data event
     */
    private raiseClearSelection() {
        this.events.raiseEvent(TableSorter.EVENTS.CLEAR_SELECTION);
    }
}
