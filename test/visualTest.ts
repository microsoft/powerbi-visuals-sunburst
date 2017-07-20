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
    const LegendSelector: string = "#legendGroup";
    const SliceSelector: string = ".sunburst__slice";
    const SliceLabelSelector: string = ".sunburst__slice-label";
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

            it("category labels should be visible", (done: DoneFn) => {
                dataView = defaultDataViewBuilder.getDataView(
                    [
                        defaultDataViewBuilder.RegionsDataSet,
                        defaultDataViewBuilder.CountriesDataSet
                    ]);

                dataView.metadata.objects = {
                    group: { showSelected: true }
                };

                visualBuilder.updateRenderTimeout(
                    dataView,
                    () => {
                        const firstClickPoint: JQuery = visualBuilder.mainElement.find(SliceSelector).last();
                        const secondClickPoint: JQuery = visualBuilder.mainElement;
                        firstClickPoint.d3Click(5, 5);
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

            it("data labels should be hidden by default", (done: DoneFn) => {
                dataView = defaultDataViewBuilder.getDataView(
                    [
                        defaultDataViewBuilder.RegionsDataSet,
                        defaultDataViewBuilder.CountriesDataSet
                    ]);

                visualBuilder.updateRenderTimeout(
                    dataView,
                    () => {
                        expect($(SliceLabelSelector).length).toBe(0);
                        done();
                    }, 2, DefaultWaitForRender);
            });

            it("count of data labels should be equal slice count", (done: DoneFn) => {
                dataView = defaultDataViewBuilder.getDataView(
                    [
                        defaultDataViewBuilder.RegionsDataSet,
                        defaultDataViewBuilder.CountriesDataSet
                    ]);
                dataView.metadata.objects = {
                    group: { showDataLabels: true }
                };
                visualBuilder.updateRenderTimeout(
                    dataView,
                    () => {
                        expect($(SliceLabelSelector).length).toBe($(SliceSelector).length);
                        done();
                    }, 2, DefaultWaitForRender);
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

        describe("Legend", () => {
            it("legend should be hidden by default", (done: DoneFn) => {
                dataView = defaultDataViewBuilder.getDataView(
                    [
                        defaultDataViewBuilder.RegionsDataSet,
                        defaultDataViewBuilder.CountriesDataSet
                    ]);
                visualBuilder.updateRenderTimeout(
                    dataView,
                    () => {
                        expect($(LegendSelector).children().length).toBe(0);
                        done();
                    }, 2, DefaultWaitForRender);
            });
            it("legend should be shown", (done: DoneFn) => {
                dataView = defaultDataViewBuilder.getDataView(
                    [
                        defaultDataViewBuilder.RegionsDataSet,
                        defaultDataViewBuilder.CountriesDataSet
                    ]);
                dataView.metadata.objects = {
                    legend: { show: true }
                };
                visualBuilder.updateRenderTimeout(
                    dataView,
                    () => {
                        expect($(LegendSelector).children().length).toBeTruthy();
                        done();
                    }, 2, DefaultWaitForRender);
            });
        });

        describe("Colors", () => {
            it("should be parsed correctly", (done: DoneFn) => {
                const color: string = "#006400";
                dataView = defaultDataViewBuilder.getDataView(
                    [
                        defaultDataViewBuilder.RegionsDataSet,
                        defaultDataViewBuilder.CountriesDataSet
                    ]);
                dataView.matrix.rows.root.children[0].objects = {
                    group: {
                        fill: {
                            solid: {
                                color: color
                            }
                        }
                    }
                };
                visualBuilder.updateRenderTimeout(
                    dataView,
                    () => {
                        const result: VisualObjectInstance[] = visualBuilder.enumerateObjectInstances({ objectName: "group" });
                        const colorExist: boolean = result.some((instance: VisualObjectInstance) =>
                            instance.properties &&
                            instance.properties["fill"] &&
                            instance.properties["fill"]["solid"] &&
                            instance.properties["fill"]["solid"]["color"] &&
                            instance.properties["fill"]["solid"]["color"] === color);
                        expect(colorExist).toBeTruthy();
                        done();
                    }, 2, DefaultWaitForRender);
            });
            it("should be displayed correctly", (done: DoneFn) => {
                const color: string = "#006400";
                const colorAsRGB: string = "rgb(0, 100, 0)";
                dataView = defaultDataViewBuilder.getDataView(
                    [
                        defaultDataViewBuilder.RegionsDataSet,
                        defaultDataViewBuilder.CountriesDataSet
                    ]);
                dataView.matrix.rows.root.children[0].objects = {
                    group: {
                        fill: {
                            solid: {
                                color: color
                            }
                        }
                    }
                };
                visualBuilder.updateRenderTimeout(
                    dataView,
                    () => {
                        expect($(`${SliceSelector}[style="fill: ${colorAsRGB};"]`).length).toBeTruthy();
                        done();
                    }, 2, DefaultWaitForRender);
            });

        });
    });
}
