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
import { VisualBase } from "@essex/pbi-base";
import VisualDataRoleKind = powerbi.VisualDataRoleKind;
import TSSettings from "./settings";
import * as $ from "jquery";
import * as _ from "lodash";

/**
 * The set of capabilities for the table sorter
 */
export default $.extend(true, {}, VisualBase.capabilities, {
    dataRoles: [{
        name: "Values",
        kind: VisualDataRoleKind.GroupingOrMeasure,
        displayName: "Values",
    }, {
        name: "Rank",
        kind: VisualDataRoleKind.GroupingOrMeasure,
        displayName: "Rank",
        description: "Causes TableSorter to create ranking information based on the contents of the column. *Note* This should be a numeric column", //tslint:disable-line
    }],
    dataViewMappings: [{
        conditions: [
            { "Values": { min: 1 }, "Rank": { min: 0, max: 1 } },
            { "Values": { max: 0 }, "Rank": { max: 0 } },
        ],
        table: {
            rows: {
                select: [{for: { in: "Values" }}, { bind: { to: "Rank" }}],
                dataReductionAlgorithm: { window: { count: LOAD_COUNT } },
            },
            rowCount: { preferred: { min: 1 } },
        },
    }],
    objects: _.merge({
        general: {
            displayName: "General",
            properties: {
                filter: {
                    type: { filter: {} },
                    rule: {
                        output: {
                            property: "selected",
                            selector: ["Values"],
                        },
                    },
                },
            },
        },
        layout: {
            properties: {
                layout: {
                    type: { text: {} },
                },
            },
        },
    }, TSSettings.buildCapabilitiesObjects()),
    sorting: {
        custom: {},
    },
});
