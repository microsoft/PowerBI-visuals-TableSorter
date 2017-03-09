import { LOAD_COUNT } from "./TableSorterVisual.defaults";
import { VisualBase } from "@essex/pbi-base";
import VisualDataRoleKind = powerbi.VisualDataRoleKind;
import StandardObjectProperties = powerbi.visuals.StandardObjectProperties;

export default $.extend(true, {}, VisualBase.capabilities, {
    dataRoles: [{
        name: "Values",
        kind: VisualDataRoleKind.GroupingOrMeasure,
        displayName: "Values",
    }, ],
    dataViewMappings: [{
        table: {
            rows: {
                for: { in: "Values" },
                dataReductionAlgorithm: { window: { count: LOAD_COUNT } },
            },
            rowCount: { preferred: { min: 1 } },
        },
    }, ],
    objects: {
        general: {
            displayName: "General",
            properties: {
                // formatString: {
                //     type: {
                //         formatting: {
                //             formatString: true
                //         }
                //     },
                // },
                // selected: {
                //     type: { bool: true }
                // },
                filter: {
                    type: { filter: {} },
                    rule: {
                        output: {
                            property: "selected",
                            selector: ["Values"],
                        },
                    },
                },
                // selfFilter: {
                //     type: { filter: { selfFilter: true } }
                // },
            },
        },
        layout: {
            properties: {
                // formatString: {
                //     type: {
                //         formatting: {
                //             formatString: true
                //         }
                //     },
                // },
                // selected: {
                //     type: { bool: true }
                // },
                layout: {
                    type: { text: {} }
                },
            },
        },
        selection: {
            displayName: "Selection",
            properties: {
                multiSelect: {
                    displayName: "Multi Select",
                    description: "If true, multiple rows can be selected",
                    type: { bool: true },
                },
            },
        },
        presentation: {
            displayName: "Presentation",
            properties: {
                stacked: {
                    displayName: "Stacked",
                    description: "If true, when columns are combined, the all columns will be displayed stacked",
                    type: { bool: true },
                },
                values: {
                    displayName: "Values",
                    description: "If the actual values should be displayed under the bars",
                    type: { bool: true },
                },
                histograms: {
                    displayName: "Histograms",
                    description: "Show histograms in the column headers",
                    type: { bool: true },
                },
                animation: {
                    displayName: "Animation",
                    description: "Should the grid be animated when sorting",
                    type: { bool: true },
                },
                tooltips: {
                    displayName: "Table tooltips",
                    description: "Should the grid show tooltips on hover of a row",
                    type: { bool: true },
                },
                labelDisplayUnits: StandardObjectProperties.labelDisplayUnits,
                labelPrecision: StandardObjectProperties.labelPrecision,
            },
        },
    },
    sorting: {
        custom: {}
    },
});
