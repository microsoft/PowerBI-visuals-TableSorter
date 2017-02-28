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
import { getColumnValues, setStringFilter, setNumericalFilter, performClick, performSort } from "./spec/utils";
import { expectHeadersInCorrectOrder } from "./spec/expectations";
import { expect } from "chai";

import {
    ITableSorterSettings,
    ITableSorterRow,
    IDataProvider,
    ITableSorterConfiguration,
} from "./models";
import * as $ from "jquery";
import { Promise } from "es6-promise";
import { TableSorter } from "./TableSorter";
const tableSorterMock = require("inject!./TableSorter"); // tslint:disable-line
import { convertSort } from "./conversion";

describe("TableSorter.e2e", () => {
    let parentEle: JQuery;
    let instances: any[] = [];
    beforeEach(() => {
        parentEle = $("<div></div>");
    });

    afterEach(() => {
        instances.forEach(n => {
            if (n.lineupImpl && n.lineupImpl.destroy) {
                n.destroy();
            }
        });
        instances.length = 0;
        parentEle = undefined;
    });

    let createInstance = () => {
        let ele = $("<div>");
        parentEle.append(ele);
        let result = {
            instance: new TableSorter(ele),
            element: ele,
        };

        // For cleaning up
        instances.push(result.instance);

        // result.instance.dimensions = { width: 800, height: 20000 };
        result.instance.settings = {
            presentation: {
                animation: false,
                values: true,
                numberFormatter: (n) => n + "",
            },
        };
        return result;
    };
    let testColumns = () => {
        return [{
            column: "col1",
            label: "Column",
            type: "string",
        }, {
            column: "col2",
            label: "Column2",
            type: "number",
        }, {
            column: "col3",
            label: "Column3",
            type: "number",
        }];
    };

    let createProvider = (data: any[]) => {
        let resolver: Function;
        let fakeProvider = <any>{
            shouldResolve: true,
            alwaysResolve: true,
            canQuery(options: any) {
                return Promise.resolve(fakeProvider.alwaysResolve || fakeProvider.shouldResolve);
            },
            generateHistogram() {
                return Promise.resolve([]);
            },
            query(options: any) {
                return new Promise((resolve2) => {
                    resolve2({
                        total: data.length,
                        results: data,
                        replace: true,
                    });
                    fakeProvider.shouldResolve = false;

                    // Ghetto hax, 50 because it tries to checkLoadMoreData after 10 milliseconds.
                    setTimeout(function () {
                        resolver();
                    }, 20);
                });
            },
        };
        return {
            instanceInitialized: new Promise((resolve) => {
                resolver = resolve;
            }),
            provider: <IDataProvider>fakeProvider,
        };
    };

    let createFakeData = () => {
        let rows: ITableSorterRow[] = [];
        for (let i = 0; i < 100; i++) {
            (function (myId: any) {
                rows.push(<any>{
                    id: myId, // id is absolutely, positively necessary, otherwise it renders stupidly
                    col1: myId,
                    col2: i * (Math.random() * 100),
                    col3: i,
                    selected: false,
                    equals: (other: any) => (myId) === other["col1"],
                });
            })("FAKE_" + i);
        }
        const cols = testColumns();
        return {
            data: rows,
            columns: cols,
            stringColumns: cols.filter(n => n.type === "string"),
            numberColumns: cols.filter(n => n.type === "number"),
        };
    };


    let loadInstanceWithStackedColumns = () => {
        let { instance, element } = createInstance();
        let data = createFakeData();
        let providerInfo = createProvider(data.data);
        instance.dataProvider = providerInfo.provider;
        providerInfo.instanceInitialized.then(() => {
            let desc = {
                label: "STACKED_COLUMN",
                width: 10,
                children: [
                    { column: "col2", type: "number", weight: 100 },
                ],
            };
            let inst = instance.lineupImpl;
            inst.storage.addStackedColumn(desc);
            inst.headerUpdateRequired = true;
            inst.updateAll();
        });
        return {
            instance,
            element,
            data,
            instanceInitialized: providerInfo.instanceInitialized,
        };
    };

    let loadInstanceWithData = () => {
        let { instance, element } = createInstance();
        instance.dimensions = { width: 800, height: 1000 };
        let data = createFakeData();
        let providerInfo = createProvider(data.data);
        instance.dataProvider = providerInfo.provider;
        return {
            instance,
            element,
            data,
            provider: providerInfo.provider,
            instanceInitialized: providerInfo.instanceInitialized,
        };
    };

    let loadInstanceWithStackedColumnsAndClick = () => {
        let { instance, element, data, instanceInitialized } = loadInstanceWithStackedColumns();

        instanceInitialized = instanceInitialized.then((result) => {
            let headerEle = element.find(".header:contains('STACKED_COLUMN')");
            performClick(headerEle);
            return result;
        });

        return {
            instance,
            element,
            data,
            instanceInitialized,
        };
    };

    let loadInstanceWithSettings = (settings: ITableSorterSettings) => {
        let { instance, element } = createInstance();
        let data = createFakeData();

        let { provider, instanceInitialized } = createProvider(data.data);

        instance.dataProvider = provider;

        // Set the settings
        instance.settings = $.extend(true, {}, settings, {
            presentation: {
                animation: false,
            },
        });

        return {
            instance,
            element,
            instanceInitialized,
            data,
        };
    };

    let loadInstanceWithConfiguration = (config: ITableSorterConfiguration) => {
        let { instance, element } = createInstance();
        instance.dimensions = { width: 800, height: 1000 };
        let data = createFakeData();
        let { provider, instanceInitialized } = createProvider(data.data);
        provider["shouldResolve"] = true;
        provider["alwaysResolve"] = true;

        instance.dataProvider = provider;

        instance.configuration = config;

        return {
            instance,
            element,
            instanceInitialized,
            data,
        };
    };

    /**
     * Creates an instance with a filter on it
     */
    function loadInstanceWithFilter() {
        let { data, instanceInitialized, provider, element, instance } = loadInstanceWithData();
        const col = data.stringColumns[0];
        const filterColName = col.column;
        const filterVal = data.data[1][filterColName];
        instanceInitialized = instanceInitialized
            // Basically set the filter to the value in the second row
            .then(() => setStringFilter(parentEle, filterColName, filterVal));
        return { filterColName, filterVal, ready: instanceInitialized, provider, element, instance, data };
    }

    /**
     * Performs the infinite load
     */
    function performInfiniteLoad() {
        // HACKY: This mimics a scroll event
        const scrollable = parentEle.find(".lu-wrapper");
        scrollable.scrollTop(scrollable.height());
        instances[0].lineupImpl.scrolled();
    }

    describe("events", () => {

        describe("sortChanged", () => {
            it("should call the event when a column header is clicked", () => {
                let { instance, element } = createInstance();
                let called = false;
                instance.events.on(TableSorter.EVENTS.SORT_CHANGED, (item: any) => {
                    called = true;
                });
                let providerInfo = createProvider(createFakeData().data);
                instance.dataProvider = providerInfo.provider;
                return providerInfo.instanceInitialized.then(() => {
                    // Click on de header
                    let headerEle = element.find(".header:contains('col1')");
                    performClick(headerEle);

                    expect(called).to.be.true;
                });
            });

            it("should call the event with the correct params", () => {
                let { instance, element } = createInstance();
                instance.events.on(TableSorter.EVENTS.SORT_CHANGED, (colName: string) => {
                    expect(colName).to.equal("col1");
                });

                let providerInfo = createProvider(createFakeData().data);
                instance.dataProvider = providerInfo.provider;
                return providerInfo.instanceInitialized.then(() => {
                    // // Click on de header
                    let headerEle = element.find(".header:contains('col1')");
                    performClick(headerEle);
                });
            });
        });

        describe("selectionChanged", () => {
            it("should call the event when a row is clicked", () => {
                let { instance, element } = createInstance();
                let called = false;
                instance.events.on(TableSorter.EVENTS.SELECTION_CHANGED, (selection: any) => {
                    called = true;
                    expect(selection.length).to.be.equal(1);
                    expect(selection[0].col1).to.be.equal("FAKE_0"); // Very first row
                });

                let providerInfo = createProvider(createFakeData().data);
                instance.dataProvider = providerInfo.provider;
                return providerInfo.instanceInitialized.then(() => {
                    let row = element.find(".row").first();
                    performClick(row);
                    expect(called).to.be.true;
                });

            });
            it("should call the event when a row is clicked twice", () => {
                let { instance, element } = createInstance();

                let providerInfo = createProvider(createFakeData().data);
                instance.dataProvider = providerInfo.provider;
                return providerInfo.instanceInitialized.then(() => {
                    let row = element.find(".row").first();
                    performClick(row);

                    let called = false;
                    instance.events.on(TableSorter.EVENTS.SELECTION_CHANGED, (selection: any) => {
                        called = true;
                        expect(selection.length).to.be.equal(0);
                    });

                    performClick(row);

                    expect(called).to.be.true;
                });

            });
        });

        describe("selection", () => {
            it("should clear the selection when the clear button is pressed", () => {
                let { instance, element } = createInstance();
                let providerInfo = createProvider(createFakeData().data);
                instance.dataProvider = providerInfo.provider;
                return providerInfo.instanceInitialized.then(() => {
                    let called = false;
                    instance["lineupImpl"].clearSelection = <any>function () {
                        called = true;
                    };
                    instance.selection = [<any>{
                        id: "SomeSelectedItem",
                    }];
                    expect(called).to.be.false;
                    performClick(element.find(".clear-selection"));
                    expect(called).to.be.true;
                });
            });

            describe("multi", () => {
                it("should update when a row is clicked on", () => {
                    let { instance, element } = createInstance();
                    let { data } = createFakeData();

                    let providerInfo = createProvider(createFakeData().data);
                    instance.dataProvider = providerInfo.provider;
                    return providerInfo.instanceInitialized.then(() => {
                        let row = element.find(".row").first();
                        performClick(row);

                        expect(instance.selection[0]["col1"]).to.be.equal(data[0]["col1"]);
                    });

                });

                it("should deselect a row that was selected twice", () => {
                    let { instance, element } = createInstance();

                    let providerInfo = createProvider(createFakeData().data);
                    instance.dataProvider = providerInfo.provider;
                    return providerInfo.instanceInitialized.then(() => {
                        let row = element.find(".row").first();
                        performClick(row);
                        performClick(row);

                        expect(instance.selection.length).to.be.equal(0);
                    });
                });

                it("should select multiple rows", () => {
                    let { instance, element } = loadInstanceWithSettings({
                        selection: {
                            singleSelect: false,
                            multiSelect: true,
                        },
                    });
                    let { data } = createFakeData();
                    let providerInfo = createProvider(data);
                    instance.dataProvider = providerInfo.provider;
                    return providerInfo.instanceInitialized.then(() => {
                        let rows = element.find(".row");
                        performClick($(rows[0]));
                        performClick($(rows[1]));

                        expect(instance.selection.length).to.be.equal(2);
                        expect(instance.selection.map((row) => row["col1"])).to.be.deep.equal(data.slice(0, 2).map((r) => r["col1"]));
                    });

                });

                it("should retain selection when set", () => {
                    let { instance } = createInstance();
                    let { data } = createFakeData();

                    let providerInfo = createProvider(createFakeData().data);
                    instance.dataProvider = providerInfo.provider;
                    return providerInfo.instanceInitialized.then(() => {
                        instance.selection = [data[0]];
                        expect(instance.selection[0]["col1"]).to.be.equal(data[0]["col1"]);
                    });
                });
            });

            describe("single", () => {
                let createInstanceWithSingleSelect = () => {
                    return loadInstanceWithSettings({
                        selection: {
                            singleSelect: true,
                            multiSelect: false,
                        },
                    });
                };
                it("should update when a row is clicked on", () => {
                    let { instance, element } = createInstanceWithSingleSelect();
                    let { data } = createFakeData();

                    let providerInfo = createProvider(createFakeData().data);
                    instance.dataProvider = providerInfo.provider;
                    return providerInfo.instanceInitialized.then(() => {
                        let row = element.find(".row").first();
                        performClick(row);

                        expect(instance.selection[0]["col1"]).to.be.equal(data[0]["col1"]);
                    });
                });

                it("should deselect a row that was selected twice", () => {
                    let { instance, element } = createInstanceWithSingleSelect();

                    let providerInfo = createProvider(createFakeData().data);
                    instance.dataProvider = providerInfo.provider;
                    return providerInfo.instanceInitialized.then(() => {
                        let row = element.find(".row").first();
                        performClick(row);
                        performClick(row);

                        expect(instance.selection.length).to.be.equal(0);
                    });
                });

                it("should select the last row when multiple rows are clicked", () => {
                    let { instance, element } = createInstanceWithSingleSelect();
                    let { data } = createFakeData();

                    let providerInfo = createProvider(data);
                    instance.dataProvider = providerInfo.provider;
                    return providerInfo.instanceInitialized.then(() => {

                        let rows = element.find(".row");
                        performClick($(rows[0]));
                        performClick($(rows[1]));

                        expect(instance.selection.length).to.be.equal(1);
                        expect(instance.selection[0]["col1"]).to.be.deep.equal(data[1]["col1"]);
                    });
                });

                it("should retain selection when set", () => {
                    let { instance } = createInstanceWithSingleSelect();
                    let { data } = createFakeData();

                    let providerInfo = createProvider(data);
                    instance.dataProvider = providerInfo.provider;
                    return providerInfo.instanceInitialized.then(() => {
                        instance.selection = [data[0]];
                        expect(instance.selection[0]["col1"]).to.be.equal(data[0]["col1"]);
                    });
                });
            });
        });

        describe("getSortFromLineUp", () => {
            it("does not crash when sorting a stacked column", () => {
                let {instance, instanceInitialized} = loadInstanceWithStackedColumnsAndClick();
                return instanceInitialized.then(() => {
                    expect(convertSort(instance.lineupImpl)).not.to.throw;
                });
            });

            it("returns a 'stack' property when a stack is cliked on", () => {
                let {instance, instanceInitialized} = loadInstanceWithStackedColumnsAndClick();
                return instanceInitialized.then(() => {
                    let result = convertSort(instance.lineupImpl);
                    expect(result.stack.name).to.equal("STACKED_COLUMN");
                    expect(result.column).to.be.undefined;
                });
            });
        });

        it("should sort the data provider if the sort has changed in lineup", () => {
            let { data, instanceInitialized, provider } = loadInstanceWithData();
            const col = data.stringColumns[0];
            const colName = col.column;
            return instanceInitialized
                .then(() => {
                    return new Promise(resolve => {
                        // Override the sort on the provider, cause lineup should call this after the
                        // column has been clicked by the user to sort it
                        provider.sort = (sort) => {
                            expect(sort.column).to.be.equal(colName);
                            expect(sort.asc).to.be.true;
                            resolve();
                        };

                        // Pretend the user attempted to sort the column
                        performSort(parentEle, col, false);
                    });
                });
        });

        it("should sort desc the data provider if the sort has changed in lineup to desc", () => {
            let { data, instanceInitialized, provider } = loadInstanceWithData();
            const col = data.stringColumns[0];
            const colName = col.column;
            return instanceInitialized
                .then(() => {
                    return new Promise(resolve => {
                        let count = 0;
                        provider.sort = (sort) => {
                            count++;
                            if (count === 2) { // performSort does it twice, so check the second one
                                expect(sort.column).to.be.equal(colName);
                                expect(sort.asc).to.be.false;
                                resolve();
                            }
                        };
                        performSort(parentEle, col, false, false);
                    });
                });
        });

        // it("should allow for the user filtering a numerical, and then allow for the user to scroll to load more data");
        it("should allow string column filtering through the UI", () => {
            let { data, instanceInitialized } = loadInstanceWithData();
            const col = data.stringColumns[0];
            const colName = col.column;
            const value = data.data[1][colName];
            return instanceInitialized
                .then(() => setStringFilter(parentEle, colName, value)) // Basically set the filter to the value in the second row
                .then(() => getColumnValues(parentEle, colName))
                .then((rowValues) => {
                    expect(rowValues.length).to.be.gte(1);
                    rowValues.forEach(n => expect(n).to.contain(value));
                });
        });

        it.skip("should allow numerical column filtering through the UI", () => {
            let { data, instanceInitialized } = loadInstanceWithData();
            const col = data.numberColumns[0];
            const colName = col.column;
            const value = data.data[1][colName];
            return instanceInitialized
                .then(() => setNumericalFilter(parentEle, colName, value)) // Basically set the filter to the value in the second row
                .then(() => getColumnValues(parentEle, colName))
                .then((rowValues) => {
                    expect(rowValues.length).to.be.gte(1);
                    rowValues.forEach(n => expect(n).to.be.equal(value));
                });
        });

        // it("should allow for the user filtering a numerical, and then allow for the user to scroll to load more data");
        it("should allow for infinite scrolling without a filter");
        it("should check to see if there is more data when infinite scrolling", () => {
            let { instanceInitialized, provider } = loadInstanceWithData();
            return instanceInitialized
                .then(() => {
                    return new Promise((resolve, reject) => {
                        setTimeout(() => {
                            provider.query = (() => {
                                reject(new Error("Should not be called"));
                            }) as any;

                            provider.canQuery = (options) => {
                                setTimeout(resolve, 10);
                                return Promise.resolve(false);
                            };

                            performInfiniteLoad();
                        }, 10);
                    });
                });
        });

        // it("should allow for the user filtering a numerical, and then allow for the user to scroll to load more data");
        it("should check to see if there is more data when infinite scrolling and there is a filter", () => {
            let { filterColName, filterVal, ready, provider } = loadInstanceWithFilter();
            return ready
                .then(() => {
                    return new Promise((resolve, reject) => {
                        // Make sure query isn't called
                        provider.query = (() => {
                            reject(new Error("Should not be called"));
                        }) as any;

                        // make sure canQuery is called with the correct filter
                        provider.canQuery = (options) => {
                            const filter = options.query.filter(n => n.column === filterColName)[0];
                            expect(filter).to.be.deep.equal({
                                column: filterColName,
                                value: filterVal,
                            });

                            // Resolve it after a delay (ie after TableSorter gets it and has time to call query)
                            setTimeout(resolve, 10);

                            return Promise.resolve(false);
                        };

                        // Start the infinite load process
                        performInfiniteLoad();
                    });
                });
        });

        it("should attempt to load more data when infinite scrolling", () => {
            let { instanceInitialized, provider } = loadInstanceWithData();
            return instanceInitialized
                .then(() => {
                    return new Promise(resolve => {
                        provider.query = resolve as any;
                        provider.canQuery = () => Promise.resolve(true);

                        // Start the infinite load process
                        performInfiniteLoad();
                    });
                });
        });

        describe("integration", () => {
            it("saves the configuration when a stacked column is sorted", () => {
                let {instance, instanceInitialized} = loadInstanceWithStackedColumnsAndClick();
                return instanceInitialized.then(() => {
                    expect(instance.configuration.sort).to.not.be.undefined;
                    expect(instance.configuration.sort.stack.name).to.be.equal("STACKED_COLUMN");
                    expect(instance.configuration.sort.column).to.be.undefined;
                });
            });
            it("saves the configuration when the column layout has been changed", () => {
                let {instance, instanceInitialized } = loadInstanceWithStackedColumns();
                return instanceInitialized.then(() => {
                    let called = false;
                    instance.events.on(TableSorter.EVENTS.CONFIG_CHANGED, () => {
                        called = true;
                    });

                    // Ghetto: Manually say that the columns have changed, usually happens if you drag/drop add columns
                    instance.lineupImpl.listeners["columns-changed"]();

                    expect(called).to.be.true;
                });
            });
            it("loads lineup with a sorted stacked column", () => {
                let {instance, data, instanceInitialized } = loadInstanceWithStackedColumns();
                return instanceInitialized.then(() => {
                    instance.configuration = {
                        primaryKey: "col1",
                        columns: data.columns,
                        sort: {
                            stack: {
                                name: "STACKED_COLUMN",
                            },
                            asc: true,
                        },
                    };
                    let result = convertSort(instance.lineupImpl);
                    expect(result.stack.name).to.equal("STACKED_COLUMN");
                    expect(result.column).to.be.undefined;
                });
            });
            it("loads lineup with a filtered numerical column if it intially is filtered", () => {
                let { instance } = loadInstanceWithConfiguration(<any>{
                    primaryKey: "primary",
                    columns: testColumns(),
                    layout: {
                        primary: [{
                            column: "col3",
                            domain: [1, 1], // should just be a single column
                        }],
                    },
                });
                const q = instance.getQueryOptions().query;
                expect(q).to.be.deep.equal([{ column: "col3", value: { domain: [1, 1], range: undefined } }]);
            });

            it("loads lineup with a sorted stacked column and allows for filtering", () => {
                let { data, instanceInitialized, instance } = loadInstanceWithStackedColumns();
                const col = data.stringColumns[0];
                const filterColName = col.column;
                const filterVal = data.data[1][filterColName];
                return instanceInitialized
                    .then(() => setStringFilter(parentEle, filterColName, filterVal))
                    .then(() => getColumnValues(parentEle, filterColName))
                    .then((rowValues) => {
                        // Validate that the row values are correct
                        expect(rowValues.length).to.be.gte(1);
                        rowValues.forEach(n => expect(n).to.contain(filterVal));
                    })
                    .then(() => {
                        return new Promise(resolve => {
                            const config = instance.configuration;
                            const cols = config.layout.primary
                                .map((n: any) => n.column || n.label)
                                .filter((n: any) => !!n && n !== "id");
                            expect(cols).to.be.deep.equal(["col1", "STACKED_COLUMN", "col2", "col3"]);
                            resolve();
                        });
                    });
            });

            it("correctly loads the ordering of columns from a configuration", () => {
                const cols = testColumns();
                let { instanceInitialized } = loadInstanceWithConfiguration({
                    primaryKey: "primary",
                    columns: cols.slice(0),
                    layout: {
                        primary: cols.reverse(),
                    },
                });
                return instanceInitialized.then(() => {
                    expectHeadersInCorrectOrder(parentEle, cols.map(n => n.label));
                });
            });
        });
    });
});
