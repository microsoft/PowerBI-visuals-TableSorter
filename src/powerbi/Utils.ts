/**
 * Creates a calculator that calculates an appropriate date string format to represent the data
 */
export function dateTimeFormatCalculator() {
    "use strict";
    let prevDate: Date;
    let hasDates = false;
    let showYear = false;
    let showMonth = false;
    let showDay = false;
    let showHours = false;
    let showMinutes = false;
    let showSeconds = false;
    let showMilliseconds = false;
    return {
        /**
         * Adds the given date instance to the calculation
         */
        addToCalculation(date: Date) {
            if (prevDate && date) {

                hasDates = true;
                const fullYear = date.getFullYear();
                if (fullYear && fullYear !== prevDate.getFullYear()) {
                    showYear = true;
                }

                if (date.getMilliseconds()) {
                    showMilliseconds = true;
                }

                if (date.getSeconds()) {
                    showSeconds = true;
                }

                if (date.getMinutes()) {
                    showMinutes = true;
                }

                if (date.getHours()) {
                    showHours = true;
                }

                if (date.getDate() - 1) {
                    showDay = true;
                }

                if (date.getMonth()) {
                    showMonth = true;
                }
            }
            prevDate = date;
        },
        getFormat(): string {
            // const DEFAULT_DATE_FORMAT = "yyyy-MM-dd hh:mm:ss.fff tt";
            const showAll = !hasDates;
            const showAnyTime = showHours || showMinutes || showSeconds || showMilliseconds || showAll;
            const showAnyDate = showDay || showMonth || showYear || showAll;
            let format = "";
            if (showAnyDate || showAll || (showAnyTime && showAnyDate)) {
                format += "yyyy";
            }
            if (showDay || showMonth || showAll || (showAnyTime && showAnyDate)) {
                format += "-MM";
            }
            if (showDay || showAll || (showAnyTime && showAnyDate)) {
                format += "-dd";
            }

            if (showAnyTime) {
                format += (showAnyDate ? " " : "") + "hh";
            }
            if (showMinutes || showSeconds || showMilliseconds || showAll) {
                format += ":mm";
            }
            if (showSeconds || showMilliseconds || showAll) {
                format += ":ss";
            }

            if (showMilliseconds || showAll) {
                format += ".fff";
            }

            if (showAnyTime || showAll) {
                format += " tt";
            }

            if (!format) {
                format = "yyyy";
            }

            return format;
        },
    };
}
