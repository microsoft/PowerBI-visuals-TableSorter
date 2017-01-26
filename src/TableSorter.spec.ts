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
import "@essex/pbi-base/dist/spec/visualHelpers";
import { getColumnValues, getHeaderNames, getFilterEle, getHeader } from "./spec/utils";

// import "../base/testSetup";
/* tslint:enable */
import { expect } from "chai";

import {
    ITableSorterSettings,
    ITableSorterRow,
    IDataProvider,
    ITableSorterSort,
    ITableSorterFilter,
    IQueryResult,
    IQueryOptions,
} from "./models";
import * as sinon from "sinon";
import * as $ from "jquery";
import { Promise } from "es6-promise";
import { TableSorter } from "./TableSorter";
const tableSorterMock = require("inject!./TableSorter"); // tslint:disable-line
// let TableSorterImpl = require("./TableSorter").TableSorter; // tslint:disable-line

describe("TableSorter", () => {
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

    describe("unit", () => {
        /**
         * Returns the given string with px values into a number: 240px => 240
         */
        let pxStrToNum = (pxStr: string) => {
            return pxStr && parseFloat(pxStr.split(/(px)|%/)[0]);
        };

        /**
         * Creates a new instance of the table sorter
         */
        let createInstance = (dataProvider?: any) => {
            let element = $("<div>");
            const myFakeLineupEle = $("<div><div class='lu-wrapper'></div></div>");
            let mockLineup = {
                clearSelection: sinon.stub(),
                scrolled: sinon.stub(),
                changeInteractionOption: sinon.stub(),
                changeRenderingOption: sinon.stub(),
                changeDataStorage: sinon.stub(),
                select: sinon.stub(),
                sortBy: sinon.stub(),
                updateBody: sinon.stub(),
                addNewSingleColumnDialog: sinon.stub(),
                addNewStackedColumnDialog: sinon.stub(),
                listeners: {
                    on: sinon.stub(),
                },
                $container: {
                    node: sinon.stub(),
                },
            };
            mockLineup.$container.node.returns(myFakeLineupEle);
            let storage = sinon.stub();
            let conversionStubs = {
                convertFilters: sinon.stub(),
                convertConfiguration: sinon.stub(),
                convertSort: sinon.stub(),
                convertFiltersFromLayout: sinon.stub(),
            };
            let ctor = tableSorterMock({
                "./conversion": conversionStubs,
                "lineup-v1": {
                    create: function () {
                        return mockLineup;
                    },
                    createLocalStorage: function () {
                        return storage;
                    },
                }, // tslint:disable-line
            }).TableSorter;
            parentEle.append(element);
            let result = {
                instance: (new ctor(element, dataProvider, 0)) as TableSorter,
                element,
                mockLineup,
                stubs: {
                    conversion: conversionStubs,
                },
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

        /**
         * Creates a fake data provider
         */
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

                        // Ghetto hax, 50 because it tries to checkLoadMoreData after 10 seconds.
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

        let loadInstanceWithProvider = (data?: any[], columns?: any) => {
            let { mockLineup, instance, element, stubs } = createInstance();

            if (columns) {
                // Fake the configuration coming from lineup
                stubs.conversion.convertConfiguration.returns({
                    columns: columns,
                    layout: {
                        primary: [],
                    },
                });
            }

            instance.dimensions = { width: 800, height: 1000 };
            // let data = createFakeData();
            let providerInfo = createProvider(data || []);
            instance.dataProvider = providerInfo.provider;
            return {
                instance,
                element,
                mockLineup,
                stubs,
                columns,
                data,
                provider: providerInfo.provider,
                ready: providerInfo.instanceInitialized,
            };
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

        /**
         * Creates a set of fake data
         */
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


        /**
         * Gets a table sorter listener on a lineup event
         */
        const getLineupEventListener = (mockLineup: any, eventName: string) => {
            const callArgs = mockLineup.listeners.on.args.filter((n: any) => n[0].indexOf(eventName) >= 0)[0];
            return callArgs[1] as any;
        };

        /**
         * Simulates a sort occuring within lineup
         */
        const simulateLineupSort = (sort: ITableSorterSort, providerInfo: { columns: any, mockLineup: any, stubs: any }) => {
            const { stubs, columns, mockLineup } = providerInfo;
            // Update the new configuration to include our fake filter
            stubs.conversion.convertSort.returns(sort);
            stubs.conversion.convertConfiguration.returns({
                columns: columns,
                layout: {
                    primary: [],
                },
                sort: sort,
            });

            // Call TableSorter's listener to let it know about the fake filters
            const listener = getLineupEventListener(mockLineup, "change-sortcriteria");
            listener(undefined, {
                column: {
                    id: sort.column,
                    column: sort.column,
                },
            }, false /* DESC */);
        };

        /**
         * Simulates a sort occuring within lineup
         */
        const simulateLineupFilter = (filter: ITableSorterFilter, providerInfo: { columns: any, mockLineup: any, stubs: any }) => {
            const { stubs, columns, mockLineup } = providerInfo;
            // Update the new configuration to include our fake filter
            stubs.conversion.convertFilters.returns([filter]);
            stubs.conversion.convertConfiguration.returns({
                columns: columns,
                layout: {
                    primary: [{
                        column: filter.column,
                        filter: filter.value,
                    }],
                },
            });

            // Call TableSorter's listener to let it know about the fake filters
            const listener = getLineupEventListener(mockLineup, "change-filter");
            listener(undefined, {
                column: {
                    column: filter.column,
                },
                filter: filter.value, // Lineups format is slightly different so we need to map from "value" => "filter"
            });
        };

        /**
         * Simulates an infinite load event from lineup
         */
        const simulateLineupInfiniteLoad = (providerInfo: { mockLineup: any }) => {
            const { mockLineup } = providerInfo;
            // HACKY: This mimics a scroll event
            const scrollable = parentEle.find(".lu-wrapper");
            scrollable.scrollTop(scrollable.height());
            mockLineup.scrolled();
        };

        /**
         * Loads a tablesorter instance with the given settings
         */
        let loadInstanceWithSettings = (settings: ITableSorterSettings) => {
            let { instance, element, mockLineup } = createInstance();
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
                mockLineup,
                instanceInitialized,
                data,
            };
        };

        /**
         * Loads the lineup instance with some data
         */
        let loadInstanceWithData = () => {
            let { stubs, mockLineup, instance, element } = createInstance();
            instance.dimensions = { width: 800, height: 1000 };
            let data = createFakeData();

            // Fake the configuration coming from lineup
            stubs.conversion.convertConfiguration.returns({
                columns: data.columns,
                layout: {
                    primary: [],
                },
            });

            let providerInfo = createProvider(data.data);
            instance.dataProvider = providerInfo.provider;

            return {
                instance,
                element,
                data,
                columns: data.columns,
                stubs,
                mockLineup,
                provider: providerInfo.provider,
                instanceInitialized: providerInfo.instanceInitialized,
            };
        };

        it("should create its element when it is constructed", () => {
            const { element } = createInstance();
            expect(element.find(".lineup-component").length).to.be.equal(1);
        });

        it("should be loading when it is first constructed", () => {
            const { element } = createInstance();
            expect(element.find(".lineup-component.loading").length).to.be.equal(1);
        });

        it("should set the data provider if a provider is passed via the constructor", () => {
            const { provider } = createProvider([]);
            const { instance } = createInstance(provider);
            expect(instance.dataProvider).to.equal(provider);
        });

        it("should define the 'events' property on load", () => {
            const { instance } = createInstance();
            expect(instance.events).to.not.be.undefined;
        });

        describe("dimensions", () => {
            it("should not crash/set the dimensions on lineup if there is no lineup", () => {
                const { instance } = createInstance();
                instance.dimensions = { width: 111, height: 200 };
                expect(instance.dimensions).to.be.deep.equal({
                    width: 111,
                    height: 200,
                });
            });

            it("should set the dimensions on lineup", () => {
                const { instance, mockLineup, ready } = loadInstanceWithProvider();
                return ready.then(() => {
                    return new Promise(resolve => {
                        instance.dimensions = { width: 200, height: 400 };

                        const wrapper = mockLineup.$container.node().find(".lu-wrapper");
                        // This one is different, cause it just fills this container
                        // expect(pxStrToNum(wrapper.css("width"))).to.be.equal(200);
                        expect(pxStrToNum(wrapper.css("height"))).to.be.closeTo(400, 20);

                        // We need to wait for the debounce
                        // TODO: Thing about this more...kinda ghetto
                        setTimeout(function () {
                            expect(mockLineup.updateBody.called).to.be.true;
                            resolve();
                        }, 10);
                    });
                });
            });
        });

        describe("dataProvider", () => {
            it("should set the dataProvider property", () => {
                const { provider } = createProvider([]);
                const { instance } = createInstance();
                instance.dataProvider = provider;
                expect(instance.dataProvider).to.equal(provider);
            });

            it("should attempt to load data when the data provider is set", () => {
                const { provider } = createProvider([]);
                const { instance } = createInstance();
                const canQuery = provider.canQuery = sinon.stub();
                const query = provider.query = sinon.stub();
                const canQueryPromise = Promise.resolve(true);

                // Make sure it returns true
                canQuery.returns(canQueryPromise);

                // Set the provider
                instance.dataProvider = provider;

                return canQueryPromise.then(() => {
                    // expect
                    expect(canQuery.calledOnce).to.be.true;
                    expect(query.calledOnce).to.be.true;
                });
            });

            it("should raise the loadMoreData event when the dataProvider is set", () => {
                const { provider } = createProvider([]);
                const { instance } = createInstance();
                const canQuery = provider.canQuery = sinon.stub();
                const canQueryPromise = Promise.resolve(true);

                let called = false;
                instance.events.on(TableSorter.EVENTS.LOAD_MORE_DATA, () => {
                    called = true;
                });

                // Make sure it returns true
                canQuery.returns(canQueryPromise);

                // Set the provider
                instance.dataProvider = provider;

                return canQueryPromise.then(() => {
                    expect(called).to.be.true;
                });
            });

            it("should attempt to load the data with the correct query options when set", () => {
                const { provider } = createProvider([]);
                const { instance } = createInstance();
                const canQuery = provider.canQuery = sinon.stub();
                const canQueryPromise = Promise.resolve(true);

                // Make sure it returns true
                canQuery.returns(canQueryPromise);

                instance.dataProvider = provider;

                // Make sure the query options are empty, cause there are no filters/sorts
                expect(canQuery.firstCall.args[0]).to.be.deep.equal({});
            });

            it("should attempt to load the data with the correct query options when set and a filter is applied", () => {
                const { data, stringColumns, columns } = createFakeData();
                const providerInfo = loadInstanceWithProvider(data, columns);
                const { ready, provider } = providerInfo;

                // After lineup has been initially loaded
                return ready.then(() => {
                    const query = provider.query = sinon.stub();

                    // Mock canQuery so we can check the query options
                    const canQueryPromise = Promise.resolve(true);
                    const canQuery = sinon.stub().returns(canQueryPromise);
                    provider.canQuery = canQuery;

                    const FAKE_FILTER = {
                        column: stringColumns[0].column,
                        value: "SOME STRING FILTER",
                    };

                    // Simulate lineup filter call
                    simulateLineupFilter(FAKE_FILTER, providerInfo);

                    // Check to see if it is passing the right filter to canQuery
                    const canQueryOptions: IQueryOptions = canQuery.lastCall.args[0];
                    expect(canQueryOptions.query).to.be.deep.equal([FAKE_FILTER]);

                    // Eventually check the query call
                    return canQueryPromise.then(() => {
                        const queryOptions: IQueryOptions = query.lastCall.args[0];
                        expect(queryOptions.query).to.be.deep.equal([FAKE_FILTER]);
                    });
                });
            });

            it("should attempt to load the data with the correct query options when set and a sort is applied", () => {
                const { data, stringColumns, columns } = createFakeData();
                const providerInfo = loadInstanceWithProvider(data, columns);
                const { ready, provider } = providerInfo;

                // After lineup has been initially loaded
                return ready.then(() => {
                    const FAKE_SORT = {
                        column: stringColumns[0].column,
                        asc: false,
                    };
                    const query = provider.query = sinon.stub();

                    // Mock canQuery so we can check the query options
                    const canQueryPromise = Promise.resolve(true);
                    const canQuery = sinon.stub().returns(canQueryPromise);
                    provider.canQuery = canQuery;

                    // Simulate the sort
                    simulateLineupSort(FAKE_SORT, providerInfo);

                    // Check to see if it is passing the right filter to canQuery
                    const canQueryOptions: IQueryOptions = canQuery.lastCall.args[0];
                    expect(canQueryOptions.sort).to.be.deep.equal([FAKE_SORT]);

                    // Eventually check the query call
                    return canQueryPromise.then(() => {
                        const queryOptions: IQueryOptions = query.lastCall.args[0];
                        expect(queryOptions.sort).to.be.deep.equal([FAKE_SORT]);
                    });
                });
            });

            it("should replace data, if the DataProvider indicates that it is should be replaced", () => {
                const { data, columns } = createFakeData();
                const providerInfo = loadInstanceWithProvider(data, columns);
                const { ready, provider, instance } = providerInfo;
                return ready.then(() => {
                    return new Promise(done => {
                        provider.query = (() => {
                            const newFakeData = createFakeData();
                            return new Promise<IQueryResult>(resolve => {
                                resolve({
                                    replace: true,
                                    results: newFakeData.data,
                                });

                                // SetTimeout is necessary because when you resolve, it doesn't immediately call listeners,
                                // it delays first.
                                setTimeout(() => {
                                    expect(instance.data).to.be.deep.equal(newFakeData.data);
                                    done();
                                }, 20);
                            });
                        });

                        let resolved = false;
                        provider.canQuery = (options) => {
                            let promise = Promise.resolve(!resolved);
                            resolved = true;
                            return promise;
                        };

                        instance.dataProvider = provider;
                    });
                });
            });

            it("should append data, if the DataProvider indicates that it should be appended", () => {
                const { data, columns } = createFakeData();
                const providerInfo = loadInstanceWithProvider(data, columns);
                const { ready, provider, instance } = providerInfo;
                return ready.then(() => {
                    return new Promise(done => {
                        provider.query = (() => {
                            const newFakeData = createFakeData();
                            return new Promise<IQueryResult>(resolve => {
                                resolve({
                                    replace: false,
                                    results: newFakeData.data,
                                });

                                // SetTimeout is necessary because when you resolve, it doesn't immediately call listeners,
                                // it delays first.
                                setTimeout(() => {
                                    expect(instance.data).to.be.deep.equal(data.concat(newFakeData.data));
                                    done();
                                }, 20);
                            });
                        });

                        let resolved = false;
                        provider.canQuery = (options) => {
                            let promise = Promise.resolve(!resolved);
                            resolved = true;
                            return promise;
                        };

                        simulateLineupInfiniteLoad(providerInfo);
                    });
                });
            });

            it("should call the dataProvider for a histogram when lineup asks for it", () => {
                const { data, columns } = createFakeData();
                const providerInfo = loadInstanceWithProvider(data, columns);
                const { ready, instance, provider } = providerInfo;
                return ready.then(() => {
                    return new Promise(resolve => {
                        const colToCheck = columns[0];
                        const generateHistogramPromise = Promise.resolve([.5, .7, .8, .9]);
                        provider.generateHistogram = (col, options) => {
                            // Make sure the correct column was passed to it
                            expect(col).to.be.deep.equal(colToCheck);
                            return generateHistogramPromise;
                        };

                        // TODO: Fix this
                        const lineUpConfig = instance["lineUpConfig"] as any;
                        lineUpConfig.histograms.generator({
                            column: {
                                column: colToCheck.column,
                            },
                        }, (values: any[]) => {
                            expect(values).to.be.deep.equal([
                                { x: 0, y: 0.5, dx: 0.25 },
                                { x: 0.25, y: 0.7, dx: 0.25 },
                                { x: 0.5, y: 0.8, dx: 0.25 },
                                { x: 0.75, y: 0.9, dx: 0.25 },
                            ]);
                            resolve();
                        }); // tslint:disable-line
                    });
                });
            });
        });

        describe("data", () => {
            it("should initially be empty", () => {
                const { instance } = createInstance();
                expect(instance.data).to.satisfy(() => typeof instance.data === "undefined" || instance.data.length === 0);
            });
            it("should return the last loaded set of data from the dataProvider", () => {
                const { data, columns } = createFakeData();
                const { instance, ready } = loadInstanceWithProvider(data, columns);
                return ready.then(() => {
                    expect(instance.data).to.be.deep.equal(data);
                });
            });
        });

        describe("settings", () => {
            it("should load some default settings on create", () => {
                let { instance } = createInstance();
                expect(instance.settings).to.not.be.undefined;
            });
            it("should load some merge new settings", () => {
                let { instance } = createInstance();
                let newSettings: ITableSorterSettings = {
                    presentation: {
                        histograms: false,
                    },
                };

                // Set the new settings
                instance.settings = newSettings;

                // Make sure that something that wasn't touched is still there
                expect(instance.settings.presentation.values).to.equal(false);

                // Make sure our new value is still there
                expect(instance.settings.presentation.histograms).to.eq(false);
            });
            it("should pass rendering settings to lineup", () => {
                let { instanceInitialized, mockLineup } = loadInstanceWithSettings({
                    presentation: {
                        histograms: false,
                    },
                });

                return instanceInitialized.then(() => {
                    const histogramsChanges =
                        mockLineup.changeRenderingOption.args.filter(n => n[0] === "histograms");

                    // Make sure the last histogram rendering change is the correct one
                    expect(histogramsChanges[histogramsChanges.length - 1]).to.be.deep.equal(["histograms", false]);
                });
            });
            it("should pass interaction settings to lineup", () => {
                let { instanceInitialized, mockLineup } = loadInstanceWithSettings({
                    presentation: {
                        tooltips: true,
                    },
                });

                return instanceInitialized.then(() => {
                    const tooltipChanges =
                        mockLineup.changeInteractionOption.args.filter(n => n[0] === "tooltips");

                    // Make sure the last histogram rendering change is the correct one
                    expect(tooltipChanges[tooltipChanges.length - 1]).to.be.deep.equal(["tooltips", true]);
                });
            });

            it("multiSelect should be true by default", () => {
                let { instance } = createInstance();
                expect(instance.settings.selection.multiSelect).to.be.false;
            });
            it("singleSelect should be true by default", () => {
                let { instance } = createInstance();
                expect(instance.settings.selection.singleSelect).to.be.true;
            });
        });

        describe("configuration", () => {
            it("should restore filters from a configuration", () => {
                let { instance, data, instanceInitialized, stubs } = loadInstanceWithData();
                const cols = data.stringColumns;

                return instanceInitialized
                    .then(() => {
                        const FAKE_FILTER = {
                            column: cols[0].column,
                            value: "SOME_FAKE_FILTER",
                        };

                        // Set up the fake conversion from lineup
                        stubs.conversion.convertFiltersFromLayout.returns([FAKE_FILTER]);

                        // Set the new config
                        instance.configuration = <any>{
                            columns: data.columns.slice(0),
                            layout: {
                                // Go through all the columns and apply a "filter to them"
                                primary: [{
                                    column: FAKE_FILTER.column,
                                    filter: FAKE_FILTER.value,
                                }],
                            },
                            primaryKey: "primary",
                        };

                        // Make sure the existing query options are updated
                        expect(instance.getQueryOptions().query).to.be.deep.equal([FAKE_FILTER]);
                    });
            });

            it("should restore sorts from a configuration", () => {
                let { instance, data, instanceInitialized, mockLineup } = loadInstanceWithData();
                const cols = data.stringColumns;

                return instanceInitialized
                    .then(() => {
                        const FAKE_SORT = {
                            column: cols[0].column,
                            asc: false,
                        };

                        // Set the new config
                        instance.configuration = {
                            columns: data.columns.slice(0),
                            layout: {
                                // Go through all the columns and apply a "filter to them"
                                primary: [],
                            },
                            sort: {
                                column: FAKE_SORT.column,
                                asc: FAKE_SORT.asc,
                            },
                            primaryKey: "primary",
                        };

                        // Make sure the existing query options are updated
                        expect(instance.getQueryOptions().sort).to.be.deep.equal([FAKE_SORT]);

                        // Make sure it is up to date on lineup
                        expect(mockLineup.sortBy.lastCall.args).to.be.deep.equal([FAKE_SORT.column, FAKE_SORT.asc]);
                    });
            });
        });

        describe("getQueryOptions", () => {
            it("should be empty by default", () => {
                let { instance } = createInstance();
                expect(instance.getQueryOptions()).to.be.deep.equal({});
            });

            // // This is an issue, because if you switch data providers (with a different dataset), then it will try to
            // // reuse the same filters/sorts from the previous dataset, which is incorrect.
            // it("should clear filters if the dataProvider is changed", () => {
            //     let { instance, data, instanceInitialized, stubs } = loadInstanceWithData();
            //     const cols = data.stringColumns;

            //     return instanceInitialized
            //         .then(() => {
            //             const FAKE_FILTER = {
            //                 column: cols[0].column,
            //                 value: "SOME_FAKE_FILTER",
            //             };

            //             // Set up the fake conversion from lineup
            //             stubs.conversion.convertFiltersFromLayout.returns([FAKE_FILTER]);

            //             // Set the new config
            //             instance.configuration = {
            //                 columns: data.columns.slice(0),
            //                 layout: {
            //                     // Go through all the columns and apply a filter to them
            //                     primary: [{
            //                         column: FAKE_FILTER.column,
            //                         filter: FAKE_FILTER.value,
            //                     }],
            //                 },
            //                 primaryKey: "primary",
            //             };

            //             instance.dataProvider = createProvider([]).provider;

            //             // Make sure the existing query options are updated
            //             expect(instance.getQueryOptions().query).to.be.empty;
            //         });
            // });
        });

        describe("rerenderValues", () => {
            it("should not crash if lineup hasn't been loaded yet", () => {
                let { instance } = createInstance();

                // Call the method
                instance.rerenderValues();
            });
            it("should tell lineup to rerender the values in its rows", () => {
                const { mockLineup, ready, instance } = loadInstanceWithProvider();
                return ready.then(() => {
                    instance.settings = {
                        presentation: {
                            values: true,
                        },
                    };

                    // Clear the original calls
                    mockLineup.changeRenderingOption.reset();

                    // Call the method
                    instance.rerenderValues();

                    expect(mockLineup.changeRenderingOption.lastCall.args).to.be.deep.equal(["values", true]);
                });
            });
        });

        describe("eventing", () => {
            it("should raise the 'configurationChanged' event if lineup changes its sort", () => {
                const { data, stringColumns, columns } = createFakeData();
                const providerInfo = loadInstanceWithProvider(data, columns);
                const { ready, instance } = providerInfo;

                // After lineup has been initially loaded
                return ready.then(() => {
                    const FAKE_SORT = {
                        column: stringColumns[0].column,
                        asc: false,
                    };

                    // Setup the event listener for the configuration changed
                    let called = false;
                    instance.events.on(TableSorter.EVENTS.CONFIG_CHANGED, () => {
                        called = true;
                    });

                    simulateLineupSort(FAKE_SORT, providerInfo);

                    expect(called).to.be.true;
                });
            });

            it("should filter the data provider if the filter has changed in lineup", () => {
                const providerInfo = loadInstanceWithData();
                let { stubs, columns, data, instanceInitialized, provider } = providerInfo;
                const col = data.stringColumns[0];
                const colName = col.column;
                const value = data.data[1][colName];

                stubs.conversion.convertConfiguration.returns({
                    columns: columns,
                    layout: {
                        primary: [],
                    },
                });

                let called = false;
                return instanceInitialized
                    .then(() => {
                        provider.filter = (filter) => {
                            called = true;
                            expect(filter.column).to.be.equal(colName);
                            expect(filter.value).to.be.equal(value);
                        };
                    })
                    .then(() => {
                        simulateLineupFilter({
                            column: colName,
                            value: value,
                        }, providerInfo);
                    }) // Basically set the filter to the value in the second row
                    .then(() => {
                        expect(called).to.be.true;
                    });
            });


            it("should sort the data provider if the sort has changed in lineup", () => {
                const providerInfo = loadInstanceWithData();
                const { data, instanceInitialized, provider } = providerInfo;
                const col = data.stringColumns[0];
                const colName = col.column;
                return instanceInitialized
                    .then(() => {
                        return new Promise(resolve => {
                            provider.sort = (sort) => {
                                expect(sort.column).to.be.equal(colName);
                                expect(sort.asc).to.be.true;
                                resolve();
                            };
                            simulateLineupSort({
                                column: colName,
                                asc: true,
                            }, providerInfo);
                        });
                    });
            });

            it("should sort desc the data provider if the sort has changed in lineup to desc", () => {
                const providerInfo = loadInstanceWithData();
                const { data, instanceInitialized, provider } = providerInfo;
                const col = data.stringColumns[0];
                const colName = col.column;
                return instanceInitialized
                    .then(() => {
                        return new Promise(resolve => {
                            provider.sort = (sort) => {
                                expect(sort.column).to.be.equal(colName);
                                expect(sort.asc).to.be.false;
                                resolve();
                            };
                            simulateLineupSort({
                                column: colName,
                                asc: false,
                            }, providerInfo);
                        });
                    });
            });

            it("should raise the sortChanged event when the sort is changed through lineup", () => {
                const providerInfo = loadInstanceWithData();
                const { data, instance, instanceInitialized } = providerInfo;
                const col = data.stringColumns[0];
                const colName = col.column;
                return instanceInitialized
                    .then(() => {
                        return new Promise(resolve => {
                            const FAKE_SORT = {
                                column: colName,
                                asc: false,
                            };
                            instance.events.on(TableSorter.EVENTS.SORT_CHANGED, (changedCol: string, asc: boolean) => {

                                // Make sure table sorter relays this event
                                expect(changedCol).to.be.deep.equal(FAKE_SORT.column);
                                expect(asc).to.be.deep.equal(FAKE_SORT.asc);

                                resolve();
                            });

                            // Simulate the sort
                            simulateLineupSort(FAKE_SORT, providerInfo);
                        });
                    });
            });

            it("should raise the filterChanged event when the filter is changed through lineup", () => {
                const providerInfo = loadInstanceWithData();
                const { data, instance, instanceInitialized } = providerInfo;
                const col = data.stringColumns[0];
                const colName = col.column;
                return instanceInitialized
                    .then(() => {
                        return new Promise(resolve => {
                            const FAKE_FILTER = {
                                column: colName,
                                value: "SOME STRING FILTER",
                            };

                            instance.events.on(TableSorter.EVENTS.FILTER_CHANGED, (filter: ITableSorterFilter) => {
                                // Make sure table sorter relays this event
                                expect(filter).to.be.deep.equal(FAKE_FILTER);
                                resolve();
                            });

                            // Simulate lineup filter call
                            simulateLineupFilter(FAKE_FILTER, providerInfo);
                        });
                    });
            });
        });

        describe("UI", () => {
            it("should clear the selection when the clear selection button is clicked", () => {
                const { mockLineup, element, ready } = loadInstanceWithProvider();
                return ready.then(() => {
                    element.find(".clear-selection").click();
                    expect(mockLineup.clearSelection.calledOnce).to.be.true;
                });
            });
            it("should fire the selectionChanged event when the clear selection button is clicked", () => {
                const { instance, element, ready } = loadInstanceWithProvider();
                return ready.then(() => {
                    return new Promise((resolve, reject) => {
                        // Set up the event listener
                        instance.events.on(TableSorter.EVENTS.CLEAR_SELECTION, () => {
                            resolve();
                        });

                        // Perform the click operation
                        element.find(".clear-selection").click();
                    });
                });
            });
            it("should show the add column dialog when the add column button is clicked on", () => {
                const { mockLineup, element, ready } = loadInstanceWithProvider();
                return ready.then(() => {
                    element.find(".add-column").click();
                    expect(mockLineup.addNewSingleColumnDialog.calledOnce).to.be.true;
                });
            });
            it("should show the add stacked column dialog when the add stacked column button is clicked on", () => {
                const { mockLineup, element, ready } = loadInstanceWithProvider();
                return ready.then(() => {
                    element.find(".add-stacked-column").click();
                    expect(mockLineup.addNewStackedColumnDialog.calledOnce).to.be.true;
                });
            });
        });
    });
});
