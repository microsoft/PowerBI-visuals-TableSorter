import { Promise } from "es6-promise";
import { IDataProvider, IQueryOptions, IQueryResult, ITableSorterColumn, ITableSorterSort, ITableSorterFilter } from "../models";
import { logger } from "essex.powerbi.base";

const log = logger("essex:widget:tablesorter:JSONDataProvider");

/**
 * A Data provider for a simple json array
 */
export class JSONDataProvider implements IDataProvider {
    protected data: any[];
    protected filteredData: any[];
    private handleSort = true;
    private handleFilter = true;
    private count = 100;
    private offset = 0;

    constructor(data: any[], handleSort = true, handleFilter = true, count = 100) {
        this.data = data;
        this.handleSort = handleSort;
        this.handleFilter = handleFilter;
        this.count = count;
    }

    /**
     * A filter for string values
     */
    private static checkStringFilter(data: { [key: string] : string }, filter: { column: string; value: string }) {
        return (data[filter.column] || "").match(new RegExp(filter.value));
    }

    /**
     * A filter for numeric values
     */
    private static checkNumberFilter(data: { [key: string] : number }, filter: { column: string; value: { domain: [number, number]; } }) {
        let value = data[filter.column] || 0;
        return value >= filter.value.domain[0] && value <= filter.value.domain[1];
    }

    /**
     * Determines if the dataset can be queried again
     */
    public canQuery(options: IQueryOptions): PromiseLike<boolean> {
        return new Promise<boolean>((resolve) => resolve(this.offset < this.data.length));
    }

    /**
     * Runs a query against the server
     */
    public query(options: IQueryOptions): PromiseLike<IQueryResult> {
        return new Promise<IQueryResult>((resolve, reject) => {
            let newData: any[];
            let replace = this.offset === 0;
            try {
                this.filteredData = this.getFilteredData(options);
                newData = this.filteredData.slice(this.offset, this.offset + this.count);
                this.offset += this.count;
                log(`Returning ${newData.length} results from query`);
            } catch (e) {
                log(`Error Returning: ${e}`);
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
     * Called when the data should be sorted
     */
    public sort(sort?: ITableSorterSort) {
        if (this.handleSort) {
            this.offset = 0;
        }
    }

    /**
     * Called when the data is filtered
     */
    public filter(filter?: ITableSorterFilter) {
        if (this.handleFilter) {
            this.offset = 0;
        }
    }

    /**
     * Generates a histogram for this data set
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
     * Gets the data filtered
     */
    private getFilteredData(options: IQueryOptions) {
        let final = this.data.slice(0);

        if (this.handleFilter && options.query && options.query.length) {
            options.query.forEach((filter) => {
                let filterMethod: any =
                    typeof filter.value === "string" ? JSONDataProvider.checkStringFilter : JSONDataProvider.checkNumberFilter;
                final = final.filter((item) => filterMethod(item, filter));
            });
        }

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

            const calcStackedValue = (item: any, sortToCheck: ITableSorterSort, minMax: { [col: string] : { min: number, max: number}}) => {
                let columns = sortToCheck.stack.columns;
                if (columns) {
                    let sortVal = columns.reduce((a, v) => {
                        /**
                         * This calculates the percent that this guy is of the max value
                         */
                        let value = item[v.column];
                        if (value) {
                            value -= minMax[v.column].min;
                            value /= (minMax[v.column].max - minMax[v.column].min);
                        } else {
                           value = 0;
                        }
                        return a + (value * v.weight);
                    }, 0);
                    return sortVal;
                }
                return 0;
            };

            let maxValues:  { [col: string] : { min: number, max: number}};
            if (sortItem.stack) {
                 maxValues = sortItem.stack.columns.reduce((a, b) => {
                    a[b.column] = {
                        max: d3.max(final, (i) => i[b.column]),
                        min: d3.min(final, (i) => i[b.column]),
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
