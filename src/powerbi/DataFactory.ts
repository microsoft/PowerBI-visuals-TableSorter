import { ITableSorterVisualRow } from "./interfaces";
import DataView = powerbi.DataView;
import SelectionId = powerbi.visuals.SelectionId;
/* tslint:disable */
const ldget = require("lodash.get");
/* tslint:enable */

export interface ITableData {
    data: ITableSorterVisualRow[];
    cols: string[];
}

/**
 * Creates an item
 */
export function createItem(
    id: string,
    identity: powerbi.visuals.SelectionId,
    filterExpr: powerbi.data.SQExpr): ITableSorterVisualRow {
    "use strict";
    return {
        id,
        identity,
        filterExpr,
        equals: (b: ITableSorterVisualRow) => b.id === id,
        selected: false, // We don't really pay attention to this
    };
}

/**
 * Converts the data from power bi to a data we can use
 */
export function convert(view: DataView): ITableData {
    "use strict";
    let data: ITableSorterVisualRow[] = [];
    let cols: string[];
    if (view && view.table) {
        let table = view.table;
        cols = table.columns.filter(n => !!n).map(n => n.displayName);
        table.rows.forEach((row, rowIndex) => {
            let identity: powerbi.DataViewScopeIdentity;
            let newId: SelectionId;
            if (ldget(view, "categorical.categories.length")) {
                identity = view.categorical.categories[0].identity[rowIndex];
                newId = SelectionId.createWithId(identity);
            } else {
                newId = SelectionId.createNull();
            }

            // The below is busted > 100
            let result: ITableSorterVisualRow =
                createItem(
                    newId.getKey() + rowIndex,
                    newId,
                    identity && identity.expr as powerbi.data.SQExpr);
            row.forEach((colInRow, i) => {
                result[table.columns[i].displayName] = colInRow;
            });
            data.push(result);
        });
    }
    return {
        data,
        cols,
    };
}

export function convertRowSelectionToState(n: ITableSorterVisualRow) {
    "use strict";
    return {
        id: <string>n.id,
        serializedFilter: powerbi.data["services"].SemanticQuerySerializer.serializeExpr(n.filterExpr),
    };
}


export function convertStateRowSelectionToControl(n: {id: string, serializedFilter: any}) {
    "use strict";
    const serializer = powerbi.data["services"].SemanticQuerySerializer;
    const filterExpr = serializer.deserializeExpr(n.serializedFilter) as powerbi.data.SQExpr;
    const identity = powerbi.data.createDataViewScopeIdentity(filterExpr);
    return createItem(n.id, SelectionId.createWithId(identity), filterExpr);
}
