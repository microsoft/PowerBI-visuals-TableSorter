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

import * as React from "react";
import * as ReactDOM from "react-dom";
import * as $ from "jquery";
import { TableSorter as TableSorterImpl } from "../TableSorter";
import {
    ITableSorterRow,
    ITableSorterColumn,
    ITableSorterSettings,
    ITableSorterConfiguration,
    IDataProvider,
} from "../models";

import "../css/TableSorter.scss";

export interface TableSorterProps {
    cols: ITableSorterColumn[];
    provider: IDataProvider;
    width?: number;
    height?: number;
    multiSelect?: boolean;
    count?: number;
    singleSelect?: boolean;
    inferColumnTypes?: boolean;
    showHistograms?: boolean;
    showValues?: boolean;
    showAnimations?: boolean;
    showStacked?: boolean;
    onSortChanged?: (column: string, asc: boolean) => void;
    onSelectionChanged?: (selectedRows: ITableSorterRow[]) => void;
    onFilterChanged?: (filter: { column: string; value: string|{ domain: [number, number]; range: [number, number]}}) => void;
    onLoadMoreData?: () => void;
};

export interface TableSorterState { }

/**
 * Thin wrapper around TableSorter
 */
export class TableSorter extends React.Component<TableSorterProps, TableSorterState> {
    public props: TableSorterProps;
    private tableSorter: TableSorterImpl;
    private node: any;

    public componentDidMount() {
        this.node = ReactDOM.findDOMNode(this);
        this.tableSorter = new TableSorterImpl($(this.node));
        this.attachEvents();
        this.renderContent();
    }

    public componentWillReceiveProps(newProps: TableSorterProps) {
        this.renderContent(newProps);
    }

    /**
     * Renders this component
     */
    public render() {
        return <div className="tablesorter-react"></div>;
    }

    /**
     * Attaches the events
     */
    private attachEvents() {
        const guardedEventer = (evtName: string) => {
            return (...args: any[]) => {
                if (this.props[evtName]) {
                    this.props[evtName].apply(this, args);
                }
            };
        };
        this.tableSorter.events.on(TableSorterImpl.EVENTS.SELECTION_CHANGED, guardedEventer("onSelectionChanged"));
        this.tableSorter.events.on(TableSorterImpl.EVENTS.LOAD_MORE_DATA, guardedEventer("onLoadMoreData"));
        this.tableSorter.events.on(TableSorterImpl.EVENTS.FILTER_CHANGED, guardedEventer("onFilterChanged"));
        this.tableSorter.events.on(TableSorterImpl.EVENTS.SORT_CHANGED, guardedEventer("onSortChanged"));
    }

    private renderContent(props?: TableSorterProps) {
        // if called from `componentWillReceiveProps`, then we use the new
        // props, otherwise use what we already have.
        props = props || this.props;

        this.tableSorter.settings = this.getSettingsFromProps(props);
        // this.tableSorter.count = props.count || 100;
        if (props.provider && props.cols) {
            let config: ITableSorterConfiguration = this.tableSorter.configuration || {
                primaryKey: props.cols[0].column,
                columns: [],
            };
            config.columns = props.cols;
            this.tableSorter.configuration = config;
        }
        this.tableSorter.dataProvider = props.provider;
        if (props.width || props.height) {
            this.tableSorter.dimensions = { width: props.width, height: props.height };
        }
    }

    /**
     * Converts the tablesorter props to settings
     */
    private getSettingsFromProps(props: TableSorterProps): ITableSorterSettings {
        return {
            selection: {
                singleSelect: props.singleSelect,
                multiSelect: props.multiSelect,
            },
            presentation: {
                values: props.showValues,
                stacked: props.showStacked,
                histograms: props.showHistograms,
                animation: props.showAnimations,
            },
        };
    }
}
