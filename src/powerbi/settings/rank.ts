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
} from "essex.powerbi.base";
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
export class GradientSettings {

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
