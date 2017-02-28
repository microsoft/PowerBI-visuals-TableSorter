require("@essex/pbi-base/dist/spec/visualHelpers"); // tslint:disable-line
import * as $ from "jquery";
$.extend(true, global["powerbi"], {
    visuals: {
        StandardObjectProperties: {
            labelDisplayUnits: {
                type: {},
            },
            labelPrecision: {
                type: {},
            },
        },
        SelectionId: {
            createNull: () => ({}),
        },
        valueFormatter: {
            create: () => ({
                format: (n: any) => typeof n === "number" ? n.toFixed(3) : n,
            }),
        },
    },
});
