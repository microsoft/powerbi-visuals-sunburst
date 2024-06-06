/*
 *  Power BI Visualizations
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

import { BaseType, Selection } from "d3-selection";
import { HierarchyRectangularNode } from "d3-hierarchy";

import ISelectionManager = powerbi.extensibility.ISelectionManager;
import ISelectionId = powerbi.visuals.ISelectionId;

import { SunburstDataPoint } from "./dataInterfaces";

const DimmedOpacity: number = 0.2;
const DefaultOpacity: number = 1.0;
const EnterCode = "Enter";
const SpaceCode = "Space";

function getFillOpacity(
    selected: boolean,
    highlight: boolean,
    hasSelection: boolean,
    hasPartialHighlights: boolean
): number {
    if ((hasPartialHighlights && !highlight) || (hasSelection && !selected)) {
        return DimmedOpacity;
    }

    return DefaultOpacity;
}

export interface SunburstBehaviorOptions {
    selection: Selection<BaseType, HierarchyRectangularNode<SunburstDataPoint>, BaseType, SunburstDataPoint>;
    clearCatcher: Selection<BaseType, any, BaseType, any>;
    legend: Selection<BaseType, any, BaseType, any>;
    onSelect?: (dataPoint: SunburstDataPoint) => void;
    dataPoints: SunburstDataPoint[];
}

export class SunburstBehavior {
    private options: SunburstBehaviorOptions;
    private selectionManager: ISelectionManager;

    constructor(selectionManager: ISelectionManager){
        this.selectionManager = selectionManager;

        this.selectionManager.registerOnSelectCallback((ids: ISelectionId[]) => {
            this.options.dataPoints.forEach(dataPoint => {
                ids.forEach(bookmarkSelection => {
                    if (bookmarkSelection.includes(dataPoint.identity)) {
                        dataPoint.selected = true;
                    }
                });
            });

            this.renderSelection();
        });
    }

    public bindEvents(
        options: SunburstBehaviorOptions
    ): void {
        this.options = options;

        const {
            selection,
            clearCatcher,
            legend,
            onSelect
        } = options;

        this.bindMouseEventsToDataPoints(selection, onSelect);
        this.bindMouseEventsToClearCatcher(clearCatcher);
        this.bindMouseEventsToLegend(legend);

        this.bindKeyboardEventsToDataPoints(selection, onSelect);
    }

    private bindMouseEventsToDataPoints(selection, onSelect: (dataPoint: SunburstDataPoint) => void): void {
        selection.on("click", (event: PointerEvent, dataPoint: HierarchyRectangularNode<SunburstDataPoint>) => {
            const isMultiSelection: boolean = event.ctrlKey || event.metaKey || event.shiftKey;

            if (isMultiSelection){
                this.selectionManager.select(dataPoint.data.identity, true);
            }
            else {
                const isSelection: boolean = this.isSelection(dataPoint.data);
                this.selectionManager.select(dataPoint.data.identity, !isSelection);
            }

            this.renderSelection();
            event.stopPropagation();
    
            if (onSelect) {
                onSelect(dataPoint.data);
            }
        });

        selection.on("contextmenu", (event: PointerEvent, dataPoint: HierarchyRectangularNode<SunburstDataPoint>) => {
            this.selectionManager.showContextMenu(dataPoint.data.identity, {
                x: event.clientX,
                y: event.clientY
            });
            event.preventDefault();
            event.stopPropagation();
        });
    }

    private bindMouseEventsToClearCatcher(clearCatcher): void{
        clearCatcher.on("click", () => {
            this.selectionManager.clear();
            this.renderSelection();
        });

        clearCatcher.on("contextmenu", (event: PointerEvent) => {
            this.selectionManager.showContextMenu({}, {
                x: event.clientX,
                y: event.clientY
            });
            event.preventDefault();
        });
    }

    private bindMouseEventsToLegend(legend): void {
        legend.on("contextmenu", (event: PointerEvent) => {
            this.selectionManager.showContextMenu({}, {
                x: event.clientX,
                y: event.clientY
            });
            event.preventDefault();
        });
    }

    private bindKeyboardEventsToDataPoints(selection, onSelect: (dataPoint: SunburstDataPoint) => void): void {
        selection.on("keydown", (event: KeyboardEvent, dataPoint: HierarchyRectangularNode<SunburstDataPoint>) => {
            if (event.code !== EnterCode && event.code !== SpaceCode) {
                return;
            }

            const isMultiSelection: boolean = event.ctrlKey || event.metaKey || event.shiftKey;

            if (isMultiSelection){
                this.selectionManager.select(dataPoint.data.identity, true);
            }
            else {
                const isSelection: boolean = this.isSelection(dataPoint.data);
                this.selectionManager.select(dataPoint.data.identity, !isSelection);
            }

            this.renderSelection();
    
            if (onSelect) {
                onSelect(dataPoint.data);
            }
        });
    }

    private isSelection(dataPoint: SunburstDataPoint): boolean {
        const ids = this.selectionManager.getSelectionIds();
        const isSelectedInSelectionManager: boolean = ids.some((id: ISelectionId) => id.equals(dataPoint.identity));
        return ((isSelectedInSelectionManager && ids.length > 1) || !isSelectedInSelectionManager);
    }

    private setSelectedDataPoints(dataPoints: SunburstDataPoint[]): void{
        const selectedIds: powerbi.extensibility.ISelectionId[] = this.selectionManager.getSelectionIds();
        dataPoints.forEach((dp: SunburstDataPoint) => {
            dp.selected = selectedIds.some((id: ISelectionId) => id.includes(dp.identity));
        });
    }

    public renderSelection(): void {
        const selection = this.options.selection;

        const hasHighlights: boolean = this.selectionManager.hasSelection();
        const hasSelection: boolean = this.selectionManager.hasSelection();

        this.setSelectedDataPoints(this.options.dataPoints);

        selection.style("opacity", (dataPoint: HierarchyRectangularNode<SunburstDataPoint>) => {
            const { selected, highlight } = dataPoint.data;
            return getFillOpacity(
                selected,
                highlight,
                !highlight && hasSelection,
                !selected && hasHighlights
            );
        });

        selection.attr("aria-selected", (dataPoint: HierarchyRectangularNode<SunburstDataPoint>) => {
            return dataPoint.data.selected;
        });
    }
}
