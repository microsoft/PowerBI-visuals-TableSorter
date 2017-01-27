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

import { expect } from "chai";
import * as _ from "lodash";
import { convertFiltersFromLayout, convertFilters, convertSort, convertConfiguration } from "./conversion";

describe("conversion", () => {
    const STRING_FILTER_DESC_LINEUP = [{
        description: () => ({
            column: "FAKE_COLUMN",
            filter: "FAKE_FILTER",
        }),
    }];
    const STRING_FILTER = [{
        column: "FAKE_COLUMN",
        value: "FAKE_FILTER",
    }];
    const STACKED_NUMERICAL_FILTER_DESC_LINEUP = [{
        description: () => ({
            children: [{
                column: "FAKE_COLUMN",
                domain: [12, 43],
                range: [122, 423],
            }],
            domain: [12, 43],
            range: [122, 423],
        }),
    }];
    const NUMERICAL_FILTER_DESC_LINEUP = [{
        description: () => ({
            column: "FAKE_COLUMN",
            domain: [12, 43],
            range: [122, 423],
        }),
    }];
    const NUMERICAL_FILTER = [{
        column: "FAKE_COLUMN",
        value: {
            domain: [12, 43],
            range: [122, 423],
        },
    }];

    const FAKE_LINEUP_WITH_STRING_FILTER = <any>{ storage: {
        getColumnLayout: () => STRING_FILTER_DESC_LINEUP,
    }};
    describe("convertFilters", () => {
        it("should return an empty object, if undefined is passed to it", () => {
            const result = convertFilters(undefined);
            expect(result).to.be.undefined;
        });
        it("should return string filters", () => {
            const result = convertFilters(FAKE_LINEUP_WITH_STRING_FILTER);
            expect(result).to.be.deep.equal(STRING_FILTER);
        });
        it("should return numerical filters", () => {
            const result = convertFilters(<any>{ storage: {
                getColumnLayout: () => NUMERICAL_FILTER_DESC_LINEUP,
            }});
            expect(result).to.be.deep.equal(NUMERICAL_FILTER);
        });

        it("should return a combination of numerical and string filters", () => {
            const result = convertFilters(<any>{ storage: {
                getColumnLayout: () => [NUMERICAL_FILTER_DESC_LINEUP[0], STRING_FILTER_DESC_LINEUP[0]],
            }});
            expect(result).to.be.deep.equal([NUMERICAL_FILTER[0], STRING_FILTER[0]]);
        });
        it("should return an empty array if there are no columns", () => {
            const result = convertFilters(<any>{ storage: {
                getColumnLayout: () => (<any[]>[]),
            }});
            expect(result).to.be.deep.equal([]);
        });
    });
    describe("convertFiltersFromLayout", () => {
        it("should return an empty object, if undefined is passed to it", () => {
            const result = convertFiltersFromLayout(undefined);
            expect(result).to.be.undefined;
        });
        it("should return a string filter if a layout with a string filter is passed to it", () => {
            const result = convertFiltersFromLayout([STRING_FILTER_DESC_LINEUP[0].description()]);
            expect(result).to.be.deep.equal(STRING_FILTER);
        });
        it("should return a numerical filter if a layout with a numerical filter is passed to it", () => {
            const result = convertFiltersFromLayout([NUMERICAL_FILTER_DESC_LINEUP[0].description()]);
            expect(result).to.be.deep.equal(NUMERICAL_FILTER);
        });
        it("should not return a filter on a stacked column", () => {
            const result = convertFiltersFromLayout([STACKED_NUMERICAL_FILTER_DESC_LINEUP[0].description()]);
            expect(result).to.be.deep.equal([]);
        });
    });

    const SORT_LINEUP = {
        sortingOrderAsc: false,
        sortedColumn: {
            column: {
                column: "FAKE_COLUMN",
            },
        },
    };

    const STACK_SORT_LINEUP = {
        sortingOrderAsc: false,
        sortedColumn: {
            label: "FAKE_LABEL",
            children: [{
                column: {
                    column: "FAKE_COLUMN",
                },
            }, {
                column: {
                    column: "FAKE_COLUMN_2",
                },
            }],
            childrenWidths: [100, 100],
        },
    };

    const FAKE_LINEUP_WITH_NO_SORT = { storage: { config: { columnBundles: { primary: <any>{}}}}} as any;
    const FAKE_LINEUP_WITH_SORT = { storage: { config: { columnBundles: { primary: <any>SORT_LINEUP }}}} as any;
    const FAKE_LINEUP_WITH_STACK_SORT = { storage: { config: { columnBundles: { primary: STACK_SORT_LINEUP }}}} as any;

    describe("convertSort", () => {
        it ("should return an empty sort if there are no columns in lineup", () => {
            const lineupImpl = FAKE_LINEUP_WITH_NO_SORT;
            const result = convertSort(lineupImpl);
            expect(result).to.be.deep.equal(undefined);
        });
        it ("should return sort for a single column", () => {
            const lineupImpl = FAKE_LINEUP_WITH_SORT;
            const result = convertSort(lineupImpl);
            expect(result).to.be.deep.equal({
                column: "FAKE_COLUMN",
                asc: false,
            });
        });
        it ("should return sort for a stacked column", () => {
            const lineupImpl = FAKE_LINEUP_WITH_STACK_SORT;
            const result = convertSort(lineupImpl);
            expect(result).to.be.deep.equal({
                stack: {
                    name: "FAKE_LABEL",
                    columns: [{
                        column: "FAKE_COLUMN",
                        weight: .5,
                    }, {
                        column: "FAKE_COLUMN_2",
                        weight: .5,
                    }],
                },
                asc: false,
            });
        });
    });

    describe("convertConfiguration", () => {
        it ("should return a layout with a filter and a sort", () => {
            const result = convertConfiguration(_.merge({
                spec: {
                    dataspec: {
                        columns: [{
                            column: "FAKE_COLUMN",
                        }],
                        primaryKey: "primary",
                    },
                },
            }, FAKE_LINEUP_WITH_SORT, FAKE_LINEUP_WITH_STRING_FILTER));
            expect(result).to.be.deep.equal({
                columns: [{
                    column: "FAKE_COLUMN",
                }],
                primaryKey: "primary",
                layout: {
                    primary: [{
                        column: "FAKE_COLUMN",
                        filter: "FAKE_FILTER",
                    }],
                },
                sort: {
                    column: "FAKE_COLUMN",
                    asc: false,
                },
            });
        });
    });
});
