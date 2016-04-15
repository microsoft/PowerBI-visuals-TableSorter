import { default as EventEmitter } from "../base/EventEmitter";
import { JSONDataProvider } from "./providers/JSONDataProvider";
import * as _  from "lodash";
import * as d3 from "d3";
import {
    IQueryOptions,
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
     * Returns true if the given object is numeric
     */
    private static isNumeric = (obj: any) => (obj - parseFloat(obj) + 1) >= 0;

    /**
     * The default count amount
     */
    private static DEFAULT_COUNT = 100;

    /**
     * My lineup instance
     */
    public lineupImpl: any;

    /**
     * The dimensions
     */
    private _dimensions: { width: number; height: number; };

    /**
     * The set of options used to query for new data
     */
    private queryOptions: IQueryOptions = {
        offset: 0,
        count: TableSorter.DEFAULT_COUNT,
    };

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
     * Gets the last scroll position
     */
    private lastScrollPos: number;

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
    private set loadingData(value: boolean) {
        this.element.toggleClass("loading", !!value);
        this._loadingData = value;
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
    constructor(element: JQuery) {
        this.element = $(this.template);
        this.element.find(".clear-selection").on("click", () => {
            this.lineupImpl.clearSelection();
            this.raiseClearSelection();
        });
        this.element.find(".add-column").on("click", () => {
            this.lineupImpl.addNewSingleColumnDialog();
        });
        this.element.find(".add-stacked-column").on("click", () => {
            this.lineupImpl.addNewStackedColumnDialog();
        });
        this._eventEmitter = new EventEmitter();
        element.append(this.element);
        this.loadingData = true;
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
        const wrapper = this.element.find(".lu-wrapper");
        const header = this.element.find(".lu-header");
        const nav = this.element.find(".nav");

        this.bodyUpdater();

        /* tslint:disable */
        wrapper.css({
            width: value ? value.width : null, 
            height: value ? value.height - header.height() - nav.height() : null 
        });  
        /* tslint:enable */
    }

    /**
     * The number of the results to return
     */
    public get count(): number { return this.queryOptions.count || TableSorter.DEFAULT_COUNT; };
    public set count(value: number) {
        this.queryOptions.count = value || TableSorter.DEFAULT_COUNT;
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
     */
    public set dataProvider(dataProvider: IDataProvider) {
        // Reset query vars
        this.queryOptions.offset = 0;
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
        this._selectedRows = this.updateRowSelection(value);
        if (this.lineupImpl) {
            this.lineupImpl.select(value);
        }
    }

    /**
     * Sets the settings
     */
    public set settings(value: ITableSorterSettings) {
        let newSettings: ITableSorterSettings = $.extend(true, {}, TableSorter.DEFAULT_SETTINGS, value);

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

        if (value.sort) {
            this.queryOptions.sort = [value.sort];
        }

        if (value.filters) {
            this.queryOptions.query = value.filters;
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
     * Checks to see if more data should be loaded based on the viewport
     */
    protected checkLoadMoreData(scroll: boolean) {
        // truthy this.dataView.metadata.segment means there is more data to be loaded
        let scrollElement = $(this.lineupImpl.$container.node()).find("div.lu-wrapper")[0];
        let scrollHeight = scrollElement.scrollHeight;
        let top = scrollElement.scrollTop;
        if (!scroll || this.lastScrollPos !== top) {
            this.lastScrollPos = top;
            let shouldScrollLoad = scrollHeight - (top + scrollElement.clientHeight) < 200 && scrollHeight >= 200;
            if (shouldScrollLoad && !this.loadingData) {
                this.runQuery(false);
            }
        }
    }

    /**
     * Runs the current query against the data provider
     */
    private runQuery(newQuery: boolean) {
        if (newQuery) {
            this.queryOptions.offset = 0;
        }
        if (!this.dataProvider) {
            return;
        }

        // No need to requery, if we have already performed this query
        if (_.isEqual(this.queryOptions, this.lastQuery)) {
            return;
        }

        this.lastQuery = <any>_.assign({}, this.queryOptions);

        // Let everyone know we are loading more data
        this.raiseLoadMoreData();

        // We should only attempt to load more data, if we don't already have data loaded, or there is more to be loaded
        this.dataProvider.canQuery(this.queryOptions).then((value) => {
            if (value) {
                this.loadingData = true;
                return this.dataProvider.query(this.queryOptions).then(r => {
                    this._data = this._data || [];
                    this._data = newQuery ? r.results : this._data.concat(r.results);

                    // We've moved the offset
                    this.queryOptions.offset += r.count;

                    // derive a description file
                    let desc = this.configuration ?
                        $.extend(true, {}, this.configuration) : TableSorter.createConfigurationFromData(this._data);

                    // Primary Key needs to always be ID
                    desc.primaryKey = "id";

                    let spec: any = {};
                    // spec.name = name;
                    spec.dataspec = desc;
                    delete spec.dataspec.file;
                    delete spec.dataspec.separator;
                    spec.dataspec.data = this._data;
                    spec.storage = LineUpLib.createLocalStorage(this._data, desc.columns, desc.layout, desc.primaryKey);

                    if (this.lineupImpl) {
                        this.lineupImpl.changeDataStorage(spec);
                    } else {
                        let finalOptions = $.extend(true, this.lineUpConfig, {
                            renderingOptions: $.extend(true, {}, this.settings.presentation)
                        });
                        this.lineupImpl = LineUpLib.create(spec, d3.select(this.element.find(".grid")[0]), finalOptions);
                        this.dimensions = this.dimensions;
                        this.lineupImpl.listeners.on("change-sortcriteria.lineup", (ele: JQuery, column: any, asc: boolean) => {
                            // This only works for single columns and not grouped columns
                            this.onLineUpSorted(column && column.column && column.column.id, asc);
                        });
                        this.lineupImpl.listeners.on("multiselected.lineup", (rows: ITableSorterRow[]) => {
                            if (this.settings.selection.multiSelect) {
                                this._selectedRows = this.updateRowSelection(rows);
                                this.raiseSelectionChanged(rows);
                            }
                        });
                        this.lineupImpl.listeners.on("selected.lineup", (row: ITableSorterRow) => {
                            if (this.settings.selection.singleSelect && !this.settings.selection.multiSelect) {
                                this._selectedRows = this.updateRowSelection(row ? [row] : []);
                                this.raiseSelectionChanged(this.selection);
                            }
                        });
                        this.lineupImpl.listeners.on("columns-changed.lineup", () => this.onLineUpColumnsChanged());
                        this.lineupImpl.listeners.on("change-filter.lineup", (x: JQuery, column: any) => this.onLineUpFiltered(column));
                        let scrolled = this.lineupImpl.scrolled;
                        let me = this;

                        // The use of `function` here is intentional, we need to pass along the correct scope
                        this.lineupImpl.scrolled = function(...args: any[]) {
                            me.checkLoadMoreData(true);
                            return scrolled.apply(this, args);
                        };

                        this.settings = this.settings;
                    }

                    this.selection = this._data.filter((n) => n.selected);

                    this.applyConfigurationToLineup();

                    // Store the configuration after it was possibly changed by load data
                    this.saveConfiguration();

                    this.loadingData = false;

                    setTimeout(() => this.checkLoadMoreData(false), 10);
                }, () => this.loadingData = false);
            }
        });
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
     * Updates the selected state of each row, and returns all the selected rows
     */
    private updateRowSelection(sels: ITableSorterRow[]) {
        if (this._data) {
            this._data.forEach((d) => d.selected = false);
        }
        return sels && sels.length ? sels.filter((d) => d.selected = true) : [];
    }

    /**
     * Gets the current list of filters from lineup
     */
    private getFiltersFromLineup() {
        let descs = this.lineupImpl.storage.getColumnLayout()
            .map(((d: any) => d.description()));
        let filters: ITableSorterFilter[] = [];
        descs.forEach((n: any) => {
            if (n.filter) {
                filters.push({
                    column: n.column,
                    value: n.filter,
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
    private getConfigurationFromLineup() {
        // full spec
        let dataSpec: any = this.lineupImpl.spec.dataspec;
        let s: ITableSorterConfiguration = $.extend(true, {}, {
            columns: dataSpec.columns,
            primaryKey: dataSpec.primaryKey,
        });
        // create current layout
        let descs = this.lineupImpl.storage.getColumnLayout()
            .map(((d: any) => d.description()));
        s.layout = _.groupBy(descs, (d: any) => d.columnBundle || "primary");
        s.sort = this.getSortFromLineUp();
        return s;
    }

    /**
     * Saves the current layout
     */
    private saveConfiguration() {
        if (!this.savingConfiguration) {
            this.savingConfiguration = true;
            this.configuration = this.getConfigurationFromLineup();
            this.raiseConfigurationChanged(this.configuration);
            this.savingConfiguration = false;
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
                value: column.filter,
            };
        }
        this.saveConfiguration();
        this.raiseFilterChanged(filter);

        // Set the new filter value
        this.queryOptions.query = this.getFiltersFromLineup();

        if (this.dataProvider && this.dataProvider.filter) {
            this.dataProvider.filter(filter);
        }

        // We are starting over since we filtered
        this.runQuery(true);
    }

    /**
     * Raises the configuration changed event
     */
    private raiseConfigurationChanged(configuration: ITableSorterConfiguration) {
        this.events.raiseEvent(TableSorter.EVENTS.CONFIG_CHANGED, configuration);
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
