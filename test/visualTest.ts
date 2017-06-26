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

namespace powerbi.extensibility.visual.test {
    // powerbi.extensibility.visual.test
    import SunburstData = powerbi.extensibility.visual.test.SunburstData;
    import SunburstBuilder = powerbi.extensibility.visual.test.SunburstBuilder;
    import DataView = powerbi.DataView;

    // powerbi.extensibility.utils.formatting
    import valueFormatter = powerbi.extensibility.utils.formatting.valueFormatter;

    import Sunburst = powerbi.extensibility.visual.Sunburst1445472000808.Sunburst;

    const DefaultWaitForRender: number = 500;
    const SliceSelector: string = ".sunburst__slice";
    const LabelVisibleSelector: string = ".sunburst__label--visible";

    describe("Sunburst", () => {
        let visualBuilder: SunburstBuilder;
        let defaultDataViewBuilder: SunburstData;
        let dataView: DataView;

        beforeEach(() => {
            visualBuilder = new SunburstBuilder(500, 500);
            defaultDataViewBuilder = new SunburstData();
        });

        it("sunburst slices dom validation", (done: DoneFn) => {
            dataView = defaultDataViewBuilder.getDataView(
                [
                    defaultDataViewBuilder.RegionsDataSet,
                    defaultDataViewBuilder.CountriesDataSet
                ]);

            visualBuilder.updateRenderTimeout(
                dataView,
                () => {
                    expect($(SliceSelector).length).toBe(13);
                    done();
                },
                2,
                DefaultWaitForRender);
        });

        it("slices onDataChanged dom validation", (done: DoneFn) => {
            const initialDataView: DataView = defaultDataViewBuilder.getDataView(
                [
                    defaultDataViewBuilder.RegionsDataSet,
                    defaultDataViewBuilder.CountriesDataSet
                ]);

            const updatedDataView: DataView = defaultDataViewBuilder.getDataView(
                [
                    defaultDataViewBuilder.RegionsDataSet,
                    defaultDataViewBuilder.CountriesDataSet,
                    defaultDataViewBuilder.StatesDataSet
                ]);

            visualBuilder.updateRenderTimeout(
                initialDataView,
                () => {
                    expect($(SliceSelector).length).toBe(13);
                    visualBuilder.updateRenderTimeout(
                        updatedDataView,
                        () => {
                            expect($(SliceSelector).length).toBe(40);
                            done();
                        },
                        2,
                        DefaultWaitForRender);
                },
                2,
                DefaultWaitForRender);
        });

        describe("Labels", () => {
            it("category labels should be visible by default", (done: DoneFn) => {
                dataView = defaultDataViewBuilder.getDataView(
                    [
                        defaultDataViewBuilder.RegionsDataSet,
                        defaultDataViewBuilder.CountriesDataSet,
                        defaultDataViewBuilder.StatesDataSet
                    ]);

                visualBuilder.updateRenderTimeout(
                    dataView,
                    () => {
                        const firstPoint: JQuery = visualBuilder.mainElement.find(SliceSelector).last();
                        const secondClickPoint: JQuery = visualBuilder.mainElement;
                        firstPoint.d3Click(5, 5);
                        setTimeout(
                            () => {
                                expect($(LabelVisibleSelector).length).toBe(2);
                                secondClickPoint.d3Click(1, 1);
                                setTimeout(
                                    () => {
                                        expect($(LabelVisibleSelector).length).toBe(0);
                                        done();
                                    },
                                    DefaultWaitForRender);
                            },
                            DefaultWaitForRender);
                    },
                    2,
                    DefaultWaitForRender);
            });

            it("category labels should be hidden", (done: DoneFn) => {
                dataView = defaultDataViewBuilder.getDataView(
                    [
                        defaultDataViewBuilder.RegionsDataSet,
                        defaultDataViewBuilder.CountriesDataSet
                    ]);

                dataView.metadata.objects = {
                    group: { showSelected: false }
                };

                visualBuilder.updateRenderTimeout(
                    dataView,
                    () => {
                        const firstClickPoint: JQuery = visualBuilder.mainElement.find(SliceSelector).last();
                        const secondClickPoint: JQuery = visualBuilder.mainElement;
                        firstClickPoint.d3Click(5, 5);
                        setTimeout(
                            () => {
                                expect($(LabelVisibleSelector).length).toBe(1);
                                secondClickPoint.d3Click(1, 1);
                                setTimeout(
                                    () => {
                                        expect($(LabelVisibleSelector).length).toBe(0);
                                        done();
                                    },
                                    DefaultWaitForRender);
                            },
                            DefaultWaitForRender);
                    },
                    2,
                    DefaultWaitForRender);
            });
        });

        describe("Test invalid input data", () => {
            it("The data is empty", (done: DoneFn) => {
                dataView = defaultDataViewBuilder.getDataView(
                    [
                        defaultDataViewBuilder.RegionsDataSet
                    ]);
                dataView.matrix.rows.root.children = [];

                visualBuilder.updateRenderTimeout(
                    dataView,
                    () => {
                        expect($(SliceSelector).length).toBe(0);
                        done();
                    },
                    2,
                    DefaultWaitForRender);
            });
        });

        describe("Test tooltip data", () => {
            it("Should be formatted using formatting string", () => {
                const visualInstance: Sunburst = visualBuilder.instance;

                const formattedDecimal: string = visualInstance.getFormattedValue(0.12345, "0.00");
                expect(formattedDecimal).toBe("0.12");
            });
        });
    });
}
