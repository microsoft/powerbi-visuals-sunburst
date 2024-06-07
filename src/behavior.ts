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

import { SunburstDataPoint, SunburstLabel } from "./dataInterfaces";

const DimmedOpacity: number = 0.2;
const DefaultOpacity: number = 1.0;
const EnterCode = "Enter";
const SpaceCode = "Space";

function getFillOpacity(
    selected: boolean,
    hasSelection: boolean
    ): number {
    if ((hasSelection && !selected)) {
        return DimmedOpacity;
    }

    return DefaultOpacity;
}

export interface SunburstBehaviorOptions {
    selection: Selection<BaseType, HierarchyRectangularNode<SunburstDataPoint>, BaseType, SunburstDataPoint>;
    clearCatcher: Selection<BaseType, any, BaseType, any>;
    legend: Selection<BaseType, any, BaseType, any>;
    onSelect?: (label: SunburstLabel, hasSelection: boolean, canDisplayCategory: boolean) => void;
    dataPoints: SunburstDataPoint[];
    dataPointsTree: SunburstDataPoint;
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
            legend
        } = options;

        this.bindMouseEventsToDataPoints(selection);
        this.bindMouseEventsToClearCatcher(clearCatcher);
        this.bindMouseEventsToLegend(legend);

        this.bindKeyboardEventsToDataPoints(selection);
    }

    private bindMouseEventsToDataPoints(selection): void {
        selection.on("click", (event: PointerEvent, dataPoint: HierarchyRectangularNode<SunburstDataPoint>) => {
            const isMultiSelection: boolean = event.ctrlKey || event.metaKey || event.shiftKey;
            this.selectionManager.select(dataPoint.data.identity, isMultiSelection);

            this.renderSelection();
            event.stopPropagation();
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

    private bindKeyboardEventsToDataPoints(selection): void {
        selection.on("keydown", (event: KeyboardEvent, dataPoint: HierarchyRectangularNode<SunburstDataPoint>) => {
            if (event.code !== EnterCode && event.code !== SpaceCode) {
                return;
            }

            const isMultiSelection: boolean = event.ctrlKey || event.metaKey || event.shiftKey;
            this.selectionManager.select(dataPoint.data.identity, isMultiSelection);

            this.renderSelection();
        });
    }

    private setSelectedDataPoints(dataPoints: SunburstDataPoint[]): void{
        const selectedIds: powerbi.extensibility.ISelectionId[] = this.selectionManager.getSelectionIds();
        dataPoints.forEach((dp: SunburstDataPoint) => {
            dp.selected = selectedIds.some((id: ISelectionId) => id.includes(dp.identity));
        });
    }

    public renderSelection(): void {
        const selection = this.options.selection;
        const hasSelection: boolean = this.selectionManager.hasSelection();

        this.setSelectedDataPoints(this.options.dataPoints);

        selection.style("opacity", (dataPoint: HierarchyRectangularNode<SunburstDataPoint>) => {
            return getFillOpacity(dataPoint.data.selected, hasSelection);
        });

        selection.attr("aria-selected", (dataPoint: HierarchyRectangularNode<SunburstDataPoint>) => {
            return dataPoint.data.selected;
        });

        if (this.options.onSelect){
            const canDisplayCategory: boolean = this.selectionManager.getSelectionIds().length === 1;
            const label: SunburstLabel = this.createCategoryLabel(canDisplayCategory);

            this.options.onSelect(label, hasSelection, canDisplayCategory);
        }
    }

    private createCategoryLabel(canDisplayCategory: boolean): SunburstLabel {
        if (canDisplayCategory){
            const selectedId = <ISelectionId>this.selectionManager.getSelectionIds()[0];
            const selectedDataPoint: SunburstDataPoint = this.options.dataPoints.find((el: SunburstDataPoint) => el.identity.equals(selectedId));
            const label: SunburstLabel = {
                text: selectedDataPoint.tooltipInfo[0].displayName,
                total: selectedDataPoint.total,
                color: selectedDataPoint.color
            };
            return label;
        }
        else {
            const total: number = this.calculateTotalForLabel(this.options.dataPointsTree, 0);
            const label: SunburstLabel = {
                text: "",
                total: total,
                color: "black"
            };
            return label;
        }
    }

    private calculateTotalForLabel(dataPoint: SunburstDataPoint, total: number): number {
        if (dataPoint.selected){
            return dataPoint.total;
        }

        if (!dataPoint?.children.length){
            return 0;
        }

        dataPoint.children.forEach((child) => {
            total += this.calculateTotalForLabel(child, 0);
        });
        return total;
    }
}
