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

import { Selection, event as d3Event, HierarchyRectangularNode } from "d3";

const getEvent = () => require("d3-selection").event as MouseEvent;

import powerbi from "powerbi-visuals-api";
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import ISelectionId = powerbi.visuals.ISelectionId;

import { interactivitySelectionService, interactivityBaseService } from "powerbi-visuals-utils-interactivityutils";
import IInteractiveBehavior = interactivityBaseService.IInteractiveBehavior;
import IInteractivityService = interactivityBaseService.IInteractivityService;
import InteractivityServiceBase = interactivityBaseService.InteractivityBaseService;
import ISelectionHandler = interactivityBaseService.ISelectionHandler;
import SelectableDataPoint = interactivitySelectionService.SelectableDataPoint;
import IBehaviorOptions = interactivityBaseService.IBehaviorOptions;
import InteractivitySelectionService = interactivitySelectionService.InteractivitySelectionService;

import { SunburstDataPoint } from "./dataInterfaces";

const DimmedOpacity: number = 0.2;
const DefaultOpacity: number = 1.0;

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

export interface BehaviorOptions extends IBehaviorOptions<SunburstDataPoint> {
    // dataPoints: SunburstDataPoint[];
    selection: Selection<d3.BaseType, HierarchyRectangularNode<SunburstDataPoint>, d3.BaseType, SunburstDataPoint>;
    clearCatcher: Selection<d3.BaseType, any, d3.BaseType, any>;
    interactivityService: IInteractivityService<SelectableDataPoint>;
    onSelect?: (dataPoint: SunburstDataPoint) => void;
}

export class Behavior implements IInteractiveBehavior {
    private options: BehaviorOptions;

    public bindEvents(
        options: BehaviorOptions,
        selectionHandler: ISelectionHandler
    ): void {
        this.options = options;

        const {
            selection,
            clearCatcher,
            onSelect
        } = options;

        selection.on("click", (d, i: number) => {
            debugger;
            selectionHandler.handleSelection(d.data, (<MouseEvent>getEvent()).ctrlKey);
        });
        clearCatcher.on("click", () => {
            selectionHandler.handleClearSelection();
        });
    }

    public renderSelection(hasSelection: boolean): void {
        const {
            selection,
            interactivityService,
        } = this.options;

        const hasHighlights: boolean = interactivityService.hasSelection();

        selection.style("opacity", (dataPoint: HierarchyRectangularNode<SunburstDataPoint>) => {
            const { selected, highlight } = dataPoint.data;
            return getFillOpacity(
                selected,
                highlight,
                !highlight && hasSelection,
                !selected && hasHighlights
            );
        });
    }
}
