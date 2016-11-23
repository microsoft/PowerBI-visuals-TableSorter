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

import * as $ from "jquery";
import * as d3 from "d3";
import * as _ from "lodash";
import { ITableSorterFilter, ILineupImpl, ITableSorterConfiguration, ITableSorterSort } from "./models";

/**
 * Gets the current list of filters from lineup
 */
export function convertFilters(lineupImpl: ILineupImpl, filteredColumn?: any) {
    "use strict";
    if (lineupImpl) {
        let fDesc = filteredColumn && filteredColumn.description();
        let descs = lineupImpl.storage.getColumnLayout()
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
                // These can be arrays or strings
                if (typeof n.filter === "string") {
                    filters.push({
                        column: n.column,
                        value: n.filter || undefined,
                    });
                } else {
                    filters.push({
                        column: n.column,
                        value: {
                            values: n.filter || undefined,
                        },
                    });
                }
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
 * Gets filters from a layout obj
 */
export function convertFiltersFromLayout(layoutObj: any) {
    "use strict";
    if (layoutObj) {
        let filters: ITableSorterFilter[] = [];
        layoutObj.forEach((n: any) => {
            if (n.filter) {
                // These can be arrays or strings
                if (typeof n.filter === "string") {
                    filters.push({
                        column: n.column,
                        value: n.filter || undefined,
                    });
                } else {
                    filters.push({
                        column: n.column,
                        value: {
                            values: n.filter || undefined,
                        },
                    });
                }
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
 * Returns a configuration based on lineup settings
 */
export function convertConfiguration(lineupImpl: ILineupImpl, filteredColumn?: any) {
    "use strict";
    // TODO: filteredColumn is not a great fix.  The problem is when we filter a column, we reload lineup with new data/columns
    // but the UI remains open, and has a reference to an old column. filteredColumn is that old column.
    // full spec
    let dataSpec: any = lineupImpl.spec.dataspec;
    let s: ITableSorterConfiguration = $.extend(true, {}, {
        columns: dataSpec.columns.map((n: any) => {
            return _.merge({}, n, {
                // domain: [0, 40000]
            });
        }),
        primaryKey: dataSpec.primaryKey,
    });
    // create current layout
    let descs = lineupImpl.storage.getColumnLayout()
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
                domain: d.scale ? d.scale.domain() : undefined,
            });
            // If it is set to false or whatever, just remove it
            if (!result.filter) {
                delete result.filter;
            }
            return result;
        });
    // s.filters = this.getFiltersFromLineup();
    s.layout = _.groupBy(descs, (d: any) => d.columnBundle || "primary");
    s.sort = convertSort(lineupImpl);
    return s;
}

/**
 * Gets the sort from lineup
 */
export function convertSort(lineupImpl: ILineupImpl): ITableSorterSort {
    "use strict";
    if (lineupImpl && lineupImpl.storage) {
        let primary = lineupImpl.storage.config.columnBundles.primary;
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
