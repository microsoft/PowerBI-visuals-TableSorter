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

/* tslint:disable */
require("@essex/pbi-base/dist/spec/visualHelpers");
import * as $ from "jquery";
$.extend(true, global['powerbi'], {
    visuals: {
        StandardObjectProperties: {
            labelDisplayUnits: {
                type: {}
            },
            labelPrecision: {
                type: {}
            }
        },
        SelectionId: {
            createNull: () => ({}),
        },
        valueFormatter: {
            create: () => (() => 0)
        }
    },
});
import * as _ from "lodash";

/* tslint:enable */
import { Utils as SpecUtils } from "@essex/pbi-base/dist/spec/visualHelpers";
import { UpdateType } from "@essex/pbi-base";
import { expect } from "chai";
import { default as TableSorterVisual  } from "./TableSorterVisual";
import { Promise } from "es6-promise";

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
        let currentUpdateType: UpdateType;
        let instance: TableSorterVisual = new TableSorterVisual(true, {
            presentation: {
                animation: false,
            },
        }, () => currentUpdateType);
        let initOptions = SpecUtils.createFakeInitOptions();
        parentEle.append(initOptions.element);
        instance.init(initOptions);
        return {
            instance,
            element: initOptions.element,
            setUpdateType: (type: UpdateType) => currentUpdateType = type,
        };
    };

    const smallUpdateOptions = () => {
        const baseOptions = SpecUtils.createUpdateOptionsWithSmallData();
        const cols = baseOptions.dataViews[0].table.columns;
        cols.forEach(n => {
            n.queryName = n.displayName;
            n.roles = {};
        });
        baseOptions.dataViews[0].metadata.columns = cols.slice(0);
        return baseOptions;
    };

    const basicOptions = () => {
        const baseOptions = SpecUtils.createUpdateOptionsWithData();
        const cols = baseOptions.dataViews[0].table.columns;
        cols.forEach(n => {
            n.queryName = n.displayName;
            n.roles = {};
        });
        baseOptions.dataViews[0].metadata.columns = cols.slice(0);
        return baseOptions;
    };

    it("should load", () => {
        expect(createVisual()).to.not.be.undefined;
    });

    it("should remove columns from TableSorter.configuration if columns are removed from PBI", () => {
        let { instance, setUpdateType } = createVisual();

        // Load initial data
        setUpdateType(UpdateType.Data);
        instance.update(basicOptions());
        expect(instance.tableSorter.configuration.columns.length).to.be.equal(2);

        // Pretend that we had an existing config
        let config = instance.tableSorter.configuration;
        let newOptions = smallUpdateOptions();
        newOptions.dataViews[0].metadata = <any>{
            objects: {
                "layout": {
                    "layout": JSON.stringify(config),
                },
            },
        };

        // Run update again with new options
        setUpdateType(UpdateType.Data);
        instance.update(newOptions);

        // Make sure it removed the extra column
        expect(instance.tableSorter.configuration.columns.length).to.be.equal(1);
    });

    it("should load the data into the tablesorter if only columns changed", () => {
        let { instance, setUpdateType } = createVisual();

        // Load initial data
        setUpdateType(UpdateType.Data);
        instance.update(basicOptions());
        expect(instance.tableSorter.configuration.columns.length).to.be.equal(2);

        instance.tableSorter = <any>{};
        setUpdateType(UpdateType.Data);
        instance.update(smallUpdateOptions());

        // TODO: Assume the data is legit for now
        expect(instance.tableSorter.dataProvider).to.not.be.undefined;
    });

    it("should remove sort from TableSorter.configuration if columns are removed from PBI", () => {
        let { instance, setUpdateType } = createVisual();

        // Load initial data
        let data = basicOptions();
        setUpdateType(UpdateType.Data);
        instance.update(data);
        expect(instance.tableSorter.configuration.columns.length).to.be.equal(2);

        // Pretend that we had an existing config
        let newOptions = smallUpdateOptions();
        let config = instance.tableSorter.configuration;

        // Add a sort to the missing data, which in this case is the second column in the original data
        config.sort = {
            // This column is removed in the "Small" dataset
            column: data.dataViews[0].table.columns[1].displayName,
            asc: true,
        };

        newOptions.dataViews[0].metadata = <any>{
            objects: {
                "layout": {
                    "layout": JSON.stringify(config),
                },
            },
        };

        // Run update again with new options
        setUpdateType(UpdateType.Data);
        instance.update(newOptions);

        // Make sure it removed the extra column
        expect(instance.tableSorter.configuration.sort).to.be.undefined;
    });

    it("should load tableSorter with a new provider when new data is passed via PBI", () => {
        let { instance, setUpdateType } = createVisual();
        let fakeProvider = {
            canQuery: () => Promise.resolve(false),
        } as any;

        // HACK, we should make it "protected"
        instance["createDataProvider"] = <any>(() => fakeProvider);

        // Load initial data
        let data = basicOptions();
        setUpdateType(UpdateType.Data);
        instance.update(data);

        expect(instance.tableSorter.dataProvider).to.be.equal(fakeProvider); // Make sure it sets my data provider
    });

    it("should load tableSorter with the correct layout stored in PBI", () => {
        let { instance, setUpdateType } = createVisual();
        let fakeProvider = {
            canQuery: () => Promise.resolve(false),
        } as any;

        // HACK, we should make it "protected"
        instance["createDataProvider"] = <any>(() => fakeProvider);

        // Load initial data
        const data = basicOptions();
        setUpdateType(UpdateType.Data);
        instance.update(data);

        // Tweak the layout of the table
        const config = instance.tableSorter.configuration;
        const newLayout = {
            primary: [{
                column: "COLUMN_2",
            }, {
                column: "COLUMN_1",
            }, {
                column: "COLUMN_1",
            }],
        };
        data.dataViews[0].metadata = <any>{
            objects: {
                "layout": {
                    "layout": JSON.stringify($.extend(true, {}, config, {
                        "layout": newLayout,
                     })),
                },
            },
        };

        // Update TableSorterVisual with the new layout
        setUpdateType(UpdateType.Settings);
        instance.update(data);

        // Make sure the layouts match
        expect(instance.tableSorter.configuration.layout).to.be.deep.equal(newLayout);
    });

    describe("Integration", () => {
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
