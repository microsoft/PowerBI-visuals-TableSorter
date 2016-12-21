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

import { default as EventEmitter } from "../base/EventEmitter";
import * as _  from "lodash";
import * as d3 from "d3";
import * as $ from "jquery";
import {
    IQueryOptions,
    IQueryResult,
    IDataProvider,
    ITableSorterRow,
    ITableSorterSettings,
    ITableSorterConfiguration,
    ITableSorterFilter,
    ILineupImpl,
} from "./models";
import { createConfigurationFromData, hasConfigurationChanged } from "./configuration";
import { convertFilters, convertConfiguration, convertSort, convertFiltersFromLayout } from "./conversion";
import template from "./templates/tablesorter.tmpl";
import { DEFAULT_TABLESORTER_SETTINGS, DEFAULT_NUMBER_FORMATTER } from "./TableSorter.defaults";

/* tslint:disable */
const LineUpLib = require("lineup-v1");
/* tslint:enable */
const EVENTS_NS = ".lineup";

/**
 * A wrapper around the lineup library
 */
export class TableSorter {

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
        LOAD_LINEUP: "loadLineup",
    };

    /**
     * My lineup instance
     */
    public lineupImpl: ILineupImpl;

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
     * A boolean indicating whehter or not we are currently loading more data
     */
    private _loadingData = false;
    private get loadingData() {
        return this._loadingData;
    }

    /**
     * Setter for if we are loading data
     */
    private _toggleClass = _.debounce(() => {
        if (!this.destroyed) {
            this.element.toggleClass("loading", this.loadingData);
        }
    }, 100);
    private set loadingData(value: boolean) {
        this._loadingData = value;
        if (value) {
            this.element.addClass("loading");
        }
        this._toggleClass();
    }

    private _selectedRows: ITableSorterRow[] = [];
    private _eventEmitter: EventEmitter;
    private _settings: ITableSorterSettings = $.extend(true, {}, DEFAULT_TABLESORTER_SETTINGS);

    /**
     * The configuration for the lineup viewer
     */
    private lineUpConfig: ITableSorterSettings = <any>{
        svgLayout: {
            mode: "separate",
        },
        numberformat: (d: number, row: any, column: any) => {
            const formatter = <any>(this.settings.presentation.numberFormatter || DEFAULT_NUMBER_FORMATTER);
            return formatter(d, row, column);
        },
        interaction: {
            multiselect: () => this.settings.selection.multiSelect,
        },
        sorting: {
            external: true,
        },
        filtering: {
            external: true,
        },
        histograms: {
            generator: (columnImpl: any, callback: Function) => this.generateHistogram(columnImpl, callback),
        },
    };

    /**
     * Constructor for the table sorter
     * @param element The element to attach the table sorter to
     * @param dataProvider The data provider to use when querying for data
     */
    constructor(element: JQuery, dataProvider?: IDataProvider) {
        this.element = $(template());
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

    /* tslint:disable */
    /**
     * Resizer function to update lineups rendering
     */
    private bodyUpdater = _.debounce(() => {
        if (this.lineupImpl && !this.destroyed) {
            this.lineupImpl.updateBody();
        }
    }, 100);
    /* tslint:enable */

    /**
     * setter for the dimensions
     */
    public set dimensions(value) {
        this._dimensions = value;
        if (this.lineupImpl && this.lineupImpl.$container && value) {
            const wrapper = $(this.lineupImpl.$container.node()).find("div.lu-wrapper");
            const headerHeight = wrapper.offset().top - this.element.offset().top;
            wrapper.css({
                height: (value.height - headerHeight - 2) + "px",
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
        this.queryOptions = {};

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
        return this._data && this._data.slice(0);
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
        let newSettings: ITableSorterSettings = $.extend(true, {}, DEFAULT_TABLESORTER_SETTINGS, value);
        newSettings.selection.singleSelect = !newSettings.selection.multiSelect;

        this.lineUpConfig["cellFormatter"] = newSettings.presentation.cellFormatter;

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
     * *NOTE* This does not cause a data fetch, because it is just restoring state,
     * if required, set the dataProvider property to refetch data.
     */
    public set configuration(value: ITableSorterConfiguration) {
        this._configuration = value;

        if (value && value.sort) {
            this.queryOptions.sort = [value.sort];
        }

        const primary = value && value.layout && value.layout.primary;
        if (primary) {
            this.queryOptions.query = convertFiltersFromLayout(primary);
        }

        this.applyConfigurationToLineup();
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
        if (this.lineupImpl) {
            /* tslint:disable */
            if (this.lineupImpl.listeners) {
                this.lineupImpl.listeners.on(EVENTS_NS, null);
            }
            this.lineupImpl.scrolled = () => {};
            /* tslint:enable */
            this.lineupImpl.destroy();
            delete this.lineupImpl;
        }
        this.destroyed = true;
    }

    /**
     * Checks to see if more data should be loaded based on the viewport
     * @param scroll If true, a scrolling behavior caused this check
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
     * @param newQuery If true, a change in the query (filter/sort) caused this run, as opposed to infinite scrolling
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
                }, () => this.loadingData = false)
                .then(undefined, (err) => {
                    console.log(err.message);
                    console.error(err);
                    throw err;
                });
                return promise;
            } else {
                this.loadingData = false;
            }
        });
    }

    /**
     * Loads data from a query result
     * @param r The query result to load the data from
     */
    private loadDataFromQueryResult(r: IQueryResult) {
        this._data = this._data || [];
        this._data = r.replace ? r.results : this._data.concat(r.results);

        // derive a description file
        let config = this.configuration ?
            $.extend(true, {}, this.configuration) : createConfigurationFromData(this._data);

        // Primary Key needs to always be ID
        config.primaryKey = "id";

        this.loadLineup(config);

        // Update the selection
        this.selection = this._data.filter((n) => n.selected);

        // Reapply the configuration to lineup
        this.applyConfigurationToLineup();

        // Store the configuration after it was possibly changed by load data
        this.updateConfigurationFromLineup();
    }

    /**
     * Loads the actual lineup impl from the given spec document
     * @param config The configuration to use when loading lineup
     */
    private loadLineup(config: ITableSorterConfiguration) {
        this.raiseLoadLineup(config);

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
                renderingOptions: $.extend(true, {}, this.settings.presentation),
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
                this._selectedRows = this.updateRowSelection(rows);
                this.raiseSelectionChanged(rows);
            }
        });
        this.lineupImpl.listeners.on(`selected${EVENTS_NS}`, (row: ITableSorterRow) => {
            if (!this.settings.selection.multiSelect) {
                this._selectedRows = this.updateRowSelection(row ? [row] : []);
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
     * @param columnImpl The lineup column to generate the histogram for
     * @param callback The callback for when the generation is complete
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
     * Saves the current layout
     * @param filteredColumn The column that is being filtered
     */
    private updateConfigurationFromLineup(filteredColumn?: any) {
        if (!this.savingConfiguration) {
            this.savingConfiguration = true;
            const nc = convertConfiguration(this.lineupImpl, filteredColumn);
            const oc = this.configuration;
            if (hasConfigurationChanged(nc, oc)) {
                this.configuration = nc;
                this.raiseConfigurationChanged(this.configuration);
            }
            this.savingConfiguration = false;
        }
    }

    /**
     * Applies our external config to lineup
     */
    private applyConfigurationToLineup() {
        if (this.lineupImpl) {
            let currentSort = convertSort(this.lineupImpl);
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
        this.updateConfigurationFromLineup();
    }

    /**
     * Listener for line up being sorted
     * @param column The column being sorted
     * @param asc If true the sort is ascending
     */
    private onLineUpSorted(column: string, asc: boolean) {
        if (!this.sortingFromConfig) {
            this.updateConfigurationFromLineup();
            this.raiseSortChanged(column, asc);
            let newSort = convertSort(this.lineupImpl);

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
     * @param column The lineup column being filtered
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
                    values: column.filter,
                },
            };
        } else {
            filter = {
                column: colName,
                value: column.filter || undefined,
            };
        }

        const newFilters = convertFilters(this.lineupImpl, column);
        if (!_.isEqual(newFilters, this.queryOptions.query)) {
            this.updateConfigurationFromLineup(column);
            this.raiseFilterChanged(filter);

            // Set the new filter value
            this.queryOptions.query = newFilters;

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

    /**
     * Raises the event when loading lineup
     */
    private raiseLoadLineup(config: ITableSorterConfiguration) {
        this.events.raiseEvent(TableSorter.EVENTS.LOAD_LINEUP, config);
    }
}
