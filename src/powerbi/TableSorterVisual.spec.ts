/* tslint:disable */
require("essex.powerbi.base/spec/visualHelpers");
global['powerbi'].visuals.StandardObjectProperties = {};
global['powerbi'].visuals.valueFormatter = {
    create: () => (() => 0)
};
/* tslint:enable */
import { Utils as SpecUtils } from "essex.powerbi.base/spec/visualHelpers";
import { UpdateType } from "essex.powerbi.base/src/lib/Utils";
import { expect } from "chai";
import { default as TableSorterVisual  } from "./TableSorterVisual";
import * as $ from "jquery";

describe("TableSorterVisual", () => {
    let parentEle: JQuery;
    beforeEach(() => {
        parentEle = $("<div></div>");
    });

    afterEach(() => {
        if (parentEle) {
            parentEle.remove();
        }
        parentEle = undefined;
    });

    let createVisual = () => {
        let currentUpdateType: UpdateType;
        let instance: TableSorterVisual = new TableSorterVisual(true, {
            presentation: {
                animation: false
            },
        }, () => currentUpdateType);
        let initOptions = SpecUtils.createFakeInitOptions();
        parentEle.append(initOptions.element);
        instance.init(initOptions);
        return {
            instance,
            element: initOptions.element,
            setUpdateType: (type: UpdateType) => currentUpdateType = type,
        };
    };

    it("should load", () => {
        expect(createVisual()).to.not.be.undefined;
    });

    it("should remove columns from TableSorter.configuration if columns are removed from PBI", () => {
        let { instance, setUpdateType } = createVisual();

        // Load initial data
        setUpdateType(UpdateType.Data);
        instance.update(SpecUtils.createUpdateOptionsWithData());
        expect(instance.tableSorter.configuration.columns.length).to.be.equal(2);

        // Pretend that we had an existing config
        let config = instance.tableSorter.configuration;
        let newOptions = SpecUtils.createUpdateOptionsWithSmallData();
        newOptions.dataViews[0].metadata = <any>{
            objects: {
                "layout": {
                    "layout": JSON.stringify(config)
                },
            },
        };

        // Run update again with new options
        setUpdateType(UpdateType.Data);
        instance.update(newOptions);

        // Make sure it removed the extra column
        expect(instance.tableSorter.configuration.columns.length).to.be.equal(1);
    });

    it("should load the data into the tablesorter if only columns changed", () => {
        let { instance, setUpdateType } = createVisual();

        // Load initial data
        setUpdateType(UpdateType.Data);
        instance.update(SpecUtils.createUpdateOptionsWithData());
        expect(instance.tableSorter.configuration.columns.length).to.be.equal(2);

        instance.tableSorter = <any>{};
        setUpdateType(UpdateType.Data);
        instance.update(SpecUtils.createUpdateOptionsWithSmallData());

        // TODO: Assume the data is legit for now
        expect(instance.tableSorter.dataProvider).to.not.be.undefined;
    });

    it("should remove sort from TableSorter.configuration if columns are removed from PBI", () => {
        let { instance, setUpdateType } = createVisual();

        // Load initial data
        let data = SpecUtils.createUpdateOptionsWithData();
        setUpdateType(UpdateType.Data);
        instance.update(data);
        expect(instance.tableSorter.configuration.columns.length).to.be.equal(2);

        // Pretend that we had an existing config
        let newOptions = SpecUtils.createUpdateOptionsWithSmallData();
        let config = instance.tableSorter.configuration;

        // Add a sort to the missing data, which in this case is the second column in the original data
        config.sort = {
            // This column is removed in the "Small" dataset
            column: data.dataViews[0].table.columns[1].displayName,
            asc: true,
        };

        newOptions.dataViews[0].metadata = <any>{
            objects: {
                "layout": {
                    "layout": JSON.stringify(config)
                },
            },
        };

        // Run update again with new options
        setUpdateType(UpdateType.Data);
        instance.update(newOptions);

        // Make sure it removed the extra column
        expect(instance.tableSorter.configuration.sort).to.be.undefined;
    });

    it("should support loading numerical filters and the correct data after a page change");
    it("should not get into an infinite loop when changing the sort quickly");
    it("should not fail PBI (nested transactions issue) if adding/removing columns in PBI quickly");
    it("should rerender values when the value formatter columns change (precision, units)");
});
