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

import {
    ITableSorterColumn,
    ITableSorterRow,
    ITableSorterConfiguration,
    ITableSorterLayoutColumn,
    IColorSettings,
    ColorMode,
} from "../models";
import { listDiff } from "@essex/pbi-base";
import * as _ from "lodash";
import * as d3 from "d3";
const naturalSort = require("javascript-natural-sort"); // tslint:disable-line
const ldget = require("lodash/get"); // tslint:disable-line

/**
 * The prefix for the generated rank column names
 */
const GENERATED_COLUMN_NAME_PREFIX = "GENERATED_RANK_LEVEL_";

/**
 * Indicates that a lower number rank is actually of higher value
 * i.e. Positions in a race, #1 is better than #5
 */
export const LOWER_NUMBER_HIGHER_VALUE = true;

/**
 * Generates a table sorter compatible configuration from a dataView
 * @param dataView The dataView to generate the configuration from
 * @param data The set of data parsed from the data view
 * @param colorSettings The color settings to use when coloring rank columns
 * @param resetRankLayout If true the generated rank column layouts will be reset
 * @param reverseRankingColumns If true, the generated rank column order will be reversed
 */
export default function(
    dataView: powerbi.DataView,
    data: ITableSorterRow[],
    colorSettings: IColorSettings,
    resetRankLayout = true,
    reverseRankingColumns = false): ITableSorterConfiguration {
    "use strict";
    if (dataView) {

        // Initially parse all of the columns from the data view so we know the valid columns
        let validColumns = parseColumnsFromDataView(dataView, data);

        // Attempt to load the existing table sorter config from powerbi
        let config: ITableSorterConfiguration;
        if (dataView.metadata && dataView.metadata.objects && dataView.metadata.objects["layout"]) {
            let configStr = dataView.metadata.objects["layout"]["layout"];
            if (configStr) {
                config = JSON.parse(configStr);
            }
        }

        // Generate the "rank" columns and append them to the set of valid columns
        const rankResult = parseRankColumns(dataView, colorSettings, reverseRankingColumns);
        if (rankResult) {
            validColumns.some(c => {
                if (c.column === rankResult.info.column.displayName) {
                    c.type = "string";
                    delete c["domain"];
                    return true;
                }
            });

            validColumns = validColumns.concat(rankResult.columns);
        }

        // If we don't have a config, then just create a simple one
        if (!config) {
            config = {
                primaryKey: validColumns[0].label,
                columns: validColumns,
            };
        } else {

            // Otherwise we need to do some additional processing
            processExistingConfig(config, validColumns);
        }

        // Process the configuration with the current rank information
        processConfigWithRankResult(config, rankResult, resetRankLayout);

        return config;
    }
}

/**
 * Parses the rank columns from the dataview (if necessary)
 * @param dataView The DataView to parse the rank columns from
 * @param colorSettings The settings to use when coloring the rank columns
 * @param reverseRankingColumns If true, the generated rank columns will be reversed
 */
function parseRankColumns(dataView: powerbi.DataView, colorSettings: IColorSettings, reverseRankingColumns = false) {
    "use strict";
    const ci = calculateRankingInfo(dataView);
    if (ci) {
        const colors = calculateRankColors(ci.values, colorSettings);
        if (reverseRankingColumns) {
            ci.values.reverse();
        }
        const toCompare = d3.extent(ci.values)[LOWER_NUMBER_HIGHER_VALUE ? 0 : 1];
        return {
            columns: ci.values.map((n, i) => {
                return {
                    label: `${ n !== toCompare ? "≥" : ""} ${n}`,
                    column: `${GENERATED_COLUMN_NAME_PREFIX}${n}`,
                    bucket: n,
                    type: "string",
                    width: 60,
                    color: colors[n],
                    filterable: false,
                    sortable: false,
                    isConfidence: true,
                };
            }),
            info: ci,
        };
    }
}

/**
 * Parses columns from a data view
 * @param dataView The dataView to get the columns from
 * @param data The data set that is being loaded
 */
function parseColumnsFromDataView(dataView: powerbi.DataView, data: ITableSorterRow[]) {
    "use strict";
    const dataViewTable = dataView.table;

    // Sometimes columns come in undefined
    return dataViewTable.columns.slice(0)
        .filter(n => !!n)
        // .filter(n => !n.roles["Confidence"]) // Don't include the certainty columns
        .map((c) => {
            const base = {
                label: c.displayName,
                column: c.displayName,
                type: c.type.numeric ? "number" : "string",
            };
            if (c.type.numeric) {
                _.merge(base, {
                    domain: calcDomain(data, base.column),
                });
            }
            return base;
        });
}

/**
 * Processes the configuration with the given rank result
 * @param config The configuration being loaded
 * @param rankResult The result from the rank generation
 * @param resetRankLayout If true, the layout for the generated rank columns will be reset
 */
function processConfigWithRankResult(config: ITableSorterConfiguration, rankResult: any, resetRankLayout: boolean) {
    "use strict";

    // If we have rank columns, then augment the layout config to take them into account
    // Important we do this here, after the processExistingConfig as it removes missing columns.
    if (rankResult) {

        // Create an empty layout if necessary
        if (!config.layout || !config.layout.primary) {
            config.layout = {
                primary: config.columns.slice(0),
            };
        }

        config.layout.primary = config.layout.primary.filter((c: any) => {
            // Find the column that is mapped by the user as the "Rank" field/column, and set its type to "string".
            if (c.column === rankResult.info.column.displayName) {
                c.type = "string";
                delete c.domain;
                delete c.histogram;
            } else if (resetRankLayout) {
                // If we are resetting the rank layout, then remove all the "Rank" columns
                const rankColumn = rankResult.columns.filter((n: any) => n.column === c.column)[0];
                if (rankColumn) {
                    return false;
                }
            }
            return true;
        });

        // We removed the rank columns, readd them
        if (resetRankLayout) {
            config.layout.primary = config.layout.primary.concat(rankResult.columns);
        }
    }
}

/**
 * Processes the existing config, removing unnecessary columns, and does some additional processing
 * @param config The config to process
 * @param columns The set of valid columns
 */
export function processExistingConfig(config: ITableSorterConfiguration, columns: ITableSorterColumn[]) {
    "use strict";
    let newColNames = columns.map(c => c.column);
    let oldConfig = _.merge({}, config);
    const oldCols = config.columns || [];

    // Filter out any columns that don't exist anymore
    config.columns = oldCols.filter(c =>
        newColNames.indexOf(c.column) >= 0
    );

    // Override the domain, with the newest data
    oldCols.forEach(n => {
        let newCol = columns.filter(m => m.column === n.column)[0];
        if (newCol) {
            if (newCol.domain) {
                // Reset the domain, cause we now have a new set of data
                n.domain = newCol.domain.slice(0) as any;
            }
            n.color = newCol.color;
        }
    });

    // Sort contains a missing column
    if (config.sort && newColNames.indexOf(config.sort.column) < 0 && !config.sort.stack) {
        config.sort = undefined;
    }

    // If we have a layout
    if (config.layout && config.layout.primary) {
        config.layout.primary = syncLayoutColumns(config.layout.primary, config.columns, oldConfig.columns);
    }

    removeMissingColumns(config, columns);
}

/**
 * Removes all missing columns from the configuration
 * @param config The config to remove columns from
 * @param columns The set of valid columns
 */
function removeMissingColumns(config: ITableSorterConfiguration, columns: ITableSorterColumn[]) {
    "use strict";
    listDiff<ITableSorterColumn>(config.columns.slice(0), columns, {
        /**
         * Returns true if item one equals item two
         */
        equals: (one, two) => one.column === two.column,

        /**
         * Gets called when the given item was removed
         */
        onRemove: (item) => {
            for (let i = 0; i < config.columns.length; i++) {
                if (config.columns[i].column === item.column) {
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
            if (config.layout && config.layout.primary) {
                // If it is a confidence column, then try to find the best spot
                let idx: number;
                if (item["isConfidence"]) {
                    config.layout.primary.some((c: ITableSorterLayoutColumn, i: number) => {
                        // The column may not have a 'column' property if it is a stacked column
                        if (c.column && c.column.indexOf(GENERATED_COLUMN_NAME_PREFIX) >= 0) {
                            const bucket = parseFloat(c.column.split(GENERATED_COLUMN_NAME_PREFIX)[1]);
                            if (bucket >= item["bucket"]) {
                                idx = i;
                                return true;
                            }
                        }
                    });
                }

                const newLayoutCol = {
                    // color: item.color,
                    width: item.width || 100,
                    column: item.column,
                    type: item.type,
                };
                if (idx) {
                    config.layout.primary.splice(idx, 0, newLayoutCol);
                } else {
                    config.layout.primary.push(newLayoutCol);
                }
            }
        },
    });
}

/**
 * Synchronizes the layout columns with the actual set of columns to ensure that it only has real columns,
 * and the filters are bounded appropriately
 */
export function syncLayoutColumns(layoutCols: ITableSorterLayoutColumn[], newCols: ITableSorterColumn[], oldCols: ITableSorterColumn[]) {
    "use strict";
    newCols = newCols || [];
    oldCols = oldCols || [];
    layoutCols = layoutCols || [];
    let columnFilter = (c: ITableSorterLayoutColumn) => {
        // If this column exists in the new sets of columns, pass the filter
        const newCol = newCols.filter(m => m.column === c.column)[0];
        let result = !!newCol;
        if (newCol) {

            // Bound the filted domain to the actual domain (in case they set a bad filter)
            let oldCol = oldCols.filter(m => m.column === c.column)[0];
            if (c.domain) {
                // It is filtered if the "filter" domain is different than the actual domain
                const isFiltered =
                    isValidDomain(c.domain) && isValidDomain(oldCol.domain) &&
                    (c.domain[0] !== oldCol.domain[0] || c.domain[1] !== oldCol.domain[1]);
                let lowerBound = newCol.domain[0];
                let upperBound = newCol.domain[1];

                // If it was filtered before, then copy over the filter, but bound it to the new domain
                if (isFiltered) {
                    lowerBound = Math.max(newCol.domain[0], c.domain[0]);
                    upperBound = Math.min(newCol.domain[1], c.domain[1]);
                }

                c.domain = [lowerBound, upperBound];
            }
        }

        if (c.children) {
            c.children = c.children.filter(columnFilter);
            return c.children.length > 0;
        }

        return result;
    };

    return layoutCols.filter(columnFilter);
}

/**
 * Returns true if the given domain is valid
 */
function isValidDomain(domain: number[]) {
    "use strict";
    return domain && domain.length === 2 && domain[0] !== null && domain[0] !== undefined && domain[1] !== null && domain[1] !== undefined; // tslint:disable-line
}

/**
 * Calculates the domain of the given column
 */
export function calcDomain (data: any[], name: string) {
    "use strict";
    let min: number;
    let max: number;
    data.forEach(m => {
        const val = m[name];
        if (val !== null && val !== undefined) { // tslint:disable-line
            if (typeof min === "undefined" || val < min) {
                min = val;
            }
            if (typeof max === "undefined" || val > max) {
                max = val;
            }
        }
    });
    return [min || 0, max || 0];
};

/**
 * Calculates all of the ranking values from the given dataview
 * @param dataView The dataView to calculate the ranking info for
 */
export function calculateRankingInfo(dataView: powerbi.DataView) {
    "use strict";
    if (dataView && dataView.table && dataView.table.rows) {
        const rankingColumnInfo = dataView.table.columns
            .map((n, i) => ({
                column: n,
                idx: i,
            }))
            .filter(n => n && isRankColumn(n.column))[0]; // Do the filter after, so the index is retained correctly
        if (rankingColumnInfo) {
            const values = Object.keys(
                dataView.table.rows
                    .reduce((a, b) => {
                        a[b[rankingColumnInfo.idx] as string] = 1;
                        return a;
                    }, {}))
                    .map(n => parseFloat(n))
                    .sort(naturalSort);
            return {
                column: rankingColumnInfo.column,
                values,
            };
        }
    }
}

/**
 * Calculates the rank colors from a set of ranks
 */
export function calculateRankColors(ranks: number[], colorSettings?: IColorSettings) {
    "use strict";
    const min = d3.min(ranks);
    const max =  d3.max(ranks);
    colorSettings = colorSettings || {};
    let gradientScale: d3.scale.Linear<any, any>;
    if (colorSettings.colorMode === ColorMode.Gradient) {
        const gradientInfo = ldget(colorSettings, "rankGradients", {});
        const finalMin = ldget(gradientInfo, "startValue", min);
        const finalMax = ldget(gradientInfo, "endValue", max);
        const finalStartColor = ldget(gradientInfo, "startColor", "#bac2ff");
        const finalEndColor = ldget(gradientInfo, "endColor", "#0229bf");
        gradientScale = d3.scale.linear()
            .domain([finalMin, finalMax])
            .interpolate(d3.interpolateRgb as any)
            .range([finalStartColor, finalEndColor] as any);
    }
    return (ranks || []).reduce((a, b) => {
        a[b] = gradientScale ? gradientScale(b) : ldget(colorSettings, `rankInstanceColors["${b}"]`, "#cccccc");
        return a;
    }, {});
}

/**
 * Determines if the given powerbi metadata column is the rank column
 */
export function isRankColumn(column: powerbi.DataViewMetadataColumn) {
    "use strict";
    return !!(column && column.roles["Rank"] && column.type.numeric);
}
