import {
    Visual,
    logger,
    UpdateType,
    createPropertyPersister,
} from "essex.powerbi.base";
import { StatefulVisual } from "pbi-stateful";
import { receiveDimensions, IDimensions } from "essex.powerbi.base/dist/lib/Utils/receiveDimensions";
import { TableSorter  } from "../TableSorter";
import {
    publishChange,
    publishReplace,
} from "pbi-stateful";
import {
    ITableSorterSettings,
    ITableSorterSort,
    ITableSorterConfiguration,
} from "../models";
import { Promise } from "es6-promise";
import capabilities from "./TableSorterVisual.capabilities";
import MyDataProvider from "./TableSorterVisual.dataProvider";
import buildConfig from "./ConfigBuilder";
import { ITableSorterVisualRow, ITableSorterState } from "./interfaces";

import * as _ from "lodash";
import DataViewTable = powerbi.DataViewTable;
import IVisualHostServices = powerbi.IVisualHostServices;
import VisualCapabilities = powerbi.VisualCapabilities;
import VisualInitOptions = powerbi.VisualInitOptions;
import VisualUpdateOptions = powerbi.VisualUpdateOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import SelectionId = powerbi.visuals.SelectionId;
import SelectionManager = powerbi.visuals.utility.SelectionManager;

import NumberFormatConfig from "./NumberFormatConfig";
import * as DataFactory from "./DataFactory";
import PropertyPersistManager from "./PropertyPersistManager";

/* tslint:disable */
const log = logger("essex:widget:TableSorterVisual");
const colors = require("essex.powerbi.base/dist/lib/colors");
const ldget = require("lodash.get");
/* tslint:enable */

function hashString(input: string): number {
  "use strict";
  let hash = 0;
  if (input.length === 0) {
    return hash;
  }
  for (let i = 0, len = input.length; i < len; i++) {
    const chr   = input.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

@receiveDimensions
@Visual(require("../build.json").output.PowerBI)
export default class TableSorterVisual extends StatefulVisual<ITableSorterState> {
    /**
     * The set of capabilities for the visual
     */
    public static capabilities: VisualCapabilities = capabilities;

    /**
     * The default settings for the visual
     */
    private static VISUAL_DEFAULT_SETTINGS: ITableSorterSettings =
        $.extend(true, {}, TableSorter.DEFAULT_SETTINGS, {
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
    private isWaitingForInitialPBIConfiguration = true;
    private propertyPersistManager: PropertyPersistManager;

    // Stores our current set of data.
    private _data: DataFactory.ITableData;

    public get template() {
        return `
            <div>
                <div class="lineup"></div>
            </div>
        `.trim().replace(/\n/g, "");
    }

    /**
     * The initial set of settings to use
     */
    private initialSettings: ITableSorterSettings;

    /**
     * The formatter to use for numbers
     */
    private numberFormatConfig: NumberFormatConfig;

    /**
     * The current load promise
     */
    private loadResolver: (data: any[]) => void;

    /**
     * The constructor for the visual
     */
    constructor(noCss: boolean = false, initialSettings?: ITableSorterSettings) {
        super("TableSorter", noCss);
        log("Constructing TableSorter");
        this.initialSettings = initialSettings || {
            presentation: {
                numberFormatter: (d: number) => this.numberFormatConfig.formatter.format(d)
            },
        };
        this.numberFormatConfig = new NumberFormatConfig();
        this.tableSorter = new TableSorter(this.element.find(".lineup"));
    }

    public areEqual(state1: ITableSorterState, state2: ITableSorterState): boolean {
        return _.isEqual(state1, state2);
    }

    public getHashCode(state: ITableSorterState): number {
        return hashString(JSON.stringify(state));
    }

    protected generateState(): ITableSorterState {
        log("generating state");
        const settings = _.assign({}, this.tableSorter.settings);
        const configuration = _.assign({}, this.tableSorter.configuration);
        const selection = this.tableSorter.selection.map(DataFactory.convertRowSelectionToState);
        return { settings, configuration, selection };
    }

    protected onSetState(value: ITableSorterState, oldValue: ITableSorterState): void {
        log("set state", value);
        if (value) {
            this.tableSorter.settings = value.settings;
            this.loadDataFromPowerBI(value.configuration); // Sets the configuration and loads from PBI
            this.propertyPersistManager.updateConfiguration(value.configuration);

            if (value.selection) {
                this.tableSorter.selection = value.selection.map(DataFactory.convertStateRowSelectionToControl);
                this.propertyPersistManager.updateSelection(
                    this.tableSorter.selection as ITableSorterVisualRow[],
                    this.isMultiSelect
                );
            }
            log("SetState Invoking ConfigurationUpdater", value);
        } else {
            log("TODO: Undefined State Injected");
        }
    }

    public setDimensions(value: IDimensions): void {
        log("dimensions set", value);
        if (this.tableSorter) {
            this.tableSorter.dimensions = value;
        }
    }

    protected onInit(options: VisualInitOptions): void {
        log("init", options);
        this.host = options.host;
        this.selectionManager = new SelectionManager({ hostServices: options.host });
        this.propertyPersistManager = new PropertyPersistManager(
            createPropertyPersister(this.host, 100),
            this.selectionManager
        );

        // Wire up the table sorter
        this.tableSorter.settings = this.initialSettings;
        this.tableSorter.events.on("selectionChanged", this.handleTableSorterSelectionChange.bind(this));
        this.tableSorter.events.on(TableSorter.EVENTS.CLEAR_SELECTION, this.handleTableSorterSelectionClear.bind(this));
        this.tableSorter.events.on(TableSorter.EVENTS.CONFIG_CHANGED, this.handleTableSorterConfigChange.bind(this));
    }

    protected onUpdate(options: VisualUpdateOptions, updateType: UpdateType): void {
        const isSettingsUpdate = updateType & UpdateType.Settings;
        const dataView = ldget(options, "dataViews[0]");
        const dataViewTable = ldget(dataView, "table");
        const isDataUpdate = updateType & UpdateType.Data;

        // If the layout has changed, we need to reload table sorter
        // TODO: Put this behind an arrow-function to defer execution
        const hasLayoutChanged = this.hasLayoutChanged(updateType, options);

        const isLayoutRequestRequired = this.isWaitingForInitialPBIConfiguration && this.dataView;
        const isDataRequestRequired = isDataUpdate || hasLayoutChanged
            // The data may not have changed, but we are in the middle of loading.
            // Necessary because sometimes the user "changes" the filter, but it doesn't actually change the dataset.
            // ie. If the user selects the min value and the max value of the dataset as a filter.
            || this.loadResolver;

        log("update [type=%s] [isData? %s] [isLayout? %s] [isSettings? %s] [dataRequestRequired? %s] [layoutRequestRequired? %s]",
          updateType,
          isDataUpdate,
          hasLayoutChanged,
          isSettingsUpdate,
          isDataRequestRequired,
          isLayoutRequestRequired
        );

        this.dataView = dataView;
        this.dataViewTable = dataViewTable;

        if (isSettingsUpdate) {
            this.loadSettingsFromPowerBI();
        }

        // When this layout updates for the first time, retrieve the layout configuration from the
        // PowerBI Configuration
        if (this.isWaitingForInitialPBIConfiguration && this.dataView) {
            this.loadLayoutFromPowerBI();
        }

        if (isDataRequestRequired) {
            // If we explicitly are loading more data OR If we had no data before, then data has been loaded
            this.waitingForMoreData = false;
            this.waitingForSort = false;

            // const layoutText = ldget(this.dataView, "metadata.objects.layout.layout");
            this.loadDataFromPowerBI();
        }
    }

    private get isMultiSelect() {
        return ldget(this, "tableSorter.settings.selection.multiSelect", false);
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
                labelDisplayUnits: this.numberFormatConfig.labelDisplayUnits,
                labelPrecision: this.numberFormatConfig.labelPrecision,
            });
        }
        return options.objectName === "layout" ? <any>{} : instances;
    }

    /**
     * Gets the css used for this element
     */
    protected getCustomCssModules(): string[] {
        return [
            require("!css!../../node_modules/lineup-v1/css/style.css"),
            require("!css!sass!./css/TableSorterVisual.scss"),
        ];
    }

    /**
     * Returns true if the layout has changed in the PBI settings
     */
    private hasLayoutChanged(updateType: UpdateType, options: VisualUpdateOptions) {
        const isSettingsUpdate = updateType & UpdateType.Settings;
        const hasDataViews = ldget(options, "dataViews.length");
        const hasLayout = ldget(this, "dataView.metadata.objects.layout");
        if (isSettingsUpdate && hasDataViews && hasLayout) {
            // Basically string compares the two layouts to see if anything has changed
            const dataViewLayout = this.dataView.metadata.objects["layout"]["layout"];
            const tableSorterLayout = JSON.stringify(this.tableSorter.configuration);
            return dataViewLayout !== tableSorterLayout;
        }
        return false;
    }

    /**
     * Event listener for when the visual data's changes
     */
    private loadDataFromPowerBI(config?: any) {
        log("loadDataFromPowerBI");
        if (this.dataView) {
            let newData = DataFactory.convert(this.dataView);
            if (!config || Object.keys(config).length === 0) {
                log("loadDataFromPowerBI::Forcing Config build");
                config = buildConfig(this.dataView, newData.data);
            }
            this.receiveTableData(newData);
            const selectedIds = this.selectionManager.getSelectionIds();
            this.tableSorter.configuration = config;
            this.tableSorter.selection = newData.data.filter(n => {
                return !!_.find(selectedIds, (id: SelectionId) => id.equals(n.identity));
            });
        }
    }

    private receiveTableData(newData: DataFactory.ITableData) {
        this._data = newData;
        if (this.loadResolver) {
            log("ReceiveTableData::Updating Existing Resolver");
            try {
                let resolver = this.loadResolver;
                resolver(newData.data);
            } finally {
                delete this.loadResolver;
            }
        } else {
            log("ReceiveTableData::Creating new Data Provider");
            this.tableSorter.dataProvider = this.createDataProvider(newData);
        }
    }

    /**
     * Creates a data provider with the given set of data
     */
    private createDataProvider(newData: { data: any[] }) {
        return new MyDataProvider(
            newData.data,
            (newQuery) => {
                // If it is a new query
                const canLoadMore = newQuery || !!this.dataView.metadata.segment;
                log(`CanLoadMore: ${canLoadMore}`);
                return canLoadMore;
            },
            (options, newQuery, sortChanged, filterChanged) => {
                this.waitingForMoreData = true;
                return new Promise((resolve, reject) => {
                    if (newQuery) {
                        if (filterChanged) {
                            this.propertyPersistManager.updateSelfFilter(options.query, this.dataView.table.columns);
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
        log("Handle Sort");
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
                sortDescriptors: sortDescriptors
            };
        }
        this.waitingForSort = true;
        this.host.onCustomSort(args);
    }

    private handleTableSorterSelectionChange(rows: ITableSorterVisualRow[]) {
        log("handleTableSorterSelectionChange", rows);
        this.propertyPersistManager.updateSelection(rows, this.isMultiSelect);
        if (!this.isHandlingSetState) {
            this.clearState();
            publishChange(this, "Change Selection", this.state);
        }
    }

    private handleTableSorterSelectionClear() {
        log("handleTableSorterSelectionClear");
        this.propertyPersistManager.updateSelection([], this.isMultiSelect);
        if (!this.isHandlingSetState) {
            this.clearState();
            publishChange(this, "Clear Selection", this.state);
        }
    }

    private handleTableSorterConfigChange(config: ITableSorterConfiguration, oldConfig: ITableSorterConfiguration) {
        log("handleTableSorterConfigChange", config, oldConfig);
        if (!this.isHandlingUpdate && !this.isHandlingSetState) {
            log("User-Driven Configuration Change", config, oldConfig);
            let updates: string[] = [];
            let isNewState = false;
            if (config) {
                const sort = config.sort;
                if (!_.isEqual(sort, ldget(oldConfig, "sort"))) {
                    const isAsc = sort.asc;
                    const sortColumn = sort.column || sort.stack.name;
                    const sortLabel = `Sort ${isAsc ? "↑" : "↓"} ${sortColumn}`;
                    log("Sort Updated: ", sortLabel, sort);
                    updates.push(sortLabel);
                    isNewState = true;
                }
                const newLayout = ldget(config, "layout.primary", []);
                const oldLayout = ldget(oldConfig, "layout.primary", []);
                const newFilters = TableSorter.getFiltersFromLayout(newLayout);
                const oldFilters = TableSorter.getFiltersFromLayout(oldLayout);

                // Assume that a filter can only be applied when a the columns haven't changed,
                // otherwise, this always fires because when you add a column, it populates the "filter"
                if (newLayout.length === oldLayout.length &&
                    !_.isEqual(newFilters, oldFilters)) {
                    log("Filter Changed", newFilters, oldFilters);
                    updates.push("Change Filter");
                    isNewState = true;
                } else if (!_.isEqual(newLayout, oldLayout)) {
                    log("Layout Changed", newLayout, oldLayout);
                    updates.push("Change Layout");
                    // isNewState = true;
                }
            }
            if (!updates.length) {
                isNewState = true;
                log("Configuration Updated");
                updates.push("Update Configuration");
                // Replace State
            }

            this.clearState();
            this.propertyPersistManager.updateConfiguration(this.state.configuration);
            const method = isNewState ? publishChange : publishReplace;
            log("publishing state alteration on ", this);
            method(this, updates.join(", "), this.generateState());
        }
    }

    private loadLayoutFromPowerBI() {
        log("loadLayoutFromPowerBI")
        if (this.dataView) {
            this.isWaitingForInitialPBIConfiguration = false;
            const layoutText = ldget(this.dataView, "metadata.objects.layout.layout");
            if (layoutText) {
                const layout = JSON.parse(layoutText);
                this.tableSorter.configuration = layout;
            }
        }
    }

    /**
     * Listener for when the visual settings changed
     */
    private loadSettingsFromPowerBI() {
        log("loadSettingsFromPowerBI");
        if (this.dataView) {
            // Make sure we have the default values
            let updatedSettings: ITableSorterSettings =
                $.extend(true, {}, this.tableSorter.settings, TableSorterVisual.VISUAL_DEFAULT_SETTINGS, this.initialSettings || {});

            // Copy over new values
            let newObjs = $.extend(true, {}, <ITableSorterSettings>this.dataView.metadata.objects);
            const presObjs = ldget(newObjs, "presentation");
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

            let newLabelPrecision = ldget(presObjs, "labelPrecision", 0);
            let newLabelDisplayUnits = ldget(presObjs, "labelDisplayUnits", 0);
            const newConfig = new NumberFormatConfig(newLabelDisplayUnits, newLabelPrecision);
            if (!this.numberFormatConfig.isEqual(newConfig)) {
                this.numberFormatConfig = newConfig;
                this.tableSorter.rerenderValues();
            }

            const oldSettings = this.tableSorter.settings;
            const newSettings = _.cloneDeep(updatedSettings);
            this.tableSorter.settings = updatedSettings;

            delete oldSettings.presentation.numberFormatter;
            delete oldSettings.presentation.columnColors;
            delete newSettings.presentation.numberFormatter;
            delete newSettings.presentation.columnColors;
            if (!_.isEqual(oldSettings, newSettings)) {
                publishReplace(this, "Settings Updated", this.state);
            }
        }
    }
}
