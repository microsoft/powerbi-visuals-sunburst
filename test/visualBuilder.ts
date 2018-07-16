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

// tslint:disable-next-line:no-reference
/// <reference path="_references.ts"/>

module powerbi.extensibility.visual.test {
    // powerbi.extensibility.utils.test
    import VisualBuilderBase = powerbi.extensibility.utils.test.VisualBuilderBase;
    import renderTimeout = powerbi.extensibility.utils.test.helpers.renderTimeout;

    // Sunburst1445472000808
    import Sunburst = powerbi.extensibility.visual.Sunburst1445472000808.Sunburst;
    import SunburstData = powerbi.extensibility.visual.Sunburst1445472000808.SunburstData;

    export class VisualBuilder extends VisualBuilderBase<Sunburst> {
        bookmarksCallback: (ids: ISelectionId[]) => void;
        constructor(width: number, height: number) {
            super(width, height, "Sunburst1445472000808");
        }

        public update(dataView: DataView[] | DataView, updateType?: VisualUpdateType): void {
            this.visual.update(<VisualUpdateOptions>{
                dataViews: _.isArray(dataView) ? dataView : [dataView],
                viewport: this.viewport,
                type: updateType
            });
        }

        public updateRenderTimeout(
            dataViews: DataView[] | DataView,
            fn: Function,
            updateType?: VisualUpdateType,
            timeout?: number): number {
            this.update(dataViews, updateType);
            return renderTimeout(fn, timeout);
        }

        protected build(options: VisualConstructorOptions): Sunburst {
            options.host["selectionManager"].registerOnSelectCallback = (callback: (ids: ISelectionId[]) => void) => {
                this.bookmarksCallback = (selectionIds: ISelectionId[]) => {
                    options.host["selectionManager"].selectionIds = selectionIds;

                    callback(selectionIds);
                };
            };

            return new Sunburst(options);
        }

        public get instance(): Sunburst {
            return this.visual;
        }

        public get mainElement(): JQuery {
            return this.element.find(".sunburst svg");
        }

        public selectBookmarks(ids: ISelectionId[]) {
            this.bookmarksCallback(ids);
        }

        public get data(): SunburstData {
            return this.instance["data"];
        }

        public get slices(): JQuery {
            return this.element.find(".sunburst__slice");
        }

        public get selectedSlices(): JQuery {
            return this.slices.filter(function () {
                const appliedOpacity: number = parseFloat($(this).css("opacity"));

                return appliedOpacity === 1;
            });
        }
    }
}
