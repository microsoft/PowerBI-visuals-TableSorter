import valueFormatterFactory = powerbi.visuals.valueFormatter.create;
import IValueFormatter = powerbi.visuals.IValueFormatter;

export default class NumberFormatConfig {
    /**
     * The display units for the values
     */
    public labelDisplayUnits = 0;

    /**
     * The precision to use with the values
     */
    public labelPrecision = 0;

    /**
     * The formatter to use for numbers
     */
    public formatter: IValueFormatter;

    constructor(labelDisplayUnits = 0, labelPrecision = 0) {
        this.labelDisplayUnits = labelDisplayUnits;
        this.labelPrecision = labelPrecision;
        this.formatter = valueFormatterFactory({
            value: this.labelDisplayUnits,
            format: "0",
            precision: this.labelPrecision,
        });
    }

    public isEqual(other: NumberFormatConfig) {
        return other &&
            other.labelDisplayUnits === this.labelDisplayUnits &&
            other.labelPrecision === this.labelPrecision;
    }
}
