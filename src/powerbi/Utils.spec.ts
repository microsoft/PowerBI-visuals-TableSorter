import { dateTimeFormatCalculator } from "./Utils";
import { expect } from "chai";

describe("Utils", () => {
    describe("dateTimeFormatCalculator", () => {
        const formatTest = (expectedFormat: string, ...dates: Date[]) => {
            const calc = dateTimeFormatCalculator();
            dates.forEach(d => calc.addToCalculation(d));
            expect(calc.getFormat()).to.be.equal(expectedFormat);
        };
        it("should return the full format if a single date", () => {
            formatTest("yyyy-MM-dd hh:mm:ss.fff tt", new Date(2016, 10, 10, 10, 10, 10, 10));
        });
        it("should return yyyy, if only the year is not 0", () => {
            formatTest("yyyy",
                new Date(2016, 0, 1, 0, 0, 0, 0),
                new Date(2017, 0, 1, 0, 0, 0, 0));
        });
        it("should return yyyy-MM, if the year and month is not 0", () => {
            formatTest("yyyy-MM",
                new Date(2016, 1, 1, 0, 0, 0, 0),
                new Date(2017, 1, 1, 0, 0, 0, 0));
        });
        it("should return yyyy-MM-dd, if the year, month, and day is not 0", () => {
            formatTest("yyyy-MM-dd",
                new Date(2016, 1, 2, 0, 0, 0, 0),
                new Date(2017, 1, 2, 0, 0, 0, 0));
        });
        it("should return yyyy-MM-dd, if the year, and day is not 0", () => {
            formatTest("yyyy-MM-dd",
                new Date(2016, 0, 2, 0, 0, 0, 0),
                new Date(2017, 0, 2, 0, 0, 0, 0));
        });
        it("should return yyyy-MM-dd hh tt, if the year, day, and hour is not 0", () => {
            formatTest("yyyy-MM-dd hh tt",
                new Date(2016, 0, 2, 3, 0, 0, 0),
                new Date(2017, 0, 2, 4, 0, 0, 0));
        });
        it("should return yyyy-MM-dd hh:mm:ss tt, if the year, day, and second is not 0", () => {
            formatTest("yyyy-MM-dd hh:mm:ss tt",
                new Date(2016, 0, 2, 0, 0, 2, 0),
                new Date(2017, 0, 2, 0, 0, 2, 0));
        });
        it("should return yyyy-MM-dd hh:mm tt, if the year, day, and minute is not 0", () => {
            formatTest("yyyy-MM-dd hh:mm tt",
                new Date(2016, 0, 2, 0, 2, 0, 0),
                new Date(2017, 0, 2, 0, 3, 0, 0));
        });
        it("should return yyyy-MM-dd hh tt, if the year, and millisecond is not 0", () => {
            formatTest("yyyy-MM-dd hh:mm:ss.fff tt",
                new Date(2016, 0, 1, 0, 0, 0, 10),
                new Date(2017, 0, 1, 0, 0, 0, 20));
        });
        it("should return hh tt, if only the hour is not 0", () => {
            formatTest("hh tt",
                new Date(0, 0, 1, 3, 0, 0, 0),
                new Date(0, 0, 1, 4, 0, 0, 0));
        });
        it("should return hh:mm tt, if only the minute is not 0", () => {
            formatTest("hh:mm tt",
                new Date(0, 0, 1, 1, 2, 0, 0),
                new Date(0, 0, 1, 1, 3, 0, 0));
        });
        it("should return hh:mm:ss tt, if only the second is not 0", () => {
            formatTest("hh:mm:ss tt",
                new Date(0, 0, 1, 1, 0, 10, 0),
                new Date(0, 0, 1, 1, 0, 20, 0));
        });
        it("should return hh:mm:ss.fff tt, if only the millisecond is not 0", () => {
            formatTest("hh:mm:ss.fff tt",
                new Date(0, 0, 1, 1, 0, 0, 12),
                new Date(0, 0, 1, 1, 0, 0, 20));
        });
        it("should return yyyy, if all the same dates", () => {
            formatTest("yyyy",
                new Date(0, 0, 1, 0, 0, 0, 0),
                new Date(0, 0, 1, 0, 0, 0, 0));
        });
    });
});
