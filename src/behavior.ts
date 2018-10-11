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

import powerbi from "powerbi-visuals-api";
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import ISelectionId = powerbi.visuals.ISelectionId;

import { interactivityService } from "powerbi-visuals-utils-interactivityutils";
import IInteractiveBehavior = interactivityService.IInteractiveBehavior;
import IInteractivityService = interactivityService.IInteractivityService;
import InteractivityServiceBase = interactivityService.InteractivityService;
import ISelectionHandler = interactivityService.ISelectionHandler;

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

export interface BehaviorOptions {
    dataPoints: SunburstDataPoint[];
    selection: Selection<d3.BaseType, HierarchyRectangularNode<SunburstDataPoint>, d3.BaseType, SunburstDataPoint>;
    clearCatcher: Selection<d3.BaseType, any, d3.BaseType, any>;
    interactivityService: IInteractivityService;
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
            onSelect,
        } = options;

        selection.on("click", (dataPoint: HierarchyRectangularNode<SunburstDataPoint>) => {
            const event: Event = d3Event as Event;

            selectionHandler.handleSelection(dataPoint.data, false);

            event.stopPropagation();

            if (onSelect) {
                onSelect(dataPoint.data);
            }
        });

        clearCatcher.on("click", () => {
            selectionHandler.handleClearSelection();

            if (onSelect) {
                onSelect(null);
            }
        });
    }

    public renderSelection(hasSelection: boolean): void {
        const {
            selection,
            interactivityService,
        } = this.options;

        this.options.dataPoints.forEach((point) => {
            if (!point || !point.selected) {
                this.markDataPointsAsSelected(point);
            }
        });

        const hasHighlights: boolean = interactivityService.hasSelection();

        selection.style("opacity", (dataPoint: HierarchyRectangularNode<SunburstDataPoint>) => {
            const { selected, highlight } = dataPoint.data;
            return getFillOpacity(
                selected,
                highlight,
                highlight && hasSelection,
                selected && hasHighlights
            );
        });
    }

    private  markDataPointsAsSelected(root: SunburstDataPoint): void {
        if (!root || !root.parent) {
            return;
        }

        root.parent.selected = true;

        this.markDataPointsAsSelected(root.parent);
    }
}

export class InteractivityService extends InteractivityServiceBase {
    constructor(host: IVisualHost, private onSelect?: (dataPoint: SunburstDataPoint) => void) {
        super(host);
    }

    /**
     * Sunburst does not support multi selection because it's hard to render a center tooltip for more than a single data point
     */
    public restoreSelection(selectionIds: ISelectionId[]): void {
        super.restoreSelection(selectionIds);
        const selectedDataPoint: SunburstDataPoint = (this.selectableDataPoints as SunburstDataPoint[])
            .filter(dataPoint => {
                return dataPoint
                    && dataPoint.identity
                    && selectionIds
                    && selectionIds[0]
                    && selectionIds[0].equals(dataPoint.identity as ISelectionId);
            })[0];

        if (this.onSelect) {
            this.onSelect(selectedDataPoint);
        }
    }
}
