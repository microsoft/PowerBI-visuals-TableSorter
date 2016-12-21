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

import * as d3 from "d3";

/**
 * The line up row
 */
export interface ITableSorterRow {

    /**
     * Data for each column in the row
     */
    [columnName: string]: any;

    /**
     * Some unique ID column
     */
    id: string|number;

    /**
     * Whether or not this row is selected
     */
    selected: boolean;

    /**
     * Returns true if this table sorter row equals another
     */
    equals(b: ITableSorterRow): boolean;
}

export interface ITableSorterSort {
    /**
     * The column that was sorted
     */
    column?: string;

    /**
     * The stack that was sorted, and the column weights
     */
    stack?: {
        name: string;
        columns?: [{
            column: string;
            weight: number;
        }];
    };

    /**
     * If the sort was ascending
     */
    asc: boolean;
}

/**
 * Rerepents a column in table sorter
 */
export interface ITableSorterColumn {
    /**
     * The field name of the column
     */
    column: string;

    /**
     * The displayName for the column
     */
    label?: string;

    /**
     * The type of column it is
     * values: string|number
     */
    type: string;

    /**
     * The categories of this column
     */
    categories?: string[];

    /**
     * The color of the column
     */
    color?: string;

    /**
     * The width of the column
     */
    width?: number;

    /**
     * The histogram of the column
     */
    histogram?: {
        min?: number;
        max?: number;
        values: number[];
    };

    /**
     * The domain of the column, only for number based columns
     */
    domain?: [number, number];
}

/**
 * A column which describes a layout column
 */
export interface ITableSorterLayoutColumn extends ITableSorterColumn {
    /**
     * The child columns (if this is a stacked column)
     */
    children?: ITableSorterLayoutColumn[];
}

/**
 * Represents the configuration of a table sorter instance
 * INFO ===
 * There are two real parts to the configuration
 * 1. columns - This is the list of the raw columns that are in the dataset, and their associated domains
 * 2. layout - This is how the columns are visually layed out in Table Sorter, ie single...stacked, whatever, and the
 *   `domain` that it is filtered to, this CAN differ from the domain in the columns array, which indicates that the column is filtered.
 */
export interface ITableSorterConfiguration {
    /**
     * The primary key of the layout
     */
    primaryKey: string;

    /**
     * The list of columns for table sorter
     */
    columns: ITableSorterColumn[];

    /**
     * The layout of the columns
     */
    layout?: any;

    /**
     * The sort of the table sorter
     */
    sort?: ITableSorterSort;

    // /**
    //  * The filters of the table sorter
    //  */
    // filters?: ITableSorterFilter[];
}

/**
 * Represents settings in table sorter
 */
export interface ITableSorterSettings {
    selection?: {

        /**
         * Enables single select mode
         */
        singleSelect?: boolean;

        /**
         * Enables multiselect mode
         */
        multiSelect?: boolean;
    };
    presentation?: {

        /**
         * Provides a mapping from column index to colors
         */
        columnColors?: (columnIdx: number) => string;

        /**
         * Show row values
         */
        values?: boolean;

        /**
         * Is stacking supported
         */
        stacked?: boolean;

        /**
         * Should histograms be visible on the column headers
         */
        histograms?: boolean;

        /**
         * Should animation be used when transitioning states in table sorter
         */
        animation?: boolean;

        /**
         * Should tooltips be shown for each row
         */
        tooltips?: boolean;

        /**
         * Formatter for numbers
         */
        numberFormatter?: (num: number, row?: any, col?: any) => string;

        /**
         * The raw cell formatter, will be called for all text cells
         */
        cellFormatter?: (cellSelection: d3.Selection<ICellFormatterObject>) => void;
    };
}

/**
 * Provides the data provider interface for table sorter
 */
export interface IDataProvider {
    /**
     * Returns true if the data provider can be queried with the given set of options,
     * this allows for data sources which don't know their total counts to query
     */
    canQuery(options: IQueryOptions): PromiseLike<boolean>;

    /**
     * Asks the data provider to load the data with the given query options
     */
    query(options: IQueryOptions): PromiseLike<IQueryResult>;

    /**
     * Generates a histogram for the values, each value must be between 0-1
     */
    generateHistogram(column: ITableSorterColumn, options: IQueryOptions): PromiseLike<number[]>;

    /**
     * Called when the data should be sorted
     *//* tslint:disable */
    sort?: (sort: ITableSorterSort) => void;
    /* tslint:enable */

    /**
     * Called when the data is filtered
     */
    filter?: (filter: ITableSorterFilter) => void;
}

/**
 * Represents a filter
 */
export interface ITableSorterFilter {
    column: string;
    value: string | INumericalFilter | IExplicitFilter;
}

export interface INumericalFilter {
    /**
     * The domain to filter to
     */
    domain: [number, number];

    /**
     * The range of the filter
     */
    range: [number, number];

    /**
     * The specific values to filter to
     */
    values?: number[];
}

export interface IExplicitFilter {
    /**
     * The specific values to filter to
     */
    values: number[];
}

export interface IQueryOptions {
    /**
     * The query to run
     */
    query?: ITableSorterFilter[];

    /**
     * The current sort
     */
    sort?: ITableSorterSort[];
}

/**
 * The query result interface
 */
export interface IQueryResult {
    /**
     * The matching results
     */
    results: ITableSorterRow[];

    /**
     * Whether or not the results should replace the current dataset, otherwise it will be appended
     */
    replace?: boolean;
}

/**
 * Represents the interface to the line up implementation
 */
export interface ILineupImpl {
    $container: d3.Selection<any>;
    spec: any;
    config: any;
    storage: {
        config: any;
        getColumnLayout: any
        addStackedColumn: (desc: any) => void;
    };
    listeners: d3.Dispatch;
    headerUpdateRequired: boolean;
    clearSelection: () => void;
    addNewSingleColumnDialog: () => void;
    addNewStackedColumnDialog: () => void;
    updateBody: () => void;
    updateAll: () => void;
    destroy: () => void;
    select: (obj: any) => void;
    scrolled: () => void;
    changeRenderingOption: (key: string, value: any) => void;
    changeInteractionOption: (key: string, value: any) => void;
    changeDataStorage: (spec: any) => void;
    sortBy: (colName: string, asc: boolean) => void;
}

export interface ICellFormatterObject extends HasRow, HasLayoutColumn {
    /**
     * True if the column is a rank column
     */
    isRank: boolean;

    /**
     * The value to display in the cell
     */
    label: any;
}

export interface HasRow {
    row: ITableSorterRow;
}

export interface HasLayoutColumn {
    column: ILayoutColumn;
}

export interface ILayoutColumn {
    column?: ILineupColumn;
}

export interface ILineupColumn {

    /**
     * The property name in each of the rows
     */
    column: string;

    /**
     * The initial configuration passed to lineup for this column
     */
    config?: any;
}

/**
 * Represents the mode to color things
 */
export enum ColorMode {
    Gradient = 1,
    Instance = 2
}

export interface IGradientSettings {

    /**
     * If the gradient color scheme should be used when coloring the values in the slicer
     */
    startColor?: string;

    /**
     * If the gradient color scheme should be used when coloring the values in the slicer
     */
    endColor?: string;

    /**
     * The value to use as the start color
     */
    startValue?: number;

    /**
     * The value to use as the end color
     */
    endValue?: number;
}

export interface IColorSettings {

    /**
     * Represents the color mode to use
     */
    colorMode?: ColorMode;

    /**
     * The gradient settings
     */
    rankGradients?: IGradientSettings;

    /**
     * Whether or not to show the histogram
     */
    histogram?: boolean;

    /**
     * Provides a mapping from ranks to colors
     */
    rankInstanceColors?: { [rank: string]: string; };
}
