import {
     HasSettings,
     settings,
} from "essex.powerbi.base";
import { default as RankSettings, hasRankInfo } from "./rank";
import PresentationSettings from "./presentation";
import SelectionSettings from "./selection";

/**
 * Represents the TableSorterVisual settings
 */
export default class TableSorterVisualSettings extends HasSettings {

    /**
     * The settings related to ranking
     */
    @settings(RankSettings, {
        category: "Rank",
        enumerable: (s, dv) => hasRankInfo(dv),
    })
    public rankSettings: RankSettings;

    /**
     * The presentation settings
     */
    @settings(PresentationSettings, {
        category: "Presentation",
    })
    public presentation: PresentationSettings;

    /**
     * The selection settings
     */
    @settings(SelectionSettings, {
        category: "Selection",
    })
    public selection: SelectionSettings;
}
