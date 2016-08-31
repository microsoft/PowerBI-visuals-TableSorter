import { VisualBase, Visual, logger } from "essex.powerbi.base";
import { updateTypeGetter, UpdateType, createPropertyPersister, PropertyPersister } from "essex.powerbi.base/src/lib/Utils";
import { TableSorter  } from "../TableSorter";
import {
    IStateful,
    register,
    unregister,
    unregisterListener,
    IStateChangeListener,
    publishChange,
    publishReplace,
    publishNameChange,
    publishStateInjectionRequest,
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
import IVisual = powerbi.IVisual;
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
const colors = require("essex.powerbi.base/src/colors");
const ldget = require("lodash.get");
/* tslint:enable */

@Visual(require("../build.json").output.PowerBI)
export default class TableSorterVisual extends VisualBase implements IVisual, IStateful<ITableSorterState> {

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

    // The name of this visual will change when the bound column change
    public name = "TableSorter";
    public baseName = "TableSorter";
    public stateChangeListeners: IStateChangeListener<ITableSorterState>[] = [];
    public tableSorter: TableSorter;
    private dataViewTable: DataViewTable;
    private dataView: powerbi.DataView;
    private host: IVisualHostServices;
    private selectionManager: SelectionManager;
    private waitingForMoreData: boolean;
    private waitingForSort: boolean;
    private handlingUpdate: boolean;
    private updateType: () => UpdateType;
    private propertyPersistManager: PropertyPersistManager;
    private loadingState = false;
    private isBootstrapping = true;

    // Stores our current set of data.
    private _data: { data: ITableSorterVisualRow[], cols: string[] };

    public get template() {
        return `
            <div>
                <div class="lineup"></div>
            </div>
        `.trim().replace(/\n/g, "");
    }

    /**
     * If css should be loaded or not
     */
    private noCss: boolean = false;

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
    public constructor(noCss: boolean = false, initialSettings?: ITableSorterSettings, updateTypeGetterOverride?: () => UpdateType) {
        super(noCss);
        log("Constructing TableSorter");
        this.noCss = noCss;
        this.initialSettings = initialSettings || {
            presentation: {
                numberFormatter: (d: number) => this.numberFormatConfig.formatter.format(d)
            },
        };
        this.numberFormatConfig = new NumberFormatConfig();
        this.updateType = updateTypeGetterOverride ? updateTypeGetterOverride : updateTypeGetter(this);
        this.tableSorter = new TableSorter(this.element.find(".lineup"));
    }

    /**
     * Setter for dimensions
     */
    private _dimensions: { width: number; height: number };
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

    private get isMultiSelect() {
        return ldget(this, "tableSorter.settings.selection.multiSelect", false);
    }

    /**
     * Gets the current state for the table sorter
     */
    public get state(): ITableSorterState {
        const result = {
            settings: $.extend(true, {}, this.tableSorter.settings),
            configuration: $.extend(true, {}, this.tableSorter.configuration),
            selection: this.tableSorter.selection.map((n: ITableSorterVisualRow) => {
                return {
                    id: <string>n.id,
                    serializedFilter: powerbi.data["services"].SemanticQuerySerializer.serializeExpr(n.filterExpr),
                };
            }),
        };
        return result;
    }

    /**
     * Sets the current state of the table sorter
     */
    public set state(value: ITableSorterState) {
        try {
            log("set state", value);
            this.loadingState = true;
            this.tableSorter.settings = value.settings;
            this.loadDataFromPowerBI(value.configuration);

            if (value.selection) {
                const serializer = powerbi.data["services"].SemanticQuerySerializer;
                this.tableSorter.selection = value.selection.map(n => {
                    const filterExpr = serializer.deserializeExpr(n.serializedFilter) as powerbi.data.SQExpr;
                    const identity = powerbi.data.createDataViewScopeIdentity(filterExpr);
                    return DataFactory.createItem(n.id, SelectionId.createWithId(identity), filterExpr);
                });
                this.propertyPersistManager.updateSelection(
                this.tableSorter.selection as ITableSorterVisualRow[],
                this.isMultiSelect
            );
            log("SetState Invoking ConfigurationUpdater", value);
            this.propertyPersistManager.updateConfiguration(value);
            }
        } catch (err) {
            console.log("TableSorter::set state Error", err);
        } finally {
            this.loadingState = false;
        }
    }

    /** This is called once when the visual is initialially created */
    public init(options: VisualInitOptions): void {
        try {
            super.init(options);
            this.host = options.host;
            this.propertyPersistManager = new PropertyPersistManager(
                createPropertyPersister(this.host, 100),
                this.selectionManager
            );
            this.selectionManager = new SelectionManager({
                hostServices: options.host
            });
            this.tableSorter.settings = this.initialSettings;

            // Wire up event handlers
            this.tableSorter.events.on("selectionChanged", this.handleSelectionChanged.bind(this));
            this.tableSorter.events.on(TableSorter.EVENTS.CLEAR_SELECTION, this.handleSelectionCleared.bind(this));
            this.tableSorter.events.on(TableSorter.EVENTS.CONFIG_CHANGED, this.handleConfigChanged.bind(this));

            this.dimensions = { width: options.viewport.width, height: options.viewport.height };
            log("Registering TableSorter");
            register(this, window);
        } catch(err) {
            console.log("TableSorter Init Error", err);
        }
    }

    /** Update is called for data updates, resizes & formatting changes */
    public update(options: VisualUpdateOptions) {
        try {
            const updateType = this.updateType();
            this.handlingUpdate = true;
            this.dataView = options.dataViews && options.dataViews[0];
            this.dataViewTable = this.dataView && this.dataView.table;
            log("Update: ", options, updateType);
            super.update(options);

            if (options.dataViews.length > 0) {
                const oldName = this.name;
                const candidateName = "TableSorter::" + options.dataViews[0].metadata.columns.sort().map(c => `${c.queryName}`).join("::");
                if (oldName !== candidateName) {
                    log("TableSorter Name Change: %s => %s", oldName, candidateName);
                    this.name = candidateName;
                    publishNameChange(this, oldName, candidateName);

                    if (this.isBootstrapping) {
                        this.isBootstrapping = false;
                        publishStateInjectionRequest(this);
                    }
                }
            }

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
        } catch (err) {
            console.log("TableSorter Update Error", err);
        } finally {
            this.handlingUpdate = false;
        }
    }

    /**
     * Destroys this table sorter
     */
    public destroy() {
        unregister(this, window);
        this.stateChangeListeners.forEach(n => unregisterListener(n, this));
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
        }, ];
        $.extend(true, instances[0].properties, this.tableSorter.settings[options.objectName]);
        if (options.objectName === "presentation") {
            $.extend(true, instances[0].properties, {
                labelDisplayUnits: this.numberFormatConfig.labelDisplayUnits,
                labelPrecision: this.numberFormatConfig.labelPrecision,
            });
        }
        return options.objectName === "layout" ? <any>{} : instances;
    }

    public registerStateChangeListener(listener: IStateChangeListener<ITableSorterState>) {
        this.stateChangeListeners.push(listener);
    }

    public unregisterStateChangeListener(listener: IStateChangeListener<ITableSorterState>) {
        unregisterListener(listener, this);
    }

    /**
     * Gets the css used for this element
     */
    protected getCss(): string[] {
        return this.noCss ? [] : super.getCss().concat([
            require("!css!../../node_modules/lineup-v1/css/style.css"),
            require("!css!sass!./css/TableSorterVisual.scss"),
        ]);
    }

    /**
     * Returns true if the layout has changed in the PBI settings
     */
    private hasLayoutChanged(updateType: UpdateType, options: VisualUpdateOptions) {
        if (updateType & UpdateType.Settings && options.dataViews && options.dataViews.length) {
            if (this.dataView.metadata && this.dataView.metadata.objects && this.dataView.metadata.objects["layout"]) {
                // Basically string compares the two layouts to see if anything has changed
                const dataViewLayout = this.dataView.metadata.objects["layout"]["layout"];
                const tableSorterLayout = JSON.stringify(this.tableSorter.configuration);
                return dataViewLayout !== tableSorterLayout;
            }
        }
        return false;
    }

    /**
     * Event listener for when the visual data's changes
     */
    private loadDataFromPowerBI(config?: any) {
        if (this.dataViewTable) {
            let newData = DataFactory.convert(this.dataView);
            config = config || buildConfig(this.dataView, newData.data);

            this.tableSorter.configuration = config;
            this._data = newData;
            if (this.loadResolver) {
                let resolver = this.loadResolver;
                delete this.loadResolver;
                resolver(newData.data);
            } else {
                this.tableSorter.dataProvider = this.createDataProvider(newData);
            }
            const selectedIds = this.selectionManager.getSelectionIds();
            this.tableSorter.selection = newData.data.filter(n => {
                return !!_.find(selectedIds, (id: SelectionId) => id.equals(n.identity));
            });
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

    private handleSelectionChanged(rows: ITableSorterVisualRow[]) {
        log("Selection changed", rows);
        this.propertyPersistManager.updateSelection(rows, this.isMultiSelect);
        if (!this.loadingState) {
            publishChange(this, "Selection Changed", this.state);
        }
    }

    private handleSelectionCleared() {
        log("Selection cleared");
        this.propertyPersistManager.updateSelection([], this.isMultiSelect);
        if (!this.loadingState) {
            publishChange(this, "Selection Cleared", this.state);
        }
    }

    private handleConfigChanged(config: ITableSorterConfiguration, oldConfig: ITableSorterConfiguration) {
        log("Configuration Changed", config, oldConfig);
        if (!this.handlingUpdate && !this.loadingState) {
            log("Configuration Change Being Applied", config, oldConfig);
            let updates: string[] = [];
            let isNewState = false;
            if (config) {
                const sort = config.sort;
                if (!_.isEqual(sort, oldConfig && oldConfig.sort)) {
                    const isAsc = sort.asc;
                    const sortColumn = sort.column || sort.stack.name;
                    updates.push(`Sort ${isAsc ? "↑" : "↓"}${sortColumn}`);
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
                    updates.push("Filter changed");
                    isNewState = true;
                } else if (!_.isEqual(config.layout, oldConfig && oldConfig.layout)) {
                    updates.push("Layout changed");
                    // isNewState = true;
                }
            }
            if (!updates.length) {
                isNewState = true;
                updates.push("Configuration updated");
                // Replace State
            }
            const method = isNewState ? publishChange : publishReplace;

            this.propertyPersistManager.updateConfiguration(this.state);
            method(this, updates.join(", "), this.state);
        }
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
