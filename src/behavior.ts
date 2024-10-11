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
type d3Selection<T> = Selection<any, T, any, any>;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import ISelectionId = powerbi.visuals.ISelectionId;

import { ColorHelper } from "powerbi-visuals-utils-colorutils";

import { legendInterfaces } from "powerbi-visuals-utils-chartutils";
import LegendDataPoint = legendInterfaces.LegendDataPoint;

import { SunburstDataPoint, SunburstLabel } from "./dataInterfaces";
import { SunburstUtils } from "./SunburstUtils";

const EnterCode = "Enter";
const SpaceCode = "Space";

export interface SunburstBehaviorOptions {
    elements: Selection<BaseType, HierarchyRectangularNode<SunburstDataPoint>, BaseType, SunburstDataPoint>;
    clearCatcher: d3Selection<any>;
    legend: d3Selection<LegendDataPoint>;
    legendClearCatcher: d3Selection<any>;
    onSelect?: (label: SunburstLabel, hasSelection: boolean, canDisplayCategory: boolean) => void;
    dataPointsTree: SunburstDataPoint;
}

export class SunburstBehavior {
    private elements: Selection<BaseType, HierarchyRectangularNode<SunburstDataPoint>, BaseType, SunburstDataPoint>;
    private clearCatcher: d3Selection<any>;
    private legendItems: d3Selection<LegendDataPoint>;
    private legendIcons: d3Selection<LegendDataPoint>;
    private legendClearCatcher: d3Selection<any>;
    private dataPoints: HierarchyRectangularNode<SunburstDataPoint>[];
    private dataPointsTree: SunburstDataPoint;
    private legendDataPoints: LegendDataPoint[];
    private selectionManager: ISelectionManager;
    private colorHelper: ColorHelper;
    private onSelect: (label: SunburstLabel, hasSelection: boolean, canDisplayCategory: boolean) => void;

    constructor(selectionManager: ISelectionManager, colorHelper: ColorHelper){
        this.colorHelper = colorHelper;
        this.selectionManager = selectionManager;
        this.selectionManager.registerOnSelectCallback(this.onSelectCallback.bind(this));
    }

    private onSelectCallback(selectionIds?: ISelectionId[]){
        this.applySelectionStateToData(selectionIds);
        this.renderSelection();
    }

    private applySelectionStateToData(selectionIds?: ISelectionId[]): void{
        const selectedIds: ISelectionId[] = <ISelectionId[]>this.selectionManager.getSelectionIds();
        this.setSelectedToDataPoints(this.dataPoints, selectionIds || selectedIds);
        this.setSelectedToDataPoints(this.legendDataPoints, selectionIds || selectedIds);
    }

    private setSelectedToDataPoints(dataPoints: LegendDataPoint[] | HierarchyRectangularNode<SunburstDataPoint>[], ids: ISelectionId[]): void{
        dataPoints.forEach((dataPoint: LegendDataPoint| HierarchyRectangularNode<SunburstDataPoint>) => {
            const data : SunburstDataPoint | LegendDataPoint = this.castDataFromPoint(dataPoint);
            data.selected = ids.some((selectedId: ISelectionId) => selectedId.includes(data.identity));
        });
    }

    private bindContextMenuEvent(elements: d3Selection<any>): void {
        elements.on("contextmenu", (event: PointerEvent, dataPoint: HierarchyRectangularNode<SunburstDataPoint> | LegendDataPoint | undefined) => {
            const data : SunburstDataPoint | LegendDataPoint = this.castDataFromPoint(dataPoint);
            this.selectionManager.showContextMenu(data ? data.identity : {},
                {
                    x: event.clientX,
                    y: event.clientY
                }
            );
            event.preventDefault();
            event.stopPropagation();
        });
    }

    private castDataFromPoint(dataPoint: HierarchyRectangularNode<SunburstDataPoint> | LegendDataPoint | undefined): SunburstDataPoint | LegendDataPoint {
        return (dataPoint as HierarchyRectangularNode<SunburstDataPoint>)?.data || (dataPoint as LegendDataPoint);
    }

    private bindClickEvent(elements: d3Selection<any>): void {
        elements.on("click", (event: PointerEvent, dataPoint: HierarchyRectangularNode<SunburstDataPoint> | LegendDataPoint | undefined) => {
            const isMultiSelection: boolean = event.ctrlKey || event.metaKey || event.shiftKey;
            const data: SunburstDataPoint | LegendDataPoint = (dataPoint as HierarchyRectangularNode<SunburstDataPoint>)?.data || (dataPoint as LegendDataPoint);
            if (data){
                this.selectionManager.select(data.identity, isMultiSelection);
                event.stopPropagation();
            }
            else {
                this.selectionManager.clear();
            }
            this.onSelectCallback();
        })
    }

    private bindKeyboardEvent(elements: d3Selection<any>): void {
        elements.on("keydown", (event : KeyboardEvent, dataPoint: HierarchyRectangularNode<SunburstDataPoint> | LegendDataPoint) => {
            if (event.code !== EnterCode && event.code !== SpaceCode) {
                return;
            }
            
            const isMultiSelection: boolean = event.ctrlKey || event.metaKey || event.shiftKey;
            const data: SunburstDataPoint | LegendDataPoint = (dataPoint as HierarchyRectangularNode<SunburstDataPoint>)?.data || (dataPoint as LegendDataPoint);

            this.selectionManager.select(data.identity, isMultiSelection);

            event.stopPropagation();
            this.onSelectCallback();
        });
    }

    public renderSelection(){
        const legendHasSelection: boolean = this.legendDataPoints.some((dataPoint: LegendDataPoint) => dataPoint.selected);
        const dataPointHasSelection: boolean = this.dataPoints.some((dataPoint: HierarchyRectangularNode<SunburstDataPoint>) => dataPoint.data.selected);

        this.elements.style("opacity", (dataPoint: HierarchyRectangularNode<SunburstDataPoint>) => {
            return SunburstUtils.getFillOpacity(dataPoint.data.selected, dataPointHasSelection);
        });

        this.elements.attr("aria-selected", (dataPoint: HierarchyRectangularNode<SunburstDataPoint>) => {
            return dataPoint.data.selected;
        });

        this.legendIcons.style("fill-opacity", (legendDataPoint: LegendDataPoint) => {
            return SunburstUtils.getLegendFillOpacity(
                legendDataPoint.selected,
                legendHasSelection,
                this.colorHelper.isHighContrast
            );
        });

        this.legendIcons.style("fill", (legendDataPoint: LegendDataPoint) => {
            return SunburstUtils.getLegendFill(
                legendDataPoint.selected,
                legendHasSelection,
                legendDataPoint.color,
                this.colorHelper.isHighContrast
            );
        });

        if (this.onSelect){
            const canDisplayCategory: boolean = this.selectionManager.getSelectionIds().length === 1;
            const label: SunburstLabel = this.createCategoryLabel(canDisplayCategory);

            this.onSelect(label, dataPointHasSelection, canDisplayCategory);
        }
    }

    public bindEvents(options: SunburstBehaviorOptions) {
        this.elements = options.elements;
        this.dataPoints = options.elements.data();
        this.dataPointsTree = options.dataPointsTree;
        this.legendItems = options.legend;
        this.legendDataPoints = options.legend.data();
        this.clearCatcher = options.clearCatcher;
        this.legendClearCatcher = options.legendClearCatcher;
        this.legendIcons = options.legend.selectAll(".legendIcon");
        this.onSelect = options.onSelect;

        this.applySelectionStateToData();

        this.bindContextMenuEvent(this.elements);
        this.bindContextMenuEvent(this.legendItems);
        this.bindContextMenuEvent(this.clearCatcher);
        this.bindContextMenuEvent(this.legendClearCatcher);

        this.bindClickEvent(this.elements);
        this.bindClickEvent(this.legendItems);
        this.bindClickEvent(this.clearCatcher);
        this.bindClickEvent(this.legendClearCatcher);
        
        this.bindKeyboardEvent(this.elements);
    }

    private createCategoryLabel(canDisplayCategory: boolean): SunburstLabel {
        if (canDisplayCategory){
            const selectedId = <ISelectionId>this.selectionManager.getSelectionIds()[0];
            const selectedDataPoint: HierarchyRectangularNode<SunburstDataPoint> = this.dataPoints.find((el: HierarchyRectangularNode<SunburstDataPoint>) => el.data.identity.equals(selectedId));
            const label: SunburstLabel = {
                text: selectedDataPoint.data.tooltipInfo[0].displayName,
                total: selectedDataPoint.data.total,
                color: selectedDataPoint.data.color
            };
            return label;
        }
        else {
            const total: number = this.calculateTotalForLabel(this.dataPointsTree, 0);
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
