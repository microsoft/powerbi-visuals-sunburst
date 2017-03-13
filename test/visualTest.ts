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

/// <reference path="_references.ts"/>

namespace powerbi.extensibility.visual.test {
    // powerbi.extensibility.visual.test
    import VisualData = powerbi.extensibility.visual.test.SunburstData;
    import VisualBuilder = powerbi.extensibility.visual.test.SunburstBuilder;
    import colorHelpers = powerbi.extensibility.utils.test.helpers.color;
    import IVisual = powerbi.extensibility.IVisual;
    import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
    import VisualUpdateOptions = powerbi.extensibility.VisualUpdateOptions;
    import DataViewMatrix = powerbi.DataViewMatrix;
    import DataView = powerbi.DataView;
    import DataViewMetadata = powerbi.DataViewMetadata;
    import createSelectionId = powerbi.extensibility.utils.test.mocks.createSelectionId;

    // Sunburst1445472000808
    import VisualClass = powerbi.extensibility.visual.Sunburst1445472000808.Sunburst;
    import SunburstSlice = powerbi.extensibility.visual.Sunburst1445472000808.SunburstSlice;

    const DefaultWaitForRender = 500;
    const VisualSelector = ".sunBurstDrawArea";

    describe("Sunburst", () => {
        let visualBuilder: VisualBuilder,
            defaultDataViewBuilder: VisualData,
            dataView: DataView;

        beforeEach(() => {
            visualBuilder = new VisualBuilder(500, 500);
            defaultDataViewBuilder = new VisualData();
        });

        it("sunburst slices dom validation", (done) => {
            let dataView: DataView = defaultDataViewBuilder.getDataView(
                [
                    defaultDataViewBuilder.RegionsDataSet,
                    defaultDataViewBuilder.CountriesDataSet
                ]);

            visualBuilder.updateRenderTimeout(dataView, () => {
                expect($(`${VisualSelector} path`).length).toBe(13);
                done();
            }, DefaultWaitForRender);
        });

        it("slices onDataChanged dom validation", (done) => {
            let initialDataView: DataView = defaultDataViewBuilder.getDataView(
                [
                    defaultDataViewBuilder.RegionsDataSet,
                    defaultDataViewBuilder.CountriesDataSet
                ]);

            let updatedDataView: DataView = defaultDataViewBuilder.getDataView(
                [
                    defaultDataViewBuilder.RegionsDataSet,
                    defaultDataViewBuilder.CountriesDataSet,
                    defaultDataViewBuilder.StatesDataSet
                ]);

            visualBuilder.updateRenderTimeout(initialDataView, () => {
                expect($(`${VisualSelector} path`).length).toBe(13);
                visualBuilder.update(dataView);
                visualBuilder.updateRenderTimeout(updatedDataView, () => {
                    expect($(`${VisualSelector} path`).length).toBe(40);
                    done();
                }, DefaultWaitForRender);
            }, DefaultWaitForRender);
        });

        describe("Labels", () => {
            it("category labels should be visible by default", (done) => {
                let dataView: DataView = defaultDataViewBuilder.getDataView(
                    [
                        defaultDataViewBuilder.RegionsDataSet,
                        defaultDataViewBuilder.CountriesDataSet,
                        defaultDataViewBuilder.StatesDataSet
                    ]);

                visualBuilder.updateRenderTimeout(dataView, () => {
                    const firstPoint: JQuery = visualBuilder.mainElement.find("path").last();
                    firstPoint.d3MouseDown(5, 5);
                    setTimeout(() => {
                        expect($(`${VisualSelector} text[style*="opacity: 1"]`).length).toBe(2);
                        done();
                    }, DefaultWaitForRender);
                }, DefaultWaitForRender);
            });

            it("category labels should be hidden", (done) => {
                let dataView: DataView = defaultDataViewBuilder.getDataView(
                    [
                        defaultDataViewBuilder.RegionsDataSet,
                        defaultDataViewBuilder.CountriesDataSet
                    ]);

                dataView.metadata.objects = {
                    group: { showSelected: false }
                };

                visualBuilder.updateRenderTimeout(dataView, () => {
                    const clickPoint: JQuery = visualBuilder.mainElement.find("path").last();
                    clickPoint.d3MouseDown(5, 5);
                    setTimeout(() => {
                        expect($(`${VisualSelector} text[style*="opacity: 1"]`).length).toBe(1);
                        done();
                    }, DefaultWaitForRender);
                }, DefaultWaitForRender);
            });
        });

        describe("Test invalid input data", () => {
            it("The data is empty", (done) => {
                let dataView: DataView = defaultDataViewBuilder.getDataView(
                    [
                        defaultDataViewBuilder.RegionsDataSet
                    ]);
                dataView.matrix.rows.root.children = [];

                visualBuilder.updateRenderTimeout(dataView, () => {
                    expect($(`${VisualSelector} path`).length).toBe(0);
                    done();
                }, DefaultWaitForRender);
            });
        });
    });
}