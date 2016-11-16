import {
     setting,
     boolSetting as bool,
} from "essex.powerbi.base";

/**
 * Settings related to presentation
 */
export default class PresentationSettings {

    /**
     * The display units for the values
     */
    @setting({
        displayName: "Display Units",
        config: {
            type: powerbi.visuals.StandardObjectProperties.labelDisplayUnits.type,
        },
        defaultValue: 0,
    })
    public labelDisplayUnits: number;

    /**
     * The precision to use with the values
     */
    @setting({
        displayName: "Display Precision",
        config: {
            type: powerbi.visuals.StandardObjectProperties.labelPrecision.type,
        },
    })
    public labelPrecision: number;

    /**
     * If true, when columns are combined, the all columns will be displayed stacked
     */
    @bool({
        displayName: "Stacked",
        description: "If true, when columns are combined, the all columns will be displayed stacked",
        defaultValue: true,
    })
    public stacked: boolean;

    /**
     * If the actual values should be displayed under the bars
     */
    @bool({
        displayName: "Values",
        description: "If the actual values should be displayed under the bars",
        defaultValue: false,
    })
    public values: boolean;

    /**
     * Show histograms in the column headers
     */
    @bool({
        displayName: "Histograms",
        description: "Show histograms in the column headers",
        defaultValue: true,
    })
    public histograms: boolean;

    /**
     * Should the grid be animated when sorting
     */
    @bool({
        displayName: "Animation",
        description: "Should the grid be animated when sorting",
        defaultValue: true,
    })
    public animation: boolean;

    /**
     * Should the grid show tooltips on hover of a row
     */
    @bool({
        displayName: "Table tooltips",
        description: "Should the grid show tooltips on hover of a row",
        defaultValue: false,
    })
    public tooltips: boolean;
}
