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

import { interactivitySelectionService, interactivityBaseService } from "powerbi-visuals-utils-interactivityutils";
import IInteractiveBehavior = interactivityBaseService.IInteractiveBehavior;
import IInteractivityService = interactivityBaseService.IInteractivityService;
import ISelectionHandler = interactivityBaseService.ISelectionHandler;
import SelectableDataPoint = interactivitySelectionService.SelectableDataPoint;
import IBehaviorOptions = interactivityBaseService.IBehaviorOptions;

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

export interface BehaviorOptions extends IBehaviorOptions<SunburstDataPoint> {
    selection: Selection<BaseType, HierarchyRectangularNode<SunburstDataPoint>, BaseType, SunburstDataPoint>;
    clearCatcher: Selection<BaseType, any, BaseType, any>;
    interactivityService: IInteractivityService<SelectableDataPoint>;
    onSelect?: (dataPoint: SunburstDataPoint) => void;
}

export class Behavior implements IInteractiveBehavior {
    private options: BehaviorOptions;

    private select(d:HierarchyRectangularNode<SunburstDataPoint>, selectionHandler: ISelectionHandler, onSelect: (dataPoint: SunburstDataPoint) => void, event: MouseEvent | KeyboardEvent) {
        selectionHandler.handleSelection(d.data, event.ctrlKey);
        event.stopPropagation();

        if (onSelect) {
            onSelect(d.data);
        }
    }

    private clear(selectionHandler: ISelectionHandler, onSelect: (dataPoint: SunburstDataPoint) => void) {
        selectionHandler.handleClearSelection();

        if (onSelect) {
            onSelect(null);
        }
    }

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

        selection.on("click", (event:MouseEvent, d:HierarchyRectangularNode<SunburstDataPoint>) => {
            this.select(d, selectionHandler, onSelect, event);
        });
        selection.on("keydown", (event:KeyboardEvent, d: HierarchyRectangularNode<SunburstDataPoint>) => {
            if (event.code !== EnterCode && event.code !== SpaceCode) {
                return;
            }
            this.select(d, selectionHandler, onSelect, event);
        });
        clearCatcher.on("click", () => this.clear(selectionHandler, onSelect));
        clearCatcher.on("keydown", (e:KeyboardEvent) => {
            if (e.code !== EnterCode && e.code !== SpaceCode) {
                return;
            }
            this.clear(selectionHandler, onSelect);
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

        selection.attr("aria-selected", (dataPoint: HierarchyRectangularNode<SunburstDataPoint>) => {
            return dataPoint.data.selected;
        });
    }
}
