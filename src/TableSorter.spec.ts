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
// import "../base/testSetup";
/* tslint:enable */
import { expect } from "chai";

import {
    ITableSorterSettings,
    ITableSorterRow,
    IDataProvider,
    ITableSorterSort,
    ITableSorterFilter,
    ITableSorterConfiguration,
    IQueryResult,
    IQueryOptions,
} from "./models";
import * as sinon from "sinon";
import * as $ from "jquery";
import { Promise } from "es6-promise";
import { TableSorter } from "./TableSorter";
const tableSorterMock = require("inject!./TableSorter"); // tslint:disable-line
import { convertSort } from "./conversion";
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
                    create: function() {
                        return mockLineup;
                    },
                    createLocalStorage: function() {
                        return storage;
                    },
                }, // tslint:disable-line
            }).TableSorter;
            parentEle.append(element);
            let result = {
                instance: (new ctor(element, dataProvider)) as TableSorter,
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
                        }, 50);
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
                        setTimeout(function() {
                            expect(mockLineup.updateBody.called).to.be.true;
                            resolve();
                        }, 150);
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
                                { x: 0.25 , y: 0.7, dx: 0.25  },
                                { x: 0.5, y: 0.8, dx: 0.25  },
                                { x: 0.75, y: 0.9, dx: 0.25  },
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
                        instance.configuration = {
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

            // This is an issue, because if you switch data providers (with a different dataset), then it will try to
            // reuse the same filters/sorts from the previous dataset, which is incorrect.
            it("should clear filters if the dataProvider is changed", () => {
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
                        instance.configuration = {
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

                        instance.dataProvider = createProvider([]).provider;

                        // Make sure the existing query options are updated
                        expect(instance.getQueryOptions().query).to.be.empty;
                    });
            });
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
    describe("e2e", () => {


        const getHeaders = () => {
            return parentEle.find(".header").toArray().reverse();
        };

        const getHeader = (colName: string) => {
            return $(getHeaders().filter((ele) => $(ele).is(`:contains('${colName}')`))[0]);
        };

        const getHeaderNames = () => {
            return getHeaders().map(n => $(n).find(".headerLabel").text()).filter(n => n !== "Rank");
        };

        const getFilterEle = (colName: string) => {
            return getHeader(colName).find(".singleColumnFilter");
        };

        const getColumnValues = (col: string) => {
            const headerNames = getHeaders().map(n => $(n).find(".headerLabel").text());
            const colIdx = headerNames.indexOf(col); // Returns the index that this header is in the list of headers
            // Find all the row values, and make sure they match
            return parentEle.find(".row")
                .map((i, ele) => $(ele).find(".text,.valueonly")[colIdx])
                .map((i, ele) => $(ele).text()).toArray();
        };


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

                        // Ghetto hax, 50 because it tries to checkLoadMoreData after 10 seconds.
                        setTimeout(function () {
                            resolver();
                        }, 50);
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

        const performClick = (e: JQuery) => {
            if (e.length === 0) {
                expect.fail(1, 0, "No elements found to click");
            }
            if (typeof MouseEvent !== "undefined") {
                /* tslint:disable */
                var ev = new Event("click", { "bubbles": true, "cancelable": false });
                e[0].dispatchEvent(ev);
                /* tslint:enable */
            } else {
                e.click();
            }
        };

        const setStringFilter = (colName: string, value: string) => {
            const filterEle = getFilterEle(colName);
            instances[0].dataProvider["shouldResolve"] = true;
            performClick(filterEle); // Normal .click() will not work with d3
            return new Promise((resolve, reject) => {
                const popup = parentEle.find(".lu-popup2");
                const inputEle = popup.find("input");
                inputEle.val(value);
                popup.find(".ok").click();
                setTimeout(resolve, 100);
            });
        };

        const setNumericalFilter = (colName: string, value: any) => {
            const filterEle = getFilterEle(colName);
            performClick(filterEle); // Normal .click() will not work with d3
            return new Promise((resolve, reject) => {
                const popup = parentEle.find(".lu-popup2");
                const inputEle = popup.find("input");
                inputEle.val(value);
                popup.find(".ok").click();
                setTimeout(resolve, 100);
            });
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
         * sorts the given column
         */
        function sortColumn(column: { column: string; label: string }, asc = true) {
            let headerEle = getHeader(column.column);
            performClick(headerEle);
            if (!asc) {
                performClick(headerEle);
            }
        }

        /**
         * Creates an instance with a filter on it
         */
        function loadInstanceWithFilter() {
            let { data, instanceInitialized, provider, element, instance } = loadInstanceWithData();
            const col = data.stringColumns[0];
            const filterColName = col.column;
            const filterVal = data.data[1][filterColName];
            instanceInitialized = instanceInitialized
                .then(() => setStringFilter(filterColName, filterVal)); // Basically set the filter to the value in the second row
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
                        instance["lineupImpl"].clearSelection = <any>function() {
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
                            provider.sort = (sort) => {
                                expect(sort.column).to.be.equal(colName);
                                expect(sort.asc).to.be.true;
                                resolve();
                            };
                            sortColumn(col);
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
                                if (count === 2) { // sortColumn does it twice, so check the second one
                                    expect(sort.column).to.be.equal(colName);
                                    expect(sort.asc).to.be.false;
                                    resolve();
                                }
                            };
                            sortColumn(col, false);
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
                    .then(() => setStringFilter(colName, value)) // Basically set the filter to the value in the second row
                    .then(() => getColumnValues(colName))
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
                    .then(() => setNumericalFilter(colName, value)) // Basically set the filter to the value in the second row
                    .then(() => getColumnValues(colName))
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
                            }, 1000);
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
                    let { instance } = loadInstanceWithConfiguration({
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
                        .then(() => setStringFilter(filterColName, filterVal))
                        .then(() => getColumnValues(filterColName))
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
                        const headers = getHeaderNames();
                        expect(headers).to.be.deep.equal(cols.map(n => n.label));
                    });
                });
            });
        });
    });
});
