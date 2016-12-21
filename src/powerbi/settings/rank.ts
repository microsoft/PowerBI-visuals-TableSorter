/*
 * MIT License
 *
 * Copyright (c) 2016 Microsoft
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import {
     settings,
     colorSetting as color,
     numberSetting as num,
     boolSetting as bool,
     get,
     enumSetting,
     composeInstance,
     getObjectsForColumn,
     createObjectSelectorForColumn,
     IGradient,
} from "@essex/pbi-base";
import { IColorSettings, ColorMode } from "../../models";
import { calculateRankingInfo } from "../ConfigBuilder";

/**
 * Creates a unique id for the given column and rank
 */
function getRankObjectId(column: powerbi.DataViewMetadataColumn, rank: any) {
    "use strict";
    return "RANK_" + rank;
}

/**
 * Determines if the given dataview has rank information
 */
export function hasRankInfo(dataView: powerbi.DataView) {
    "use strict";

    // The dataView has "rank" information, if the user passed in a field as a "Rank" field
    const cols = get(dataView, v => v.metadata.columns, []);
    return cols.filter(n => n.roles["Rank"]).length > 0;
}

/**
 * Represents a set of gradient settings
 */
export class GradientSettings implements IGradient {

    /**
     * If the gradient color scheme should be used when coloring the values in the slicer
     */
    @color({
        displayName: "Start color",
        description: "The start color of the gradient",
        defaultValue: "#bac2ff",
    })
    public startColor?: string;

    /**
     * If the gradient color scheme should be used when coloring the values in the slicer
     */
    @color({
        displayName: "End color",
        description: "The end color of the gradient",
        defaultValue: "#0229bf",
    })
    public endColor?: string;

    /**
     * The value to use as the start color
     */
    @num({
        displayName: "Start Value",
        description: "The value to use as the start color",
    })
    public startValue?: number;

    /**
     * The value to use as the end color
     */
    @num({
        displayName: "End Value",
        description: "The value to use as the end color",
    })
    public endValue?: number;
}

/**
 * Settings related to ranking
 */
export default class RankSettings implements IColorSettings {

    /**
     * Represents the color mode to use
     */
    @enumSetting(ColorMode, {
        displayName: "Color Mode",
        defaultValue: ColorMode.Gradient,
    })
    public colorMode: ColorMode;

    /**
     * If true, the bar ordering for the ranks will be reversed
     */
    @bool({
        displayName: "Reverse Columns",
        description: "If enabled, the order of the generated rank columns will be reversed",
        defaultValue: false,
    })
    public reverseBars: boolean;

    /**
     * If true, a histogram will be shown across the bars indicating
     */
    @bool({
        displayName: "Histogram",
        description: "If true, a histogram will be shown across the rank columns",
        defaultValue: false,
    })
    public histogram: boolean;

    /**
     * The gradient settings
     */
    @settings<RankSettings>(GradientSettings, {
        enumerable: s => s.colorMode === ColorMode.Gradient,
    })
    public rankGradients: GradientSettings;

    /**
     * Provides a mapping from ranks to colors
     */
    @color<RankSettings>({
        displayName: "Ranks",
        enumerable: s => s.colorMode === ColorMode.Instance,
        parse(value, descriptor, dataView, setting) {
            const ci = calculateRankingInfo(dataView);
            if (ci) {
                return ci.values.reduce((confidenceMap, n) => {
                    const objId = getRankObjectId(ci.column, n);
                    const pbiValue = getObjectsForColumn(ci.column, setting, objId);
                    confidenceMap[n] = get(pbiValue, v => v.solid.color, "#cccccc");
                    return confidenceMap;
                }, {});
            }
        },
        compose(value, descriptor, dataView, setting) {
            const ci = calculateRankingInfo(dataView);
            if (ci) {
                return ci.values.map(n => {
                    const objId = getRankObjectId(ci.column, n);
                    const selector = createObjectSelectorForColumn(ci.column, objId);
                    return composeInstance(setting, selector, n + "", value[n] || "#cccccc");
                });
            }
        },
    })
    public rankInstanceColors: { [rank: string]: string; };
}
