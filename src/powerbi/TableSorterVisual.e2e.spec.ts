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
require("./spec/init"); // tslint:disable-line

import userSortedAndReorderedColumn from "./spec/test_data/userSortedAndReorderedColumn";
import userSwitchedRankColumnToRegularColumn from "./spec/test_data/userSwitchedRankColumnToRegularColumn";
import userSwitchedRegularColumnToRankColumn from "./spec/test_data/userSwitchedRegularColumnToRankColumn";
import userRemovesAColumnFromPBIThatWasSorted from "./spec/test_data/userRemovesAColumnFromPBIThatWasSorted";
import userRemovesAColumnFromPBIThatWasFiltered from "./spec/test_data/userRemovesAColumnFromPBIThatWasFiltered";

import { Utils as SpecUtils } from "@essex/pbi-base/dist/spec/visualHelpers";
import { default as TableSorterVisual  } from "./TableSorterVisual";
import { Promise } from "es6-promise";
import { getHeaderNames } from "../spec/utils";
import { expectHeadersInCorrectOrder, expectRowsMatch } from "../spec/expectations";
import { expect } from "chai";

describe("TableSorterVisual", () => {
    let parentEle: JQuery;
    beforeEach(() => {
        parentEle = $("<div></div>");
    });

    afterEach(() => {
        if (parentEle) {
            parentEle.remove();
        }
        parentEle = undefined;
    });

    let createVisual = () => {
        let instance: TableSorterVisual = new TableSorterVisual(true, {
            presentation: {
                animation: false,
            },
        }, undefined, 0 /* Body update delay */);
        let initOptions = SpecUtils.createFakeInitOptions();
        parentEle.append(initOptions.element);
        instance.init(initOptions);
        return {
            instance,
            element: initOptions.element,
        };
    };

    let createVisualWithUpdate = (options: any) => {
        let { instance, element } = createVisual();
        instance.update(options);
        return {
            instance,
            element,
            updateComplete: new Promise((resolve, reject) => {
                setTimeout(resolve, 20); // Make this longer than the body delay
            }),
        };
    };

    describe("Integration", () => {
        function userSortedAndReorderedColumnOptions() {
            return userSortedAndReorderedColumn();
        }

        function userSwitchedRankColumnToRegularColumnOptions() {
            return userSwitchedRankColumnToRegularColumn();
        }

        function userSwitchedRegularColumnToRankColumnOptions() {
            return userSwitchedRegularColumnToRankColumn();
        }

        function userRemovesAColumnFromPBIThatWasSortedOptions() {
            return userRemovesAColumnFromPBIThatWasSorted();
        }

        function userRemovesAColumnFromPBIThatWasFilteredOptions() {
            return userRemovesAColumnFromPBIThatWasFiltered();
        }

        it("should restore column ordering if a user reorders a basic column", () => {
            const { options, expected } = userSortedAndReorderedColumnOptions();
            const { updateComplete } = createVisualWithUpdate(options);

            return updateComplete.then(() => {
                expectHeadersInCorrectOrder(parentEle, expected.columns);
            });
        });

        it("should restore a sort if the user sorts a column", () => {
            const { options, expected } = userSortedAndReorderedColumnOptions();
            const { updateComplete } = createVisualWithUpdate(options);

            return updateComplete.then(() => {

                // Make sure that what is actually displayed is accurate
                expectRowsMatch(parentEle, expected.columns, expected.rows);
            });
        });

        it("should remove the sort on a sorted rank column, if the user changes the rank column into a regular column", () => {
            const { options, expected } = userSwitchedRankColumnToRegularColumnOptions();
            const { updateComplete } = createVisualWithUpdate(options);

            return updateComplete.then(() => {

                // Make sure that what is actually displayed is accurate
                expectRowsMatch(parentEle, expected.columns, expected.rows);
            });
        });

        it("should remove the filter on a filtered rank column, if the user changes the rank column into a regular column", () => {
            const { options, expected } = userSwitchedRankColumnToRegularColumnOptions();
            const { updateComplete } = createVisualWithUpdate(options);

            return updateComplete.then(() => {

                // This is basically the same as the sort check, because the `expected` is unfiltered
                expectRowsMatch(parentEle, expected.columns, expected.rows);
            });
        });

        it("should remove the generated rank columns, if the user changes a rank column into a regular column", () => {
            const { options } = userSwitchedRankColumnToRegularColumnOptions();
            const { updateComplete } = createVisualWithUpdate(options);

            return updateComplete.then(() => {

                // If any of the headers have digits in them, then the generated columns are still there
                expect(getHeaderNames(parentEle).some(n => n.indexOf("0") >= 0)).to.be.false;
            });
        });

        it("should remove the sort on a column, if the user changes the column into a ranked column", () => {
            const { options, expected } = userSwitchedRegularColumnToRankColumnOptions();
            const { updateComplete } = createVisualWithUpdate(options);

            return updateComplete.then(() => {

                // Make sure that what is actually displayed is accurate
                expectRowsMatch(parentEle, expected.columns, expected.rows);
            });
        });

        it("should remove the filter on a column, if the user changes the column into a ranked column", () => {
            const { options, expected } = userSwitchedRegularColumnToRankColumnOptions();
            const { updateComplete } = createVisualWithUpdate(options);

            return updateComplete.then(() => {

                // This is basically the same as the sort check, because the `expected` is unfiltered
                expectRowsMatch(parentEle, expected.columns, expected.rows);
            });
        });

        it("should add the generated rank columns, if the user changes a column into a ranked column", () => {
            const { options, expected } = userSwitchedRegularColumnToRankColumnOptions();
            const { updateComplete } = createVisualWithUpdate(options);

            return updateComplete.then(() => {

                // Make sure the headers have both the columns and the rank ones
                // IMPORTANT! The rawColumns & rankColumns is important because if we ever update the test data
                // we want to make sure we think about the generated rank columns, cause this will
                // still pass if we check against `expected.columns`.
                expectHeadersInCorrectOrder(parentEle, expected.rawColumns.concat(expected.rankColumns));
            });
        });

        it("should not crash if a user removes a column that was sorted, from PBI's field list", () => {
            const { options, expected } = userRemovesAColumnFromPBIThatWasSortedOptions();
            const { updateComplete } = createVisualWithUpdate(options);

            return updateComplete.then(() => {

                // This is basically the same as the sort check, because the `expected` is unfiltered
                expectRowsMatch(parentEle, expected.columns, expected.rows);
            });
        });

        it("should not crash if a user removes a column that was filtered, from PBI's field list", () => {
            const { options, expected } = userRemovesAColumnFromPBIThatWasFilteredOptions();
            const { updateComplete } = createVisualWithUpdate(options);

            return updateComplete.then(() => {

                // This is basically the same as the sort check, because the `expected` is unfiltered
                expectRowsMatch(parentEle, expected.columns, expected.rows);
            });
        });

        xit("should allow for infinite scrolling");
        xit("should allow for infinite scrolling with a string filter");
        xit("should allow for infinite scrolling with a numerical filter");
        it("should load a new set of data when a string column is filtered");
        it("should load a new set of data when a numerical column is filtered");
        it("should load a new set of data when a string column is sorted");
        it("should load a new set of data when a numerical column is sorted");
        it("should support stacked sorting");
        it("should support persisting of state, so after you reload it returns to its original state");
        it("should support persisting of state, so after you reload it returns to its original state: stacked");
        it("should support persisting of state, so after you reload it returns to its original state: sort");
        it("should support persisting of state, so after you reload it returns to its original state: filtering numerical");
        it("should support persisting of state, so after you reload it returns to its original state: filtering string");
        it("should support stacking columns, sorting them, then filtering another column");
        it("should allow for you to change the range of a numerical field, without freezing");
        it("should stack sort correctly asc");
        it("should stack sort correctly desc");
        it("should not go into an infinite loop if you just hit OK on a numerical filter without filtering.");
        it("should have numerical filter UI that is aligned properly");
        it("should have domains UI that is aligned properly"); // TSV
        it("should do nothing if the domains dialog does not change ANY value"); // TSV
        it("should update the configuration if the domains dialog changes ANY value"); // TSV

        it("should support loading numerical filters and the correct data after a page change");
        it("should not get into an infinite loop when changing the sort quickly");
        it("should not fail PBI (nested transactions issue) if adding/removing columns in PBI quickly");
        it("should rerender values when the value formatter columns change (precision, units)");
    });

});
