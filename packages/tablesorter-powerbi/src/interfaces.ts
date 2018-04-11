
import { ITableSorterRow } from "@essex/tablesorter";

import "powerbi-visuals-tools/templates/visuals/.api/v1.11.0/PowerBI-visuals";
import ISelectionId = powerbi.visuals.ISelectionId;

/**
 * A simple interface to describe the data requirements for the table sorter visual row
 */
export interface ITableSorterVisualRow extends ITableSorterRow {

    /**
     * The unique identity for this row
     */
    identity: ISelectionId;
}

/**
 * A simple interface to describe the ranking info calculated from a dataView
 */
export interface IRankingInfo {
    column: powerbi.DataViewMetadataColumn;
    values: any[];
    colors: {
        [rank: string]: string;
    };
}
