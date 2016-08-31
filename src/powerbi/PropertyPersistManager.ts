import { logger } from "essex.powerbi.base";
/* tslint:disable */
const log = logger("essex:widget:TableSorterVisual:PropertyPesistManager");
/* tslint:enable */
import { PropertyPersister } from "essex.powerbi.base/src/lib/Utils";
import VisualObjectInstance = powerbi.VisualObjectInstance;
import SQExprBuilder = powerbi.data.SQExprBuilder;
import SelectionManager = powerbi.visuals.utility.SelectionManager;
import { ITableSorterVisualRow } from "./interfaces";
import {
    ITableSorterFilter,
    INumericalFilter,
    ITableSorterConfiguration,
} from "../models";

export default class PropertyPersistManager {
    private propertyPersister: PropertyPersister;
    private selectionManager: SelectionManager;

    constructor(propertyPersister: PropertyPersister, selectionManager: SelectionManager) {
        this.propertyPersister = propertyPersister;
        this.selectionManager = selectionManager;
    }


    /**
     * A simple debounced function to update the configuration
     */
    public updateConfiguration(config: ITableSorterConfiguration) {
        const configJson = JSON.stringify(config);
        if (configJson === "{}") {
            log("Rejecting UpdateConfiguration", config);
            return;
        }
        const objects: powerbi.VisualObjectInstancesToPersist = {
            merge: [
                <VisualObjectInstance>{
                    objectName: "layout",
                    properties: {
                        "layout": configJson,
                    },
                    selector: undefined,
                },
            ],
        };
        // TODO: Debounce
        this.propertyPersister.persist(false, objects);
    }

    public updateSelection(rows?: ITableSorterVisualRow[], multiSelect?: boolean) {
        let filter: powerbi.data.SemanticFilter;
        if (rows && rows.length) {
            let expr = rows[0].filterExpr;

            // If we are allowing multiSelect
            if (rows.length > 0 && multiSelect) {
                rows.slice(1).forEach((r) => {
                    expr = powerbi.data.SQExprBuilder.or(expr, r.filterExpr);
                });
            }
            filter = powerbi.data.SemanticFilter.fromSQExpr(expr);
        }

        // rows are what are currently selected in lineup
        if (rows && rows.length) {
            // HACK
            this.selectionManager.clear();
            rows.forEach((r) => this.selectionManager.select(r.identity, true));
        } else {
            this.selectionManager.clear();
        }

        const operation = filter ? "merge" : "remove";
        const objects = {
            [operation]: [
                <powerbi.VisualObjectInstance>{
                    objectName: "general",
                    selector: undefined,
                    properties: { filter },
                },
            ],
        };
        this.propertyPersister.persist(true, objects);
    }

    /**
     * Builds a self filter for PBI from the list of filters
     */
    public updateSelfFilter(filters: ITableSorterFilter[], columns: powerbi.DataViewMetadataColumn[]) {
        let operation = "remove";
        let filter: powerbi.data.SemanticFilter;
        if (filters && filters.length) {
            operation = "replace";
            let finalExpr: powerbi.data.SQExpr;
            filters.forEach(m => {
                const col = columns.filter(n => n.displayName === m.column)[0];
                const colExpr = <powerbi.data.SQExpr>col.expr;
                let currExpr: powerbi.data.SQExpr;
                if (typeof m.value === "string") {
                    currExpr = SQExprBuilder.contains(colExpr, SQExprBuilder.text(<string>m.value));
                } else if ((<INumericalFilter>m.value).domain) {
                    const numFilter = m.value as INumericalFilter;
                    currExpr = powerbi.data.SQExprBuilder.between(
                        colExpr,
                        powerbi.data.SQExprBuilder.decimal(numFilter.domain[0]),
                        powerbi.data.SQExprBuilder.decimal(numFilter.domain[1])
                    );
                }
                finalExpr = finalExpr ? powerbi.data.SQExprBuilder.and(finalExpr, currExpr) : currExpr;
            });
            filter = powerbi.data.SemanticFilter.fromSQExpr(finalExpr);
        }
        const objects = {
            [operation]: [
                <powerbi.VisualObjectInstance>{
                    objectName: "general",
                    selector: undefined,
                    properties: {
                        "selfFilter": filter
                    },
                },
            ],
        };
        this.propertyPersister.persist(false, objects);
    }
}
