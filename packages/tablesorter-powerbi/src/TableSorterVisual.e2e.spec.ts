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
import userLoadsBasicDataSet from "./spec/test_data/userLoadsBasicDataSet";
import userLoadedWithASortedStackedColumn from "./spec/test_data/userLoadedWithASortedStackedColumn";
import userLoadedDatasetWithNullRankValues from "./spec/test_data/userLoadedDatasetWithNullRankValues";
import userLoadedDatasetWithANonNumericRankColumn from "./spec/test_data/userLoadedDatasetWithANonNumericRankColumn";
import userJustLoadedARankColumn from "./spec/test_data/userJustLoadedARankColumn";

import { Utils as SpecUtils } from "@essex/pbi-base/dist/spec/visualHelpers";
import { default as TableSorterVisual  } from "./TableSorterVisual";
import { ITableSorterConfiguration  } from "@essex/tablesorter";
import { Promise } from "es6-promise";
import { getHeaderNames, performSort, getHeaders } from "@essex/tablesorter/dist/spec/utils";
import { expectHeadersInCorrectOrder, expectRowsMatch } from "@essex/tablesorter/dist/spec/expectations";
import { expect } from "chai";

/**
 * This is the delay to wait before resolving our updateComplete promises after the table sorter has finished rendering
 */
const UPDATE_RESOLVE_DELAY = 2;

describe("TableSorterVisual.e2e", () => {
    let parentEle: JQuery;
    let instances: any[] = [];
    beforeEach(() => {
        parentEle = $("<div></div>");
    });
    afterEach(() => {
        instances.forEach(n => {
            n.destroy();
        });
        instances.length = 0;
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
        instances.push(instance);
        return {
            instance,
            host: initOptions.host,
            element: initOptions.element,
        };
    };

    let createVisualWithUpdate = (options: any) => {
        let { instance, element, host } = createVisual();
        return {
            instance,
            element,
            host,
            updateComplete: new Promise((resolve, reject) => {
                function doUpdate(newOpts: any) {
                    return new Promise((updateResolve) => {
                        try {
                            instance.update(newOpts);

                            // Will resolve after the update has rendered
                            requestAnimationFrame(() => {
                                setTimeout(function() {
                                    updateResolve();
                                }, UPDATE_RESOLVE_DELAY);
                            });
                        } catch (e) {
                            reject(e);
                        }
                    });
                }

                // When the visuals first load PBI always calls update the first time with no data
                return doUpdate({ dataViews: undefined, viewport: { width: 3000, height: 3000 }})
                        .then(() => doUpdate(options))
                        .then(() => resolve(), (e) => reject(e));
            }),
        };
    };

    function getPosProp(element: HTMLElement, prop: string) {
        return parseFloat(element.style[prop].replace("px", ""));
    }

    function getAbsPosInfo(element: HTMLElement) {
        const left = getPosProp(element, "left");
        const width = getPosProp(element, "width");
        return {
            left,
            width,
            right: left + width,
        };
    }

    /**
     * Performs a test to make sure that when a sort is performed by the user, that it then gets persisted to PBI
     * @param updateGetter A getter for the update options
     * @param colToSort The column to sort
     * @param sortAsc Whether or not to sort ascending
     */
    function sortSavesConfigurationToPBITest(updateInfo: { options: any, expected: any }, colToSort: string, sortAsc: boolean) {
        // The user loads just a basic dataset into PBI
        const { options, expected } = updateInfo;
        const { updateComplete, host } = createVisualWithUpdate(options);

        return updateComplete.then(() => {
            return new Promise((resolve) => {
                // Override the persistence to make sure they are saving the right data,
                // so when it is sorted, we make sure it saves it to PBI
                host.persistProperties = (props: any) => {

                    // It should only have the "merge" props at this point
                    expect(Object.keys(props)).to.be.deep.equal(["merge"]);

                    // Find the explicit layout prop that is being saved.
                    const layoutProp = props.merge.filter((n: any) => n.objectName === "layout")[0].properties.layout;
                    expect(layoutProp).to.not.be.empty;

                    // Now check to make sure the sort property is set properly on the config
                    const parsedLayout: ITableSorterConfiguration = JSON.parse(layoutProp);
                    expect(parsedLayout.sort).to.be.deep.eq({ column: colToSort, asc: sortAsc });

                    resolve();
                };

                // After TableSorter has had time to render
                // The user sorts a column
                performSort(parentEle, {
                    column: colToSort,
                    label: colToSort,
                }, true, sortAsc);
            });
        });
    }


    it("should restore column ordering if a user reorders a basic column", () => {
        const { options, expected } = userSortedAndReorderedColumn();
        const { updateComplete } = createVisualWithUpdate(options);

        return updateComplete.then(() => {
            expectHeadersInCorrectOrder(parentEle, expected.columns);
        });
    });

    it("should restore a sort if the user sorted a column", () => {
        const { options, expected } = userSortedAndReorderedColumn();
        const { updateComplete } = createVisualWithUpdate(options);

        return updateComplete.then(() => {

            // Make sure that what is actually displayed is accurate
            expectRowsMatch(parentEle, expected.columns, expected.rows);
        });
    });

    it("should remove the sort on a sorted rank column, if the user changes the rank column into a regular column in PBI", () => {
        const { options, expected } = userSwitchedRankColumnToRegularColumn();
        const { updateComplete } = createVisualWithUpdate(options);

        return updateComplete.then(() => {

            // Make sure that what is actually displayed is accurate
            expectRowsMatch(parentEle, expected.columns, expected.rows);
        });
    });

    it("should remove the filter on a filtered rank column, if the user changes the rank column into a regular column in PBI", () => {
        const { options, expected } = userSwitchedRankColumnToRegularColumn();
        const { updateComplete } = createVisualWithUpdate(options);

        return updateComplete.then(() => {

            // This is basically the same as the sort check, because the `expected` is unfiltered
            expectRowsMatch(parentEle, expected.columns, expected.rows);
        });
    });

    it("should remove the generated rank columns, if the user changes a rank column into a regular column in PBI", () => {
        const { options } = userSwitchedRankColumnToRegularColumn();
        const { updateComplete } = createVisualWithUpdate(options);

        return updateComplete.then(() => {

            // If any of the headers have digits in them, then the generated columns are still there
            expect(getHeaderNames(parentEle).some(n => n.indexOf("0") >= 0)).to.be.false;
        });
    });

    it("should remove the sort on a column, if the user changes the column into a ranked column in PBI", () => {
        const { options, expected } = userSwitchedRegularColumnToRankColumn();
        const { updateComplete } = createVisualWithUpdate(options);

        return updateComplete.then(() => {

            // Make sure that what is actually displayed is accurate
            expectRowsMatch(parentEle, expected.columns, expected.rows);
        });
    });

    it("should remove the filter on a column, if the user changes the column into a ranked column in PBI", () => {
        const { options, expected } = userSwitchedRegularColumnToRankColumn();
        const { updateComplete } = createVisualWithUpdate(options);

        return updateComplete.then(() => {

            // This is basically the same as the sort check, because the `expected` is unfiltered
            expectRowsMatch(parentEle, expected.columns, expected.rows);
        });
    });

    it("should add the generated rank columns, if the user changes a column into a ranked column in PBI", () => {
        const { options, expected } = userSwitchedRegularColumnToRankColumn();
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
        const { options, expected } = userRemovesAColumnFromPBIThatWasSorted();
        const { updateComplete } = createVisualWithUpdate(options);

        return updateComplete.then(() => {

            // This is basically the same as the sort check, because the `expected` is unfiltered
            expectRowsMatch(parentEle, expected.columns, expected.rows);
        });
    });

    it("should not crash if a user removes a column that was filtered, from PBI's field list", () => {
        const { options, expected } = userRemovesAColumnFromPBIThatWasFiltered();
        const { updateComplete } = createVisualWithUpdate(options);

        return updateComplete.then(() => {

            // This is basically the same as the sort check, because the `expected` is unfiltered
            expectRowsMatch(parentEle, expected.columns, expected.rows);
        });
    });

    it("should sort correctly if the user sorts a column", () => {
        // The user loads just a basic dataset into PBI
        const { options, expected, numericColumn: colToSort } = userLoadsBasicDataSet();
        const { updateComplete } = createVisualWithUpdate(options);

        return updateComplete.then(() => {
            // After TableSorter has had time to render
            // The user sorts a column
            return performSort(parentEle, {
                column: colToSort,
                label: colToSort,
            }, true, true);
        })
        .then(() => {
            expectRowsMatch(parentEle, expected.columns, expected.rowsSortedByNumericColumnAsc);
        });
    });

    it("should attempt to save the new configuration after a user sorts a column", () => {
        const dataSet = userLoadsBasicDataSet();
        sortSavesConfigurationToPBITest(dataSet, dataSet.numericColumn, true);
    });

    it("should sort correctly if the user sorts a column desc", () => {
        // The user loads just a basic dataset into PBI
        const { options, expected, numericColumn: colToSort } = userLoadsBasicDataSet();
        const { updateComplete } = createVisualWithUpdate(options);

        return updateComplete.then(() => {
            // After TableSorter has had time to render
            // The user sorts a column
            return performSort(parentEle, {
                column: colToSort,
                label: colToSort,
            }, true, false);
        })
        .then(() => {
            expectRowsMatch(parentEle, expected.columns, expected.rowsSortedByNumericColumnDesc);
        });
    });

    it("should attempt to save the new configuration after a user sorts a column desc", () => {
        const dataSet = userLoadsBasicDataSet();
        sortSavesConfigurationToPBITest(dataSet, dataSet.numericColumn, false);
    });

    it("should restore stacked column headers correctly", () => {
        // The user loads just a basic dataset into PBI
        const { options } = userLoadedWithASortedStackedColumn();
        const { updateComplete } = createVisualWithUpdate(options);

        return updateComplete.then(() => {
            const headerNames = getHeaderNames(parentEle);

            // The reason why it isn't just ["Customer Name", "Stacked", "Discount", "Profit"]
            // is because ALL headers that show up in the header at all, regardless if they are stacked or not,
            // show up as a header, lineup just cleverly positions absolutely, rather than dom ordering based.
            const expected = ["Customer Name", "Discount", "Stacked", "Profit", "Discount", "Profit"];
            expect(headerNames).to.be.deep.equal(expected);

            const headers = getHeaders(parentEle, true);

            const stackHeaderPosition = getAbsPosInfo(headers[2]);
            const stackedDiscountHeaderPosition = getAbsPosInfo(headers[1]);
            const stackedProfitHeaderPosition = getAbsPosInfo(headers[3]);

            // Discount left must be close to the stack header's left position (so it looks like it is under the header)
            // and it must end before the end of the stack header
            expect(stackedDiscountHeaderPosition.left).to.be.closeTo(stackHeaderPosition.left, 5, "Discount Header Left");
            expect(stackedDiscountHeaderPosition.right).to.be.lessThan(stackHeaderPosition.right, "Discount Header Right");

            // Same for profit, but it's left must be just right of the discount header
            expect(stackedProfitHeaderPosition.left).to.be.closeTo(stackedDiscountHeaderPosition.right, 5, "Profit Header Left");
            expect(stackedProfitHeaderPosition.right).to.be.closeTo(stackHeaderPosition.right, 5, "Profit Header Right");

        });
    });

    it("should restore stacked column sorts correctly", () => {
        // The user loads just a basic dataset into PBI
        const { options, expected, numericColumn } = userLoadedWithASortedStackedColumn();
        const { updateComplete } = createVisualWithUpdate(options);

        return updateComplete.then(() => {
            // Fix this shutdown      
            return performSort(parentEle, {
                column: numericColumn,
                label: numericColumn,
            }, true, false);
        }).then(() => {
            expectRowsMatch(parentEle, expected.columns, expected.rowsSortedByNumericColumnAsc);
        });
    });

    it("should restore stacked desc column sorts correctly", () => {
        // The user loads just a basic dataset into PBI
        const { options, expected, numericColumn } = userLoadedWithASortedStackedColumn();
        const { updateComplete } = createVisualWithUpdate(options);

        return updateComplete.then(() => {
            // Fix this shutdown      
            return performSort(parentEle, {
                column: numericColumn,
                label: numericColumn,
            }, true, true);
        }).then(() => {
            expectRowsMatch(parentEle, expected.columns, expected.rowsSortedByNumericColumnDesc);
        });
    });

    it("should not generate 'NaN' ranking columns when the dataset contains null values", () => {
        const { options } = userLoadedDatasetWithNullRankValues();
        const { updateComplete } = createVisualWithUpdate(options);

        return updateComplete.then(() => {
            expect(getHeaderNames(parentEle)).to.be.deep.equal(["Name", "b", " 1"]);
        });
    });

    it("should not generate any ranking columns when column used for ranking is not a numeric column", () => {
        const { options } = userLoadedDatasetWithANonNumericRankColumn();
        const { updateComplete } = createVisualWithUpdate(options);
        return updateComplete.then(() => {
            expect(getHeaderNames(parentEle)).to.be.deep.equal(["Customer Name", "Order Date"]);
        });
    });

    it("should load correctly when the user just loads a rank column", () => {
        const { options, expected } = userJustLoadedARankColumn();
        const { updateComplete } = createVisualWithUpdate(options);
        return updateComplete.then(() => {
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
