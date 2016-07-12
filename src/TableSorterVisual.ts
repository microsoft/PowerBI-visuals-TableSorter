import { VisualBase, Visual, logger } from "essex.powerbi.base";
import { default as Utils, updateTypeGetter, UpdateType } from "essex.powerbi.base/src/lib/Utils";
import { TableSorter  } from "./TableSorter";
import {
    ITableSorterRow,
    ITableSorterSettings,
    ITableSorterColumn,
    ITableSorterConfiguration,
    ITableSorterSort,
    ITableSorterFilter,
    INumericalFilter,
} from "./models";
import { Promise } from "es6-promise";
import capabilities from "./TableSorterVisual.capabilities";
import MyDataProvider from "./TableSorterVisual.dataProvider";
// import domainsDialog from "./domains.dialog.tmpl";

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
import VisualObjectInstancesToPersist = powerbi.VisualObjectInstancesToPersist;

/* tslint:disable */
const log = logger("essex:widget:TableSorterVisual");
const colors = require("essex.powerbi.base/src/colors");
/* tslint:enable */

@Visual(require("./build").output.PowerBI)
export default class TableSorterVisual extends VisualBase implements IVisual {

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
    private loadingData: boolean;
    private updateType: () => UpdateType;

    // Stores our current set of data.
    private _data: { data: ITableSorterVisualRow[], cols: string[] };

    private template: string = `
        <div>
            <div class="lineup"></div>
        </div>
    `.trim().replace(/\n/g, "");

    /**
     * If css should be loaded or not
     */
    private noCss: boolean = false;

    /**
     * The initial set of settings to use
     */
    private initialSettings: ITableSorterSettings;

    /**
     * The current load promise
     */
    private loadResolver: (data: any[]) => void;

    /**
     * A simple debounced function to update the configuration
     */
    private configurationUpdater = _.debounce((config: any) => {
        const objects: powerbi.VisualObjectInstancesToPersist = {
            merge: [
                <VisualObjectInstance>{
                    objectName: "layout",
                    properties: {
                        "layout": JSON.stringify(config)
                    },
                    selector: undefined,
                },
            ],
        };
        log("Updating Config");
        this.queuePropertyChanges(objects);
    }, 100);

    /**
     * Selects the given rows
     */
    private onSelectionChanged = _.debounce((rows? : ITableSorterVisualRow[]) => {
        let filter: powerbi.data.SemanticFilter;
        let { singleSelect, multiSelect } = this.tableSorter.settings.selection;
        if (singleSelect || multiSelect) {
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

            let objects: powerbi.VisualObjectInstancesToPersist = { };
            if (filter) {
                $.extend(objects, {
                    merge: [
                        <powerbi.VisualObjectInstance>{
                            objectName: "general",
                            selector: undefined,
                            properties: {
                                "filter": filter
                            },
                        },
                    ],
                });
            } else {
                $.extend(objects, {
                    remove: [
                        <VisualObjectInstance>{
                            objectName: "general",
                            selector: undefined,
                            properties: {
                                "filter": filter
                            },
                        },
                    ],
                });
            }

            // rows are what are currently selected in lineup
            if (rows && rows.length) {
                // HACK
                this.selectionManager.clear();
                rows.forEach((r) => this.selectionManager.select(r.identity, true));
            } else {
                this.selectionManager.clear();
            }

            this.queuePropertyChanges(objects);
        }
    }, 100);

    /**
     * The constructor for the visual
     */
    public constructor(noCss: boolean = false, initialSettings?: ITableSorterSettings, updateTypeGetterOverride?: () => UpdateType) {
        super();
        this.noCss = noCss;
        this.initialSettings = initialSettings || {};
        this.updateType = updateTypeGetterOverride ? updateTypeGetterOverride : updateTypeGetter(this);
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
     * Converts the data from power bi to a data we can use
     */
    private static converter(view: DataView, selectedIds: any) {
        let data: ITableSorterVisualRow[] = [];
        let cols: string[];
        if (view && view.table) {
            let table = view.table;
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

    /** This is called once when the visual is initialially created */
    public init(options: VisualInitOptions): void {
        super.init(options, this.template, true);
        this.host = options.host;

        this.selectionManager = new SelectionManager({
            hostServices: options.host
        });
        this.tableSorter = new TableSorter(this.element.find(".lineup"));
        this.tableSorter.settings = this.initialSettings;
        this.tableSorter.events.on("selectionChanged", (rows: ITableSorterVisualRow[]) => this.onSelectionChanged(rows));
        this.tableSorter.events.on(TableSorter.EVENTS.CLEAR_SELECTION, () => this.onSelectionChanged());
        this.tableSorter.events.on("configurationChanged", (config: any) => {
            if (!this.loadingData) {
                this.configurationUpdater(config);
            }
        });

        this.dimensions = { width: options.viewport.width, height: options.viewport.height };
    }

    /** Update is called for data updates, resizes & formatting changes */
    public update(options: VisualUpdateOptions) {
        const updateType = this.updateType();
        this.loadingData = true;
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

        this.loadingData = false;
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
        return options.objectName === "layout" ? <any>{} : instances;
    }

    /**
     * Gets the css used for this element
     */
    protected getCss(): string[] {
        const css = [
            require("!css!../node_modules/lineup-v1/css/style.css"),
            require("!css!sass!./css/TableSorterVisual.scss"),
        ];
        return this.noCss ? [] : super.getCss().concat(css);
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
     * Gets a lineup config from the data view
     */
    private getConfigFromDataView(data: ITableSorterRow[]): ITableSorterConfiguration {
        const calcDomain = (name: string) => {
            let min: number;
            let max: number;
            data.forEach(m => {
                const val = m[name];
                if (typeof min === "undefined" || val < min) {
                    min = val;
                }
                if (typeof max === "undefined" || val > max) {
                    max = val;
                }
            });
            return [min || 0, max || 0];
        };
        // Sometimes columns come in undefined
        let newColArr: ITableSorterColumn[] = this.dataViewTable.columns.slice(0).filter(n => !!n).map((c) => {
            const base = {
                label: c.displayName,
                column: c.displayName,
                type: c.type.numeric ? "number" : "string",
            };
            if (c.type.numeric) {
                _.merge(base, {
                    domain: calcDomain(base.column)
                });
            }
            return base;
        });
        let config: ITableSorterConfiguration;
        if (this.dataView.metadata && this.dataView.metadata.objects && this.dataView.metadata.objects["layout"]) {
            let configStr = this.dataView.metadata.objects["layout"]["layout"];
            if (configStr) {
                config = JSON.parse(configStr);
            }
        }
        if (!config) {
            config = {
                primaryKey: newColArr[0].label,
                columns: newColArr,
            };
        } else {
            let newColNames = newColArr.map(c => c.column);

            // Filter out any columns that don't exist anymore
            config.columns = config.columns.filter(c =>
                newColNames.indexOf(c.column) >= 0
            );

            // Override the domain, with the newest data
            config.columns.forEach(n => {
                let newCol = newColArr.filter(m => m.column === n.column)[0];
                if (newCol.domain) {
                    if (!n.domain) {
                        n.domain = newCol.domain;
                    } else {
                        // Merge the two, using the max bounds between the two
                        let lowerBound = Math.min(newCol.domain[0], n.domain[0]);
                        let upperBound = Math.max(newCol.domain[1], n.domain[1]);
                        n.domain = [lowerBound, upperBound];
                    }
                }
            });

            // Sort contains a missing column
            if (config.sort && newColNames.indexOf(config.sort.column) < 0 && !config.sort.stack) {
                config.sort = undefined;
            }

            if (config.layout && config.layout["primary"]) {
                let removedColumnFilter = (c: { column: string, children: any[], domain: any[] }) => {
                    // If this column exists in the new sets of columns, pass the filter
                    if (newColNames.indexOf(c.column) >= 0) {

                        // Bound the filted domain to the actual domain (in case they set a bad filter)
                        let aCol = config.columns.filter(m => m.column === c.column)[0];
                        if (c.domain) {
                            let lowerBound = Math.max(aCol.domain[0], c.domain[0]);
                            let upperBound = Math.min(aCol.domain[1], c.domain[1]);
                            c.domain = [lowerBound, upperBound];
                        }

                        return true;
                    }

                    if (c.children) {
                        c.children = c.children.filter(removedColumnFilter);
                        return c.children.length > 0;
                    }
                    return false;
                };
                config.layout["primary"] = config.layout["primary"].filter(removedColumnFilter);
            }

            Utils.listDiff<ITableSorterColumn>(config.columns.slice(0), newColArr, {
                /**
                 * Returns true if item one equals item two
                 */
                equals: (one, two) => one.label === two.label,

                /**
                 * Gets called when the given item was removed
                 */
                onRemove: (item) => {
                    for (let i = 0; i < config.columns.length; i++) {
                        if (config.columns[i].label === item.label) {
                            config.columns.splice(i, 1);
                            break;
                        }
                    }
                },

                /**
                 * Gets called when the given item was added
                 */
                onAdd: (item) => {
                    config.columns.push(item);
                    config.layout["primary"].push({
                        width: 100,
                        column: item.column,
                        type: item.type,
                    });
                },
            });
        }
        return config;
    }

    /* tslint:disable */
    /**
     * Queues the given property changes
     */
    private propsToUpdate: VisualObjectInstancesToPersist[] = [];
    private propUpdater = _.debounce(() => {
        if (this.propsToUpdate && this.propsToUpdate.length) {
            const toUpdate = this.propsToUpdate.slice(0);
            this.propsToUpdate.length = 0;
            const final: VisualObjectInstancesToPersist = {};
            toUpdate.forEach(n => {
                Object.keys(n).forEach(operation => {
                    if (!final[operation]) {
                        final[operation] = [];
                    }
                    final[operation].push(...n[operation]);
                });
            });
            this.host.persistProperties(final);
        }
    }, 100);

    /**
     * Queues a set of property changes for the next update
     */
    private queuePropertyChanges(...changes: VisualObjectInstancesToPersist[]) {
        this.propsToUpdate.push(...changes);
        this.propUpdater();
    }
    /* tslint:enable */

    /**
     * Event listener for when the visual data's changes
     */
    private loadDataFromPowerBI() {
        if (this.dataViewTable) {
            let newData = TableSorterVisual.converter(this.dataView, this.selectionManager.getSelectionIds());
            let config = this.getConfigFromDataView(newData.data);
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
                this.tableSorter.dataProvider = new MyDataProvider(
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
                                    this.queuePropertyChanges(this.buildSelfFilter(options.query));
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
        // }

        this.tableSorter.selection = selectedRows;
        }
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
            let updatePBISettings = false;
            if (newObjs) {
                for (let section in newObjs) {
                    if (newObjs.hasOwnProperty(section)) {
                        let values = newObjs[section];
                        if (section === "selection" && values) {
                            updatedSettings.selection.singleSelect = !values.multiSelect;
                            updatedSettings.selection.multiSelect = values.multiSelect;
                            updatePBISettings = true;
                        }
                        for (let prop in values) {
                            if (updatedSettings[section] && typeof(updatedSettings[section][prop]) !== "undefined") {
                                updatedSettings[section][prop] = values[prop];
                            }
                        }
                    }
                }
            }

            if (updatePBISettings) {
                this.queuePropertyChanges({
                    merge: [
                        <powerbi.VisualObjectInstance>{
                            objectName: "selection",
                            selector: undefined,
                            properties: {
                                "singleSelect": updatedSettings.selection.singleSelect,
                                "multiSelect": updatedSettings.selection.multiSelect,
                            },
                        },
                    ],
                });
            }

            this.tableSorter.settings = updatedSettings;
        }
    }
}

/**
 * Represents a setting with a value
 */
interface IVisualBaseSettingWithValue<T> extends powerbi.data.DataViewObjectPropertyDescriptor {
    value?: T;
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
