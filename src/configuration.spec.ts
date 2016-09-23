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

import { hasLayoutChanged, hasConfigurationChanged } from "./configuration";
import { ITableSorterConfiguration } from "./models";
import { expect } from "chai";

describe("configuration", () => {
    const CONFIG_WITH_LAYOUT_COLUMN_NAME = "HELLO";
    const CONFIG_WITH_LAYOUT_FILTER_TEXT = "FILTER_TEXT";
    const CONFIG_WITH_LAYOUT = () => (<ITableSorterConfiguration><any>{
        layout: {
            primary: [{
                column: CONFIG_WITH_LAYOUT_COLUMN_NAME,
            }],
        },
    });
    const CONFIG_WITH_LAYOUT_AND_FILTER = () => (<ITableSorterConfiguration><any>{
        layout: {
            primary: [{
                column: CONFIG_WITH_LAYOUT_COLUMN_NAME,
                filter: CONFIG_WITH_LAYOUT_FILTER_TEXT,
            }],
        },
    });
    describe("hasLayoutChanged", () => {
        it("should return false if only the rank column has changed", () => {
            const rankConfig = CONFIG_WITH_LAYOUT();
            // Add a rank column, otherwise identical
            rankConfig.layout.primary.push({
                type: "rank",
            });
            const result = hasLayoutChanged(rankConfig, CONFIG_WITH_LAYOUT());
            expect(result).to.be.false;
        });
        it("should return true if the old layout is undefined", () => {
            const result = hasLayoutChanged(undefined, CONFIG_WITH_LAYOUT());
            expect(result).to.be.true;
        });
        it("should return true if the new layout is undefined", () => {
            const result = hasLayoutChanged(CONFIG_WITH_LAYOUT(), undefined);
            expect(result).to.be.true;
        });
        it("should return false if both are undefined", () => {
            const result = hasLayoutChanged(undefined, undefined);
            expect(result).to.be.false;
        });
        it("should return true if the filters have changed", () => {
            const result = hasLayoutChanged(CONFIG_WITH_LAYOUT(), CONFIG_WITH_LAYOUT_AND_FILTER());
            expect(result).to.be.true;
        });
        it("should return false if nothing has changed", () => {
            const result = hasLayoutChanged(CONFIG_WITH_LAYOUT(), CONFIG_WITH_LAYOUT());
            expect(result).to.be.false;
        });
    });
    describe("hasConfigurationChanged", () => {
        it("should return true if the old configuration is undefined", () => {
            const result = hasConfigurationChanged(undefined, CONFIG_WITH_LAYOUT());
            expect(result).to.be.true;
        });
        it("should return true if the new configuration is undefined", () => {
            const result = hasConfigurationChanged(CONFIG_WITH_LAYOUT(), undefined);
            expect(result).to.be.true;
        });
        it("should return false if both are undefined", () => {
            const result = hasConfigurationChanged(undefined, undefined);
            expect(result).to.be.false;
        });
        it("should return true if the filters have changed within the layout", () => {
            const result = hasConfigurationChanged(CONFIG_WITH_LAYOUT(), CONFIG_WITH_LAYOUT_AND_FILTER());
            expect(result).to.be.true;
        });
        it("should return false if nothing has changed within the layout", () => {
            const result = hasConfigurationChanged(CONFIG_WITH_LAYOUT(), CONFIG_WITH_LAYOUT());
            expect(result).to.be.false;
        });
    });
});
