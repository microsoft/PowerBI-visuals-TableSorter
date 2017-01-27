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

import { JSONDataProvider, IColumnDomainInfo } from "../providers/JSONDataProvider";
import { IQueryOptions, IQueryResult } from "../models";
import { LOAD_COUNT } from "./TableSorterVisual.defaults";

/**
 * The data provider for our table sorter
 */
export default class MyDataProvider extends JSONDataProvider {

    private hasMoreData: (newQuery: boolean) => boolean;

    constructor(
        data: any[],
        domains: IColumnDomainInfo,
        hasMoreData: (newQuery: boolean) => boolean,
        onLoadMoreData: (options: IQueryOptions, newQuery: boolean, sort: boolean, filter: boolean) => PromiseLike<any[]>) {
        super(data, domains, true, true, LOAD_COUNT);
        this.hasMoreData = hasMoreData;
    }

    /**
     * Determines if the dataset can be queried again
     * @param options The query options to control how the query is performed
     */
    public canQuery(options: IQueryOptions): PromiseLike<boolean> {
        return super.canQuery(options);
    }

    /**
     * Runs a query against the server
     * @param options The query options to control how the query is performed
     */
    public query(options: IQueryOptions): PromiseLike<IQueryResult> {
        return super.query(options);
    };
}
