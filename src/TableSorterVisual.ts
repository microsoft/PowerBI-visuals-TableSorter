/// <reference path="../base/powerbi/references.d.ts"/>
import { VisualBase } from "../base/powerbi/VisualBase";
import { default as Utils, Visual } from "../base/powerbi/Utils";
import { TableSorter  } from "./TableSorter";
import {
    ITableSorterRow,
    ITableSorterSettings,
    ITableSorterColumn,
    ITableSorterConfiguration,
    IQueryOptions,
    IQueryResult,
    ITableSorterSort,
    ITableSorterFilter,
} from "./models";
import { JSONDataProvider } from "./providers/JSONDataProvider";
import { Promise } from "es6-promise";


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
import VisualDataRoleKind = powerbi.VisualDataRoleKind;

/* tslint:disable */
const colors = require("../base/powerbi/colors");
/* tslint:enable */

@Visual(require("./build").output.PowerBI)
export default class TableSorterVisual extends VisualBase implements IVisual {

    /**
     * The set of capabilities for the visual
     */
    public static capabilities: VisualCapabilities = $.extend(true, {}, VisualBase.capabilities, {
        dataRoles: [{
            name: "Values",
            kind: VisualDataRoleKind.GroupingOrMeasure,
        }, ],
        dataViewMappings: [{
            table: {
                rows: {
                    for: { in: "Values" },
                    dataReductionAlgorithm: { window: { count: 500 } },
                },
                rowCount: { preferred: { min: 1 } },
            },
        }, ],
        objects: $.extend({
            general: {
                displayName: powerbi.data.createDisplayNameGetter("Visual_General"),
                properties: {
                    // formatString: {
                    //     type: {
                    //         formatting: {
                    //             formatString: true
                    //         }
                    //     },
                    // },
                    // selected: {
                    //     type: { bool: true }
                    // },
                    filter: {
                        type: { filter: {} },
                        rule: {
                            output: {
                                property: "selected",
                                selector: ["Values"],
                            },
                        },
                    },
                },
            },
            layout: {
                properties: {
                    // formatString: {
                    //     type: {
                    //         formatting: {
                    //             formatString: true
                    //         }
                    //     },
                    // },
                    // selected: {
                    //     type: { bool: true }
                    // },
                    layout: {
                        type: { text: {} }
                    },
                },
            },
            selection: {
                displayName: "Selection",
                properties: {
                    multiSelect: {
                        displayName: "Multi Select",
                        description: "If true, multiple rows can be selected",
                        type: { bool: true },
                    },
                },
            },
            presentation: {
                displayName: "Presentation",
                properties: {
                    stacked: {
                        displayName: "Stacked",
                        description: "If true, when columns are combined, the all columns will be displayed stacked",
                        type: { bool: true },
                    },
                    values: {
                        displayName: "Values",
                        description: "If the actual values should be displayed under the bars",
                        type: { bool: true },
                    },
                    histograms: {
                        displayName: "Histograms",
                        description: "Show histograms in the column headers",
                        type: { bool: true },
                    },
                    animation: {
                        displayName: "Animation",
                        description: "Should the grid be animated when sorting",
                        type: { bool: true },
                    },
                    tooltips: {
                        displayName: "Table tooltips",
                        description: "Should the grid show tooltips on hover of a row",
                        type: { bool: true },
                    },
                },
            },
        }, VisualBase.EXPERIMENTAL_ENABLED ? {
            experimental: {
                displayName: "Experimental",
                properties: {
                    serverSideSorting: {
                        displayName: "Server Side Sorting",
                        description: "If true, Table Sorter will use PowerBI services to sort the data, rather than doing it client side",
                        type: { bool: true },
                    }, /*,
                    serverSideFiltering: {
                        displayName: "Server Side Filtering",
                        description: "If true, lineup will use PowerBI services to filter the data, rather than doing it client side",
                        type: { bool: true }
                    }*/
                },
            },
        } : {}),
        sorting: {
            custom: {}
        },
    });

    /**
     * The default settings for the visual
     */
    private static VISUAL_DEFAULT_SETTINGS: ITableSorterVisualSettings =
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
                // let smSelectedIds = this.selectionManager.getSelectionIds();
                // let unselectedRows = smSelectedIds.filter((n) => {
                //     return rows.filter((m) => m.identity.equals(n)).length === 0;
                // });
                // let newSelectedRows = rows.filter((n) => {
                //     return smSelectedIds.filter((m) => m.equals(n.identity)).length === 0;
                // });

                // This should work, but there is a bug with selectionManager
                // newSelectedRows.concat(unselectedRows).forEach((r) => this.selectionManager.select(r.identity, true));

                // HACK
                this.selectionManager.clear();
                rows.forEach((r) => this.selectionManager.select(r.identity, true));
            } else {
                this.selectionManager.clear();
            }

            this.host.persistProperties(objects);
        }
    }, 100);

    /**
     * The constructor for the visual
     */
    public constructor(noCss: boolean = false, initialSettings: ITableSorterSettings) {
        super();
        this.noCss = noCss;
        this.initialSettings = initialSettings || {};
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
    private static converter(view: DataView, config: ITableSorterConfiguration, selectedIds: any) {
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
        this.tableSorter.events.on(TableSorter.EVENTS.FILTER_CHANGED, (filter: ITableSorterFilter) => this.onFilterChanged(filter));
        this.tableSorter.events.on(TableSorter.EVENTS.CLEAR_SELECTION, () => this.onSelectionChanged());

        /**
         * Simple function to update the configuration with pbi
         */
        const configurationUpdater = _.debounce((config: any) => {
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
            this.host.persistProperties(objects);
        }, 100);

        this.tableSorter.events.on("configurationChanged", (config: any) => {
            if (!this.loadingData) {
                configurationUpdater(config);
            }
        });

        this.dimensions = { width: options.viewport.width, height: options.viewport.height };
    }

    /** Update is called for data updates, resizes & formatting changes */
    public update(options: VisualUpdateOptions) {
        this.loadingData = true;
        super.update(options);

        // Assume that data updates won't happen when resizing
        const newDims = { width: options.viewport.width, height: options.viewport.height };
        if (!_.isEqual(newDims, this.dimensions)) {
            this.dimensions = newDims;
        } else {
            // If we explicitly are loading more data OR If we had no data before, then data has been loaded
            this.waitingForMoreData = false;
            this.waitingForSort = false;

            this.dataView = options.dataViews[0];
            this.dataViewTable = this.dataView && this.dataView.table;

            this.checkSettingsChanged();
            this.checkDataChanged();
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
     * Gets a lineup config from the data view
     */
    private getConfigFromDataView(): ITableSorterConfiguration {
        // Sometimes columns come in undefined
        let newColArr: ITableSorterColumn[] = this.dataViewTable.columns.slice(0).filter(n => !!n).map((c) => {
            return {
                label: c.displayName,
                column: c.displayName,
                type: c.type.numeric ? "number" : "string",
            };
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

            // Sort contains a missing column
            if (config.sort && newColNames.indexOf(config.sort.column) < 0 && !config.sort.stack) {
                config.sort = undefined;
            }

            if (config.layout && config.layout["primary"]) {
                let removedColumnFilter = (c: { column: string, children: any[] }) => {
                    if (newColNames.indexOf(c.column) >= 0) {
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

    /**
     * Event listener for when the visual data's changes
     */
    private checkDataChanged() {
        if (this.dataViewTable) {
            let config = this.getConfigFromDataView();
            let newData = TableSorterVisual.converter(this.dataView, config, this.selectionManager.getSelectionIds());
            let selectedRows = newData.data.filter(n => n.selected);

            this.tableSorter.configuration = config;
            // Basically, have any of the columns changed, or have any data values changed.
            if (!this._data ||
                (this._data.cols.length !== newData.cols.length) ||
                (this._data.cols.filter(n => newData.cols.indexOf(n) < 0).length > 0) ||
                Utils.hasDataChanged(newData.data, this._data.data, (a, b) => a.identity.equals(b.identity))) {
                this._data = newData;
                this.tableSorter.count = this._data.data.length;
                this.tableSorter.dataProvider = new MyDataProvider(
                    newData.data,
                    () => !!this.dataView.metadata.segment,
                    () => {
                        this.waitingForMoreData = true;
                        this.host.loadMoreData();
                    },
                    (sort?: ITableSorterSort) => this.onSorted(sort),
                    (filter?: ITableSorterFilter) => this.onFilterChanged(filter));
            }

            this.tableSorter.selection = selectedRows;
        }
    }

    /**
     * Listener for when the visual settings changed
     */
    private checkSettingsChanged() {
        if (this.dataView) {
            // Make sure we have the default values
            let updatedSettings: ITableSorterVisualSettings =
                $.extend(true, {}, this.tableSorter.settings, TableSorterVisual.VISUAL_DEFAULT_SETTINGS, this.initialSettings || {});

            // Copy over new values
            let newObjs = $.extend(true, {}, <ITableSorterVisualSettings>this.dataView.metadata.objects);
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
                this.host.persistProperties({
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

    /**
     * Gets called when a filter is changed.
     */
    private onFilterChanged(filter: any): boolean {
        const mySettings = <ITableSorterVisualSettings>this.tableSorter.settings;
        if (VisualBase.EXPERIMENTAL_ENABLED && mySettings.experimental && mySettings.experimental.serverSideFiltering) {
            return true;
        }
    }

    /**
     * Listens for table sorter to be sorted
     */
    private onSorted(sort?: ITableSorterSort): boolean {
        const mySettings = <ITableSorterVisualSettings>this.tableSorter.settings;
        if (VisualBase.EXPERIMENTAL_ENABLED && mySettings.experimental && mySettings.experimental.serverSideSorting) {
            /* tslint:disable */
            let args: powerbi.CustomSortEventArgs = null;
            /* tslint:enable */
            if (sort) {
                let pbiCol = this.dataViewTable.columns.filter((c) => !!c && c.displayName === sort.column)[0];
                let sortDescriptors: powerbi.SortableFieldDescriptor[] = [{
                    queryName: pbiCol.queryName,
                    sortDirection: sort.asc ? powerbi.SortDirection.Ascending : powerbi.SortDirection.Descending,
                }, ];
                args = {
                    sortDescriptors: sortDescriptors
                };
            }
            this.waitingForSort = true;
            this.host.onCustomSort(args);
            return true;
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

/**
 * Has some extra settings for the visual
 */
interface ITableSorterVisualSettings extends ITableSorterSettings {
    experimental?: {
        serverSideSorting?: boolean;
        serverSideFiltering?: boolean;
    };
}

/**
 * The data provider for our lineup instance
 */
class MyDataProvider extends JSONDataProvider {

    private onLoadMoreData: Function;
    private onSorted: (sort?: ITableSorterSort) => boolean;
    private onFiltered: (filter?: ITableSorterFilter) => boolean;
    private sortChanged = false;
    private filterChanged = false;
    private hasMoreData: Function;

    constructor(
        data: any[],
        hasMoreData: () => boolean,
        onLoadMoreData: Function,
        onSorted: (sort?: ITableSorterSort) => boolean,
        onFiltered: (filter?: ITableSorterFilter) => boolean) {
        super(data);
        this.onLoadMoreData = onLoadMoreData;
        this.onSorted = onSorted;
        this.onFiltered = onFiltered;
        this.hasMoreData = hasMoreData;
    }

    /**
     * Determines if the dataset can be queried again
     */
    public canQuery(options: IQueryOptions): PromiseLike<boolean> {
        // We are either loading our initial set, which of course you can query it, otherwise, see if there is more data available
        const canLoad = options.offset === 0 || this.hasMoreData();
        return new Promise<boolean>((resolve) => resolve(canLoad));
    }

    /**
     * Runs a query against the server
     */
    public query(options: IQueryOptions): PromiseLike<IQueryResult> {
        // If the sort/filter changes, don't do anything, allow our users to respond
        if (options.offset > 0 || this.sortChanged || this.filterChanged) {
            if (this.onLoadMoreData && options.offset > 0) {
                this.onLoadMoreData();
            }
            this.sortChanged = false;
            this.filterChanged = false;
            return new Promise<IQueryResult>((resolve) =>  {
                // Leave those guys hanging
            });
        }

        return super.query(options);
    };

    /**
     * Called when the data should be sorted
     */
    public sort(sort? : ITableSorterSort) {
        this.sortChanged = this.onSorted(sort);
    }

    /**
     * Called when the data is filtered
     */
    public filter(filter? : ITableSorterFilter) {
        this.filterChanged = this.onFiltered(filter);
    }
}
