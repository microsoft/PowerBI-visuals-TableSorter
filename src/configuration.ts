import { ITableSorterConfiguration, ITableSorterRow, ITableSorterColumn } from "./models";

/**
 * Returns true if the given object is numeric
 */
const isNumeric = (obj: any) => (obj - parseFloat(obj) + 1) >= 0;

/**
 * Derives the desciption for the given column
 */
export function createConfigurationFromData(data: ITableSorterRow[]): ITableSorterConfiguration {
    "use strict";
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

    function isNumericValue(v: any) {
        // Assume that if null or undefined, it is numeric
        /* tslint:disable */
        return v === 0 || v === null || v === undefined || isNumeric(v);
        /* tslint:enable */
    }

    function analyzeColumn(columnName: string) {
        const minMax: IMinMax = { min: Number.MAX_VALUE, max: 0 };
        const allNumeric = data.every((row) => isNumericValue(row[columnName]));
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
 * Determines if the two different column sets have changed
 */
export function haveColumnsChanged(oldCfg: ITableSorterConfiguration, newCfg: ITableSorterConfiguration) {
    "use strict";
    let oldCols = oldCfg && oldCfg.columns;
    let newCols = oldCfg && oldCfg.columns;
    if (!oldCols && !newCols) { // Both are undefined, return false
        return false;
    } else if (!oldCols || !newCols) { // One is undefined but not the other, return true
        return true;
    } else {
        if (oldCols.length !== newCols.length) {
            return true;
        }
        const colMapper = (col: ITableSorterColumn) => _.pick(col, ["column", "label", "type"]);
        return !_.isEqual(oldCols.map(colMapper), newCols.map(colMapper));
    }
}

/**
 * Determines if the two different layouts have changed
 */
export function hasLayoutChanged(oldCfg: ITableSorterConfiguration, newCfg: ITableSorterConfiguration) {
    "use strict";
    const rankColumnFilter = (col: any) => col && col.type !== "rank"; // Filter out the rank column
    let oldLayout = (oldCfg && oldCfg.layout && oldCfg.layout.primary || []).filter(rankColumnFilter);
    let newLayout = (newCfg && newCfg.layout && newCfg.layout.primary || []).filter(rankColumnFilter);
    return !_.isEqual(oldLayout, newLayout);
}


/**
 * Returns true if the new table sorter configuration has changed from the old one
 */
export function hasConfigurationChanged(nc: ITableSorterConfiguration, oc: ITableSorterConfiguration) {
    "use strict";
    if (!nc && !oc) {
        return false;
    } else if (!nc || !oc) {
        return true;
    }
    return !_.isEqual(oc.sort, nc.sort) || // Has the sort changed
           haveColumnsChanged(oc, nc) ||
           hasLayoutChanged(oc, nc);
}
