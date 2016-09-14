import { ITableSorterSettings } from "./models";

/**
 * The default numbering format to use when formatting numbers to display in lineup
 */
export const DEFAULT_NUMBER_FORMATTER = d3.format(".3n");

/**
 * Represents the settings
 */
export const DEFAULT_TABLESORTER_SETTINGS: ITableSorterSettings = {
    selection: {
        singleSelect: true,
        multiSelect: false,
    },
    presentation: {
        columnColors: <any>d3.scale.category20(),
        stacked: true,
        values: false,
        histograms: true,
        animation: true,
        tooltips: false,
    },
};
