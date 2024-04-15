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

import powerbiVisualsApi from "powerbi-visuals-api";
import DataView = powerbiVisualsApi.DataView;
import VisualUpdateType = powerbiVisualsApi.VisualUpdateType;
import ISelectionId = powerbiVisualsApi.visuals.ISelectionId;

import { VisualBuilderBase, renderTimeout } from "powerbi-visuals-utils-testutils";
import { Sunburst as VisualClass } from "../src/Sunburst";
import { VisualData } from "./visualData";
import VisualConstructorOptions = powerbiVisualsApi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbiVisualsApi.extensibility.visual.VisualUpdateOptions;

export class VisualBuilder extends VisualBuilderBase<VisualClass> {
    bookmarksCallback: (ids: ISelectionId[]) => void;
    constructor(width: number, height: number) {
        super(width, height, "Sunburst1445472000808");
    }

    public update(dataView: DataView[] | DataView, updateType?: VisualUpdateType): void {
        let options: VisualUpdateOptions = {
            dataViews: Array.isArray(dataView) ? dataView : [dataView],
            viewport: this.viewport,
            type: updateType!
        };

        this.visual.update(options);
    }

    public updateRenderTimeout(
        dataViews: DataView[] | DataView,
        fn: () => any,
        updateType?: VisualUpdateType,
        timeout?: number): number {
        this.update(dataViews, updateType);
        return renderTimeout(fn, timeout);
    }

    protected build(options: VisualConstructorOptions): VisualClass {
        options.host["selectionManager"].registerOnSelectCallback = (callback: (ids: ISelectionId[]) => void) => {
            this.bookmarksCallback = (selectionIds: ISelectionId[]) => {
                options.host["selectionManager"].selectionIds = selectionIds;

                callback(selectionIds);
            };
        };

        return new VisualClass(options);
    }

    public get instance(): VisualClass {
        return this.visual;
    }

    public get mainElement(): NodeListOf<HTMLElement> {
        return this.element.querySelectorAll(".sunburst svg");
    }

    public selectBookmarks(ids: ISelectionId[]) {
        this.bookmarksCallback(ids);
    }

    public get data(): VisualData {
        return <any>(this.instance)["data"];
    }

    public get slices(): NodeListOf<HTMLElement> {
        return this.element.querySelectorAll(".sunburst__slice");
    }

    public get selectedSlices(): Element[] {
        return Array.from(this.slices).filter((element: HTMLElement) => {
            const appliedOpacity: number = parseFloat(element.style.opacity);

            return appliedOpacity === 1;
        });
    }
}
