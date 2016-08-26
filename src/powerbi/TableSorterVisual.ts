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
    ITableSorterRow,
    ITableSorterSettings,
    ITableSorterSort,
    ITableSorterFilter,
    ITableSorterConfiguration,
    INumericalFilter,
} from "../models";
import { Promise } from "es6-promise";
import capabilities from "./TableSorterVisual.capabilities";
import MyDataProvider from "./TableSorterVisual.dataProvider";
import buildConfig from "./ConfigBuilder";

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
    private propertyPersister: PropertyPersister;
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
        const configJson = JSON.stringify(config);
        log("Persisting Table Configuration", configJson);
        if (configJson === "{}") {
            console.log("WTF", new Error().stack);
        }
        const objects: powerbi.VisualObjectInstancesToPersist = {
            merge: [
                <VisualObjectInstance>{
                    objectName: "layout",
                    properties: {
                        "layout": configJson,
                    },
                    selector: undefined,
                },
            ],
        };
        this.propertyPersister.persist(false, objects);
    }, 100);

    /**
     * Selects the given rows
     */
    private onSelectionChanged = _.debounce((rows? : ITableSorterVisualRow[], loadingState?: boolean) => {
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

        if (!loadingState) {
            publishChange(this, "Selection Changed", this.state);
        }

        this.propertyPersister.persist(true, {
            [operation]: [
                <powerbi.VisualObjectInstance>{
                    objectName: "general",
                    selector: undefined,
                    properties: {
                        "filter": filter
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
        log("Constructing TableSorter");
        this.noCss = noCss;
        this.initialSettings = initialSettings || {
            presentation: {
                numberFormatter: (d: number) => this.numberFormatter.format(d)
            },
        };
        this.numberFormatter = valueFormatterFactory({
            value: this.labelDisplayUnits,
            format: "0",
            precision: this.labelPrecision,
        });
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
        log("TableSorter getState: ", result);
        return result;
    }

    /**
     * Sets the current state of the table sorter
     */
    public set state(value: ITableSorterState) {
        log("loading state", value);
        this.loadingState = true;
        this.tableSorter.settings = value.settings;
        this.loadDataFromPowerBI(value.configuration);

        if (value.selection) {
            const serializer = powerbi.data["services"].SemanticQuerySerializer;
            this.tableSorter.selection = value.selection.map(n => {
                const filterExpr = serializer.deserializeExpr(n.serializedFilter) as powerbi.data.SQExpr;
                const identity = powerbi.data.createDataViewScopeIdentity(filterExpr);
                return TableSorterVisual.createItem(n.id, SelectionId.createWithId(identity), filterExpr);
            });
            this.onSelectionChanged(this.tableSorter.selection as any, true);
            log("SetState Invoking ConfigurationUpdater");
            this.configurationUpdater();
        }

        this.loadingState = false;
    }

    /**
     * Converts the data from power bi to a data we can use
     */
    private static converter(view: DataView) {
        let data: ITableSorterVisualRow[] = [];
        let cols: string[];
        if (view && view.table) {
            let table = view.table;
            cols = table.columns.filter(n => !!n).map(n => n.displayName);
            table.rows.forEach((row, rowIndex) => {
                let identity: powerbi.DataViewScopeIdentity;
                let newId: SelectionId;
                if (view.categorical && view.categorical.categories && view.categorical.categories.length) {
                    identity = view.categorical.categories[0].identity[rowIndex];
                    newId = SelectionId.createWithId(identity);
                } else {
                    newId = SelectionId.createNull();
                }

                // The below is busted > 100
                // let identity = SelectionId.createWithId(this.dataViewTable.identity[rowIndex]);
                let result: ITableSorterVisualRow =
                    TableSorterVisual.createItem(
                        newId.getKey() + rowIndex,
                        newId,
                        identity && identity.expr as powerbi.data.SQExpr);
                row.forEach((colInRow, i) => {
                    result[table.columns[i].displayName] = colInRow;
                });
                data.push(result);
            });
        }
        return {
            data,
            cols,
        };
    }

    /**
     * Creates an item
     */
    private static createItem(
        id: string,
        identity: powerbi.visuals.SelectionId,
        filterExpr: powerbi.data.SQExpr): ITableSorterVisualRow {
        return {
            id: id,
            identity: identity,
            equals: (b: ITableSorterVisualRow) => b.id === id,
            filterExpr: filterExpr,
            selected: false, // We don't really pay attention to this
        };
    }

    /** This is called once when the visual is initialially created */
    public init(options: VisualInitOptions): void {
        super.init(options);
        this.host = options.host;

        this.propertyPersister = createPropertyPersister(this.host, 100);
        this.selectionManager = new SelectionManager({
            hostServices: options.host
        });
        this.tableSorter.settings = this.initialSettings;
        this.tableSorter.events.on("selectionChanged", (rows: ITableSorterVisualRow[]) => this.onSelectionChanged(rows));
        this.tableSorter.events.on(TableSorter.EVENTS.CLEAR_SELECTION, () => this.onSelectionChanged());
        this.tableSorter.events.on(TableSorter.EVENTS.CONFIG_CHANGED,
            (config: ITableSorterConfiguration, oConfig: ITableSorterConfiguration) => {
                if (!this.handlingUpdate && !this.loadingState) {
                    log("CONFIG_CHANGED Event Handler Invoking configurationUpdater");
                    this.configurationUpdater();
                    let updates: string[] = [];
                    let isNewState = false;
                    if (config) {
                        if (!_.isEqual(config.sort, oConfig && oConfig.sort)) {
                            updates.push("Sort changed");
                            isNewState = true;
                        }
                        const newLayout = (config && config.layout && config.layout.primary) || [];
                        const oldLayout = (oConfig && oConfig.layout && oConfig.layout.primary) || [];
                        const newFilters = TableSorter.getFiltersFromLayout(newLayout);
                        const oldFilters = TableSorter.getFiltersFromLayout(oldLayout);

                        // Assume that a filter can only be applied when a the columns haven't changed,
                        // otherwise, this always fires because when you add a column, it populates the "filter"
                        if (newLayout.length === oldLayout.length &&
                            !_.isEqual(newFilters, oldFilters)) {
                            updates.push("Filter changed");
                            isNewState = true;
                        } else if (!_.isEqual(config.layout, oConfig && oConfig.layout)) {
                            updates.push("Layout changed");
                            // Replace State
                        }
                    }
                    if (!updates.length) {
                        isNewState = true;
                        updates.push("Configuration updated");
                        // Replace State
                    }
                    const method = isNewState ? publishChange : publishReplace;
                    method(this, updates.join(", "), this.state);
                }
            });

        this.dimensions = { width: options.viewport.width, height: options.viewport.height };
        log("Registering TableSorter");
        register(this, window);
    }

    /** Update is called for data updates, resizes & formatting changes */
    public update(options: VisualUpdateOptions) {
        log("Update: ", options);
        const updateType = this.updateType();
        this.handlingUpdate = true;
        this.dataView = options.dataViews && options.dataViews[0];
        this.dataViewTable = this.dataView && this.dataView.table;
        log("Update Type: ", updateType);
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

        this.handlingUpdate = false;
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
                labelDisplayUnits: this.labelDisplayUnits,
                labelPrecision: this.labelPrecision,
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
                log("COMPARING LAYOUTS", dataViewLayout, tableSorterLayout, this.dataView);
                const layoutChanged = dataViewLayout !== tableSorterLayout
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
    private loadDataFromPowerBI(config?: any) {
        if (this.dataViewTable) {
            let newData = TableSorterVisual.converter(this.dataView);
            config = config || buildConfig(this.dataView, newData.data);

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
                sortDescriptors: sortDescriptors
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
                        "selfFilter": filter
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

/**
 * The lineup data
 */
interface ITableSorterVisualRow extends ITableSorterRow, powerbi.visuals.SelectableDataPoint {

    /**
     * The expression that will exactly match this row
     */
    filterExpr: powerbi.data.SQExpr;
}

/**
 * The state of the table sorter
 */
export interface ITableSorterState {
    settings: ITableSorterSettings;
    configuration: any;
    selection?: {
        id: string,
        serializedFilter: Object,
    }[];
}
