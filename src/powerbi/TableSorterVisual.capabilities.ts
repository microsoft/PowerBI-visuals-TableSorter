/*
 * Copyright (C) 2016 Microsoft
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import { LOAD_COUNT } from "./TableSorterVisual.defaults";
import { VisualBase } from "essex.powerbi.base";
import VisualDataRoleKind = powerbi.VisualDataRoleKind;
import StandardObjectProperties = powerbi.visuals.StandardObjectProperties;

export default $.extend(true, {}, VisualBase.capabilities, {
    dataRoles: [{
        name: "Values",
        kind: VisualDataRoleKind.GroupingOrMeasure,
        displayName: "Values",
    }],
    dataViewMappings: [{
        table: {
            rows: {
                for: { in: "Values" },
                dataReductionAlgorithm: { window: { count: LOAD_COUNT } },
            },
            rowCount: { preferred: { min: 1 } },
        },
    }],
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
                    type: { text: {} },
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
        custom: {},
    },
});
