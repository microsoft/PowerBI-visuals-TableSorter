import { IColorSettings } from "@essex/visual-utils";
import { ITableSorterVisualRow, IRankingInfo } from "./interfaces";
import { calculateRankingInfo, calculateRankColors } from "./ConfigBuilder";
import { dateTimeFormatCalculator } from "./Utils";
import { formatting } from "../powerbi-visuals-utils";

import "powerbi-visuals-tools/templates/visuals/.api/v1.11.0/PowerBI-visuals";
import ISelectionIdBuilder = powerbi.visuals.ISelectionIdBuilder;
import ISelectionId = powerbi.visuals.ISelectionId;
import DataView = powerbi.DataView;

const find = require("lodash/collection/find"); // tslint:disable-line

/**
 * Converts the data from power bi to a data we can use
 * @param view The dataview to load
 * @param selectedIds The list of selected ids
 * @param settings The color settings to use when converting the dataView
 */
export default function converter(view: DataView, selectedIds: any, settings?: IColorSettings, createSelectionIdBuilder?: () => ISelectionIdBuilder) {
    const data: ITableSorterVisualRow[] = [];
    let cols: string[];
    let rankingInfo: IRankingInfo;
    if (view && view.table) {
        const table = view.table;
        const baseRi = calculateRankingInfo(view);
        if (baseRi) {
            rankingInfo = <any>baseRi;
            rankingInfo.colors = calculateRankColors(baseRi.values, settings);
        }
        const dateCols = table.columns.map((n, i) => ({ idx: i, col: n })).filter(n => n.col.type.dateTime).map(n => {
            return {
                idx: n.idx,
                col: n.col,
                calculator: dateTimeFormatCalculator(),
            };
        });
        cols = table.columns.filter(n => !!n)/*.filter(n => !n.roles["Confidence"])*/.map(n => n.displayName);
        table.rows.forEach((row, rowIndex) => {
            let identity: ISelectionId;
            const builder = createSelectionIdBuilder && createSelectionIdBuilder();
            if (builder) {
                const categoryColumn = {
                    source: table.columns[0],
                    values: <any>null,
                    identity: [table.identity[rowIndex]],
                };
                identity =
                    builder
                        .withCategory(<any>categoryColumn, 0)
                        .createSelectionId();
            } else {
                identity = <any>{
                    getKey: () => `TableSorter_${rowIndex}`,
                };
            }

            // The below is busted > 100
            // let identity = SelectionId.createWithId(this.dataViewTable.identity[rowIndex]);
            const result: ITableSorterVisualRow = {
                id: identity.getKey(),
                identity,
                equals: (b) => (<ITableSorterVisualRow>b).identity.equals(identity),
                selected: !!find(selectedIds, (id: ISelectionId) => id.equals(identity)),
            };

            // Copy over column data
            row.forEach((colInRow, i) => result[table.columns[i].displayName] = colInRow);

            dateCols.forEach(c => {
                c.calculator.addToCalculation(result[c.col.displayName]);
            });

            data.push(result);
        });

        dateCols.forEach(n => {
            const formatter = formatting.valueFormatter.create({
                format: n.col.format || n.calculator.getFormat(),
            });
            data.forEach(result => {
                result[n.col.displayName] = formatter.format(result[n.col.displayName]);
            });
        });
    }
    return {
        data,
        cols,
        rankingInfo,
    };
}
