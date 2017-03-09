import { ITableSorterColumn, ITableSorterRow, ITableSorterConfiguration } from "../models";
import { listDiff } from "@essex/pbi-base";
import * as _ from "lodash";
/* tslint:disable */
const ldget = require("lodash.get");
/* tslint:enable */

/**
 * Gets a lineup config from the data view
 */
export default function(dataView: powerbi.DataView, data: ITableSorterRow[]): ITableSorterConfiguration {
    "use strict";
    if (!dataView) {
        throw new Error("dataView must be defined");
    }
    if (!data) {
        throw new Error("data must be defined");
    }

    let config: ITableSorterConfiguration;
    let configStr = ldget(dataView, "metadata.objects.layout.layout");
    if (configStr) {
        config = JSON.parse(configStr);
    }

    const newColArr = parseColumnsFromDataView(dataView, data);
    if (config) {
        processExistingConfig(config, newColArr);
    } else {
        config = {
            primaryKey: newColArr[0].label,
            columns: newColArr,
        };
    }
    return config;
}

/**
 * Parses columns from a data view
 */
function parseColumnsFromDataView(dataView: powerbi.DataView, data: ITableSorterRow[]) {
    "use strict";
    const dataViewTable = dataView.table;

    // Sometimes columns come in undefined
    return dataViewTable.columns.slice(0).filter(n => !!n).map((c) => {
        const base = {
            label: c.displayName,
            column: c.displayName,
            type: c.type.numeric ? "number" : "string",
        };
        if (c.type.numeric) {
            _.merge(base, {
                domain: calcDomain(data, base.column)
            });
        }
        return base;
    });
}

/**
 * Processes the existing config, removing unnecessary columns, and does some additional processing
 */
function processExistingConfig(config: ITableSorterConfiguration, columns: ITableSorterColumn[]) {
    "use strict";
    let newColNames = columns.map(c => c.column);

    // Filter out any columns that don't exist anymore
    config.columns = (config.columns || []).filter(c =>
        newColNames.indexOf(c.column) >= 0
    );

    // Override the domain, with the newest data
    config.columns.forEach(n => {
        let newCol = (columns || []).filter(m => m.column === n.column)[0];
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
        removeMissingLayoutColumns(config, newColNames);
    }

    removeMissingColumns(config, columns);
}

function removeMissingColumns(config: ITableSorterConfiguration, columns: ITableSorterColumn[]) {
    "use strict";
    listDiff<ITableSorterColumn>(config.columns.slice(0), columns, {
        /**
         * Returns true if item one equals item two
         */
        equals: (one: ITableSorterColumn, two: ITableSorterColumn) => one.label === two.label,

        /**
         * Gets called when the given item was removed
         */
        onRemove: (item: ITableSorterColumn) => {
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
        onAdd: (item: ITableSorterColumn) => {
            config.columns.push(item);
            config.layout["primary"].push({
                width: 100,
                column: item.column,
                type: item.type,
            });
        },
    });
}

/**
 * Removes columns from the given config if they don't exist in the given set of column names
 */
function removeMissingLayoutColumns(config: ITableSorterConfiguration, columns: string[]) {
    "use strict";
    let removedColumnFilter = (c: { column: string, children: any[], domain: any[] }) => {
        // If this column exists in the new sets of columns, pass the filter
        if (columns.indexOf(c.column) >= 0) {

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

/**
 * Calculates the domain of the given column
 */
function calcDomain (data: any[], name: string) {
    "use strict";
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
