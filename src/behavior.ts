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

module powerbi.extensibility.visual.behavior {
    import ISelectionHandler = powerbi.extensibility.utils.interactivity.ISelectionHandler;
    import IInteractiveBehavior = powerbi.extensibility.utils.interactivity.IInteractiveBehavior;
    import IInteractivityService = powerbi.extensibility.utils.interactivity.IInteractivityService;
    import InteractivityServiceBase = powerbi.extensibility.utils.interactivity.InteractivityService;

    export const DimmedOpacity: number = 0.4;
    export const DefaultOpacity: number = 1.0;

    export function getFillOpacity(
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
        selection: d3.Selection<SunburstDataPoint>;
        clearCatcher: d3.Selection<any>;
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

            selection.on("click", (dataPoint: SunburstDataPoint) => {
                const event: Event = d3.event as Event;

                selectionHandler.handleSelection(dataPoint, false);

                event.stopPropagation();

                if (onSelect) {
                    onSelect(dataPoint);
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

            this.options.dataPoints
                .filter((dataPoint: SunburstDataPoint) => dataPoint && dataPoint.selected)
                .forEach(this.markDataPointsAsSelected.bind(this));

            const hasHighlights: boolean = interactivityService.hasSelection();

            selection.style("opacity", (dataPoint: SunburstDataPoint) => {
                return getFillOpacity(
                    dataPoint.selected,
                    dataPoint.highlight,
                    !dataPoint.highlight && hasSelection,
                    !dataPoint.selected && hasHighlights
                );
            });
        }

        private markDataPointsAsSelected(root: SunburstDataPoint): void {
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
        public restoreSelection(selectionIds: visuals.ISelectionId[]): void {
            super.restoreSelection(selectionIds);

            const selectedDataPoint: SunburstDataPoint = (this.selectableDataPoints as SunburstDataPoint[])
                .filter((dataPoint: SunburstDataPoint) => {
                    return dataPoint
                        && dataPoint.identity
                        && selectionIds
                        && selectionIds[0]
                        && selectionIds[0].equals(dataPoint.identity as visuals.ISelectionId);
                })[0];

            if (this.onSelect) {
                this.onSelect(selectedDataPoint);
            }
        }
    }
}
