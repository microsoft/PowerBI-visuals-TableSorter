/*
 * Copyright (c) Microsoft
 * All rights reserved.
 * MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { Promise } from "es6-promise";
import { expect } from "chai";
import * as $ from "jquery";

/**
 * Provides some basic table sorter testing utils
 */
function visualOrderSort(a: HTMLElement, b: HTMLElement) {
    "use strict";
    // Sort it by the visual order
    return parseFloat($(a).css("left").replace("px", "")) - parseFloat($(b).css("left").replace("px", ""));
}

export function getHeaders(parentEle: JQuery, excludeRank = false) {
    "use strict";
    let headers = parentEle.find(".header").toArray().sort(visualOrderSort);
    if (excludeRank) {
        headers = headers.filter(n => $(n).find(".headerLabel").text() !== "Rank");
    }
    return headers;
};

// const getHeader = (colName: string) => {
//     return $(getHeaders().filter((ele) => $(ele).is(`:contains('${colName}')`))[0]);
// };

export function getHeaderNames (parentEle: JQuery) {
    "use strict";
    return getHeaders(parentEle, true).map(n => $(n).find(".headerLabel").text());
}

export function getColumnValues(parentEle: JQuery, col: string) {
    "use strict";
    const rowOrderRegex = /translate\s*\((\d+\.*\d*)px\s*,\s*(\d+\.*\d*)px\s*\)/;
    const headerNames = getHeaders(parentEle).map(n => $(n).find(".headerLabel").text());
    const colIdx = headerNames.indexOf(col); // Returns the index that this header is in the list of headers
    // Find all the row values, and make sure they match
    return parentEle.find(".row")
        .toArray()
        .sort((a, b) => {
            // a.style.transform was returning undefined here for some reason, hence getAttribute("style")
            const aYOffset = parseFloat(rowOrderRegex.exec(a.getAttribute("style"))[2]);
            const bYOffset = parseFloat(rowOrderRegex.exec(b.getAttribute("style"))[2]);
            return aYOffset - bYOffset;
        })
        .map((ele, i) => $(ele).find(".text,.valueonly").toArray().sort(visualOrderSort)[colIdx])
        .map((ele, i) => $(ele).text());
}

export function getHeader (parentEle: JQuery, colName: string) {
    "use strict";
    return $(getHeaders(parentEle).filter((ele) => $(ele).is(`:contains('${colName}')`))[0]);
};

export function getFilterEle (parentEle: JQuery, colName: string) {
    "use strict";
    return getHeader(parentEle, colName).find(".singleColumnFilter");
};


export function performClick(e: JQuery) {
    "use strict";
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



/**
 * Performs the sort on the TableSorter UI for the given column
 * @param parentEle The element containing TableSorter
 * @param column The column to be sorted
 * @param numeric If the column is numeric
 * @param asc True if ascending
 */
export function performSort(parentEle: JQuery, column: { column: string; label: string }, numeric: boolean, asc = true) {
    "use strict";
    let headerEle = getHeader(parentEle, column.column);

    // If numeric, it sorts descending by default
    // string, it sorts ascending by default
    performClick(headerEle);
    if ((!asc && !numeric) || (asc && numeric)) {
        performClick(headerEle);
    }
    return new Promise((resolve, reject) => {
        setTimeout(resolve, 20);
    });
}

/**
 * Sets a string filter on the TableSorter UI
 * @param parentEle The element that contains table sorter
 * @param colName The name of the column to set the filter on
 * @param value The filter value to set
 */
export function setStringFilter(parentEle: JQuery, colName: string, value: string) {
    "use strict";
    const filterEle = getFilterEle(parentEle, colName);
    performClick(filterEle); // Normal .click() will not work with d3
    return new Promise((resolve, reject) => {
        const popup = parentEle.find(".lu-popup2");
        const inputEle = popup.find("input");
        inputEle.val(value);
        popup.find(".ok").click();
        setTimeout(resolve, 10);
    });
};

/**
 * Sets a numerical filter on the TableSorter UI
 * @param parentEle The element that contains table sorter
 * @param colName The name of the column to set the filter on
 * @param value The filter value to set
 */
export function setNumericalFilter (parentEle: JQuery, colName: string, value: number) {
    "use strict";
    const filterEle = getFilterEle(parentEle, colName);
    performClick(filterEle); // Normal .click() will not work with d3
    return new Promise((resolve, reject) => {
        const popup = parentEle.find(".lu-popup2");
        const inputEle = popup.find("input");
        inputEle.val(value);
        popup.find(".ok").click();
        setTimeout(resolve, 10);
    });
};
