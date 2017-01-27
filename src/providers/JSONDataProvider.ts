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

import { Promise } from "es6-promise";
import {
    IDataProvider,
    IQueryOptions,
    IQueryResult,
    ITableSorterColumn,
    ITableSorterSort,
    ITableSorterFilter,
    INumericalFilter,
    IExplicitFilter,
} from "../models";
import * as d3 from "d3";
import * as _ from "lodash";

const debug = require("debug"); // tslint:disable-line
const log = debug("essex:widget:tablesorter:JSONDataProvider");

/**
 * A Data provider for lineup that uses a data array as its store
 */
export class JSONDataProvider implements IDataProvider {
    protected data: any[];
    protected domains: IColumnDomainInfo;
    protected filteredData: any[];
    private handleSort = true;
    private handleFilter = true;
    private count = 100;
    private offset = 0;
    private initialQuery = true;

    /**
     * A filter for string values
     * @param data The data item to check
     * @param filter The filter being applied
     */
    private static checkStringFilter(data: { [key: string]: string }, filter: { column: string; value: string }) {
        return ((data[filter.column] || "") + "").match(new RegExp(filter.value));
    }

    /**
     * A filter for numeric values
     * @param data The data item to check
     * @param filter The filter being applied
     */
    private static checkNumberFilter(data: { [key: string]: number }, filter: { column: string; value: INumericalFilter }) {
        let value = data[filter.column];
        return (value === null || value === undefined) ? false : value >= filter.value.domain[0] && value <= filter.value.domain[1]; // tslint:disable-line
    }

    /**
     * A filter for explicit items
     * @param data The data item to check
     * @param filter The filter being applied
     */
    private static checkExplicitFilter(data: { [key: string]: number }, filter: { column: string; value: IExplicitFilter}) {
        let value = data[filter.column] || 0;
        return (filter.value.values || []).indexOf(value) >= 0;
    }

    /**
     * Constructor for the JSONDataProvider
     */
    constructor(data: any[], domains: IColumnDomainInfo, handleSort = true, handleFilter = true, count = 100) {
        this.data = data;
        this.domains = domains;
        this.handleSort = handleSort;
        this.handleFilter = handleFilter;
        this.count = count;
    }

    /**
     * Determines if the dataset can be queried again
     * @param options The options to use when querying
     */
    public canQuery(options: IQueryOptions): PromiseLike<boolean> {
        return new Promise<boolean>((resolve) => resolve(this.initialQuery || (this.offset < this.data.length)));
    }

    /**
     * Runs a query against the data provider
     * @param options The options to use when querying
     */
    public query(options: IQueryOptions): PromiseLike<IQueryResult> {
        return new Promise<IQueryResult>((resolve, reject) => {
            this.initialQuery = false;
            let newData: any[];
            let replace = this.offset === 0;
            try {
                this.filteredData = this.getFilteredData(options);
                newData = this.filteredData.slice(this.offset, this.offset + this.count);
                this.offset += this.count;
                log(`Returning ${newData.length} results from query`);
            } catch (e) {
                log(`Error Returning: ${e}`);
                throw e;
            }
            setTimeout(() => {
                resolve({
                    results: newData,
                    replace: replace,
                });
            }, 0);
        });
    };

    /**
     * Called when the data is about to be sorted
     * @param sort The sort being applied
     */
    public sort(sort?: ITableSorterSort) {
        if (this.handleSort) {
            this.offset = 0;
        }
        this.initialQuery = true;
    }

    /**
     * Called when the data is about to be filtered
     * @param filter The filter being applied
     */
    public filter(filter?: ITableSorterFilter) {
        if (this.handleFilter) {
            this.offset = 0;
        }
        this.initialQuery = true;
    }

    /**
     * Generates a histogram for the dataset formed by using the given query options
     * @param column The column to generate the histogram for
     * @param options The query to use when generating the histogram.
     */
    public generateHistogram(column: ITableSorterColumn, options: IQueryOptions): PromiseLike<number[]> {
        return new Promise<number[]>((resolve) => {
            let final = this.filteredData; // this.getFilteredData(options);
            let values: number[] = final.map(n => n[column.column]);
            let max = d3.max(values);
            let min = d3.min(values);

            let histgenerator = d3.layout.histogram();
            (<any>histgenerator).range([min, max]);

            let histValues = histgenerator(values).map((bin) => bin.y);
            let maxHist = d3.max(histValues);

            // Make the values a percentage
            resolve(histValues.map(n => maxHist === 0 || n === 0 || _.isNaN(n) || _.isNaN(maxHist) ? 0 : n / maxHist));
        });
    }

    /**
     * Gets a subset of the data that has been filtered by the given query options
     * @param options The query being performed
     */
    private getFilteredData(options: IQueryOptions) {
        let final = this.data.slice(0);

        // If we are handling filtering, and their is a filter being applied
        if (this.handleFilter && options.query && options.query.length) {
            options.query.forEach((filter) => {
                let filterMethod = JSONDataProvider.checkStringFilter as any;

                // There HAS to be some value and a column for us to be able to filter correctly
                if (filter.value && filter.column) {
                    const explictValues = filter.value && (<IExplicitFilter>filter.value).values;
                    const filteredDomain = filter.value && (<INumericalFilter>filter.value).domain;
                    if (explictValues) {
                        filterMethod = JSONDataProvider.checkExplicitFilter as any;

                    // A numerical filter
                    } else if (filteredDomain) {
                        const actualDomain = this.domains[filter.column];

                        // If the filtered domain is ACTUALLY different from the full domain, then filter
                        // This case is specifically for null values, if the dataset contains null values
                        // and we apply a filter with the same domain as the actual domain, then null values get filtered
                        // out since they don't actually fall within the domain
                        if (filteredDomain[0] !== actualDomain[0] || filteredDomain[1] !== actualDomain[1]) {
                            filterMethod = JSONDataProvider.checkNumberFilter as any;
                        } else {

                            // Otherwise, we don't need a filter
                            filterMethod = undefined;
                        }
                    }
                    final = final.filter((item) => !filterMethod || filterMethod(item, filter));
                }
            });
        }

        // If we are handling sort, and there is a sort applied to tablesorter
        if (this.handleSort && options.sort && options.sort.length) {
            let sortItem = options.sort[0];
            const basicSort = (aValue: any, bValue: any, asc: boolean) => {
                let dir = asc ? 1 : -1;
                /* tslint:disable */
                if (aValue == bValue) {
                /* tslint:enable */
                    return 0;
                }
                return (aValue > bValue ? 1 : -1) * dir;
            };

            const calcStackedValue = (
                item: any,
                sortToCheck: ITableSorterSort,
                minMax: { [col: string]: { min: number, max: number }}) => {
                let columns = sortToCheck.stack.columns;
                if (columns) {
                    let sortVal = columns.reduce((a, v) => {
                        /**
                         * This calculates the percent that this guy is of the max value
                         */
                        let min = minMax[v.column].min || 0;
                        let max = minMax[v.column].max || min;
                        let value = item[v.column];

                        // We only need to do the actual weighting with items that have values
                        if (value !== null && value !== undefined) { //tslint:disable-line
                            // The max is the min, in this case, the value should be 100% (or 1)
                            if (max === min) {
                                value = 1;
                            } else {
                                value = ((value - min) / (max - min));
                            }
                            return a + (value * v.weight);
                        }
                        // Null/undefined values have no value, so just ignore them
                        return a;
                    }, 0);
                    return sortVal;
                }
                return 0;
            };

            let maxValues: { [col: string]: { min: number, max: number }};
            if (sortItem.stack) {
                 maxValues = sortItem.stack.columns.reduce((a, b) => {
                    const [min, max] = this.domains[b.column];
                    a[b.column] = {
                        max: max,
                        min: min,
                    };
                    return a;
                }, <any>{});
            }

            final.sort((a, b) => {
                if (sortItem.stack) {
                    return basicSort(calcStackedValue(a, sortItem, maxValues), calcStackedValue(b, sortItem, maxValues), sortItem.asc);
                }
                return basicSort(a[sortItem.column], b[sortItem.column], sortItem.asc);
            });
        }
        return final;
    }
}

/**
 * A mapping between columns and domains
 */
export interface IColumnDomainInfo {
    [column: string]: [number, number];
}
