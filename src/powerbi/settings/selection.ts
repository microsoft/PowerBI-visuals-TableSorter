import { boolSetting as bool } from "essex.powerbi.base";

export default class SelectionSettings {
    /**
     * If true, multiple rows can be selected
     */
    @bool({
        displayName: "Multi Select",
        description: "If true, multiple rows can be selected",
        defaultValue: false,
        name: "multiSelect",
    })
    public multiSelect: boolean;
}
