import { getHeaderNames, getColumnValues } from "./utils";
import { expect } from "chai";

/**
 * Provides an expectation that the table sorter instance loaded within the given element, has
 * the correct ordering of columns
 * @param parentEle The element containing the table sorter
 * @param expectedCols The columns with the correct order
 */
export function expectHeadersInCorrectOrder(parentEle: JQuery, expectedCols: string[]) {
    "use strict";
    const headers = getHeaderNames(parentEle);
    expect(headers).to.be.deep.equal(expectedCols);
}

/**
 * Provides an expectation that the table sorter instance loaded within the given element, has
 * the correct loading of rows
 * @param columns The columns with the correct order
 * @param parentEle The element containing the table sorter
 * @param rows The expected row data
 */
export function expectRowsMatch(parentEle: JQuery, columns: string[], rows: any[][]) {
    "use strict";

    // Make sure the headers match
    expectHeadersInCorrectOrder(parentEle, columns);

    // get the column values for each of the headers
    const columnValues = getHeaderNames(parentEle).map(n => getColumnValues(parentEle, n));

    // Make sure each of the rows equals what is expected
    // Pivots it from column values into a set of rows
    const rowValues = columnValues[0].map((n, rowNum) => {
        return columnValues.map((m, colNum) => columnValues[colNum][rowNum]);
    });

    // columnValues is now an array of the values in a given column
    expect(columnValues.length).to.be.eq(columns.length);
    expect(rowValues.length).to.be.eq(rows.length);

    rows.forEach((row, rowNum) => {
        row.forEach((val, colNum) => {
            let result = rowValues[rowNum][colNum] as any;

            // If the expected value is a number, then coerce the html text as a number and compare
            if (typeof val === "number") {
                result = parseFloat(result);
            }
            expect(result).to.be.eq(val);
        });
    });
}
