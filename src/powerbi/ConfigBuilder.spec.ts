import { syncLayoutColumns, calcDomain } from "./ConfigBuilder";
import { expect } from "chai";
import {  ITableSorterLayoutColumn } from "../models";
describe("ConfigBuilder", () => {
    describe("syncLayoutColumns", () => {

        const SIMPLE_COLUMNS = () => ([{
            column: "SOME_COLUMN",
            type: "string",
        }, ]);

        const SIMPLE_LAYOUT_COLUMNS = () => ([{
            column: "SOME_COLUMN",
            type: "string",
        }, ] as ITableSorterLayoutColumn[]);

        const SIMPLE_NUMERICAL_COLUMNS = () => ([{
            column: "SOME_COLUMN",
            type: "number",
            domain: [2, 5] as [number, number],
        }, ]);

        const SIMPLE_NUMERICAL_LAYOUT_COLUMNS = () => ([{
            column: "SOME_COLUMN",
            type: "number",
            domain: [2, 5] as [number, number],
        }, ] as ITableSorterLayoutColumn[]);

        const SIMPLE_NUMERICAL_2_LAYOUT_COLUMNS = () => ([{
            column: "SOME_COLUMN",
            type: "number",
            domain: [1, 3] as [number, number],
        }, ] as ITableSorterLayoutColumn[]);

        const SIMPLE_2_COLUMNS = () => ([{
            column: "DIFFERENT_COLUMN",
            type: "string",
        }, ]);

        const SIMPLE_2_STACKED_COLUMNS = () => ([{
            column: "STACK",
            type: "string",
            children: [{
                column: "SOME_COLUMN_2",
                type: "string",
            }, ],
        }, ] as ITableSorterLayoutColumn[]);

        const SIMPLE_STACKED_MULTIPLE_COLUMNS = () => ([{
            column: "STACK",
            type: "string",
            children: [{
                column: "SOME_COLUMN",
                type: "string",
            }, {
                column: "SOME_COLUMN_2",
                type: "string",
            }, ],
        }, ] as ITableSorterLayoutColumn[]);

        it("should remove missing columns", () => {
            // We switched from "SIMPLE_COLUMNS" to "SIMPLE_2_COLUMNS", with no common columns, so the layout is scrubbed
            const result = syncLayoutColumns(SIMPLE_LAYOUT_COLUMNS(), SIMPLE_2_COLUMNS(), SIMPLE_COLUMNS());
            expect(result).to.be.deep.equal([]);
        });

        it("should NOT remove columns that still exist", () => {

            // No columns have changed, so it shouldn't change anything
            const result = syncLayoutColumns(SIMPLE_LAYOUT_COLUMNS(), SIMPLE_COLUMNS(), SIMPLE_COLUMNS());

            expect(result.map((n: any) => n.column)).to.be.deep.equal(SIMPLE_COLUMNS().map((n: any) => n.column));
        });

        it("should update the domains (filters) of the layout to be equal to the columns new domain, when not filtered", () => {
            // Sync the new layout columns
            // We indicate that is was not filtered, by the CONFIG_WITH_UNFILTERED_NUMERICAL_COLUMNS
            const result = syncLayoutColumns(SIMPLE_NUMERICAL_LAYOUT_COLUMNS(), SIMPLE_NUMERICAL_COLUMNS(), SIMPLE_NUMERICAL_COLUMNS());

            expect(result[0].domain).to.be.deep.equal(SIMPLE_NUMERICAL_COLUMNS()[0].domain);
        });

        it("should update the domains (filters) of the layout to be bound to the columns new domain, when filtered", () => {
            // It should bound correctly
            const result = syncLayoutColumns(SIMPLE_NUMERICAL_2_LAYOUT_COLUMNS(), SIMPLE_NUMERICAL_COLUMNS(), SIMPLE_NUMERICAL_COLUMNS());

            // [2, 3] is not magical, it is the bounded domain of SIMPLE_NUMERICAL_COLUMNS and SIMPLE_NUMERICAL_2_LAYOUT_COLUMNS
            expect(result[0].domain).to.be.deep.equal([2, 3]);
        });

        it("should scrub a stacked column if all the child columns are missing", () => {
            // It should bound correctly
            const result = syncLayoutColumns(SIMPLE_2_STACKED_COLUMNS(), SIMPLE_COLUMNS(), SIMPLE_COLUMNS());
            expect(result).to.be.deep.equal([]);
        });

        it("should remove child columns from a stacked column if a child column is missing", () => {
            // It should bound correctly
            const result = syncLayoutColumns(SIMPLE_STACKED_MULTIPLE_COLUMNS(), SIMPLE_COLUMNS(), SIMPLE_COLUMNS());
            expect(result[0].children).to.be.deep.equal(SIMPLE_COLUMNS());
        });
    });

    describe("calcDomain", () => {
        it ("should not include 'null' in the min max calculation", () => {
            const result = calcDomain([{ a: 10 }, { a: null }, { a: 100 }], "a"); // tslint:disable-line
            expect(result).to.be.deep.equal([10, 100]);
        });
        it ("should not include 'undefined' in the min max calculation", () => {
            const result = calcDomain([{ a: 10 }, { a: undefined }, { a: 100 }], "a"); // tslint:disable-line
            expect(result).to.be.deep.equal([10, 100]);
        });
        it ("should work with negative numbers", () => {
            const result = calcDomain([{ a: -10 }, { a: undefined }, { a: 100 }], "a"); // tslint:disable-line
            expect(result).to.be.deep.equal([-10, 100]);
        });
        it ("should work with fractions", () => {
            const result = calcDomain([{ a: .01 }, { a: undefined }, { a: .102 }], "a"); // tslint:disable-line
            expect(result).to.be.deep.equal([.01, .102]);
        });
        it ("should work out of order values", () => {
            const result = calcDomain([{ a: 100 }, { a: undefined }, { a: 10 }], "a"); // tslint:disable-line
            expect(result).to.be.deep.equal([10, 100]);
        });
    });
});
