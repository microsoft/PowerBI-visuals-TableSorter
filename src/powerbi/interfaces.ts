import {
    ITableSorterRow,
    ITableSorterSettings,
} from "../models";


/**
 * The state of the table sorter
 */
export interface ITableSorterState {
    settings: ITableSorterSettings;
    configuration: any;
    selection?: {
        id: string,
        serializedFilter: Object,
    }[];
    scrollPosition: [number, number];
}

/**
 * The lineup data
 */
export interface ITableSorterVisualRow extends ITableSorterRow, powerbi.visuals.SelectableDataPoint {
    /**
     * The expression that will exactly match this row
     */
    filterExpr: powerbi.data.SQExpr;
}
