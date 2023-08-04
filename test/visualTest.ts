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

// import * as d3 from "d3";
import powerbiVisualsApi from "powerbi-visuals-api";
import DataView = powerbiVisualsApi.DataView;
import VisualObjectInstance = powerbiVisualsApi.VisualObjectInstance;
import { valueFormatter as vf } from "powerbi-visuals-utils-formattingutils";
import { assertColorsMatch, d3Click } from "powerbi-visuals-utils-testutils";
// import valueFormatter = vf.valueFormatter;
import { VisualData } from "./visualData";
import { VisualBuilder } from "./visualBuilder";
import { SunburstDataPoint } from "../src/dataInterfaces";

const DefaultWaitForRender: number = 500;
const LegendSelector: string = "#legendGroup";
const SliceLabelSelector: string = ".sunburst__slice-label";
const LabelVisibleSelector: string = ".sunburst__label--visible";
const PercentageSelector: string = ".sunburst__percentage-label";

describe("Sunburst", () => {
    let visualBuilder: VisualBuilder;
    let defaultDataViewBuilder: VisualData;
    let dataView: DataView;

    beforeEach(() => {
        visualBuilder = new VisualBuilder(500, 500);
        defaultDataViewBuilder = new VisualData();
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
                expect(visualBuilder.slices.length).toBe(12);
                done();
            },
            2);
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
                expect(visualBuilder.slices.length).toBe(12);
                visualBuilder.updateRenderTimeout(
                    updatedDataView,
                    () => {
                        expect(visualBuilder.slices.length).toBe(39);
                        done();
                    });
            });
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
                    const firstPoint: HTMLElement = visualBuilder.slices[visualBuilder.slices.length - 1];
                    const secondClickPoint: HTMLElement = visualBuilder.mainElement[0];
                    d3Click(firstPoint, 5, 5);
                    setTimeout(
                        () => {
                            expect(visualBuilder.element.querySelectorAll(LabelVisibleSelector).length).toBe(2);
                            d3Click(secondClickPoint, 1, 1);
                            setTimeout(
                                () => {
                                    expect(visualBuilder.element.querySelectorAll(LabelVisibleSelector).length).toBe(0);
                                    done();
                                },
                                DefaultWaitForRender);
                        },
                        DefaultWaitForRender);
                });
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
                    const firstClickPoint: HTMLElement = visualBuilder.slices[visualBuilder.slices.length - 1];
                    const secondClickPoint: HTMLElement = visualBuilder.mainElement[0];
                    d3Click(firstClickPoint, 5, 5);
                    setTimeout(
                        () => {
                            expect(visualBuilder.element.querySelectorAll(LabelVisibleSelector).length).toBe(1);
                            d3Click(secondClickPoint, 1, 1);
                            setTimeout(
                                () => {
                                    expect(visualBuilder.element.querySelectorAll(LabelVisibleSelector).length).toBe(0);
                                    done();
                                },
                                DefaultWaitForRender);
                        });
                });
        });

        it("category labels should be visible always", (done: DoneFn) => {
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
                    const firstClickPoint: HTMLElement = visualBuilder.slices[visualBuilder.slices.length - 1];
                    const secondClickPoint: HTMLElement = visualBuilder.mainElement[0];
                    d3Click(firstClickPoint, 5, 5);
                    setTimeout(
                        () => {
                            expect(visualBuilder.element.querySelectorAll(LabelVisibleSelector).length).toBe(2);
                            d3Click(secondClickPoint, 1, 1);
                            setTimeout(
                                () => {
                                    expect(visualBuilder.element.querySelectorAll(LabelVisibleSelector).length).toBe(0);
                                    done();
                                });
                        });
                });
        });

        it("data labels should not be hidden by default", (done: DoneFn) => {
            dataView = defaultDataViewBuilder.getDataView(
                [
                    defaultDataViewBuilder.RegionsDataSet,
                    defaultDataViewBuilder.CountriesDataSet
                ]);
            visualBuilder.updateRenderTimeout(
                dataView,
                () => {
                    expect(visualBuilder.element.querySelectorAll(SliceLabelSelector).length).toBe(12);
                    done();
                });
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
                    expect(visualBuilder.element.querySelectorAll(SliceLabelSelector).length).toBe(visualBuilder.slices.length);
                    done();
                });
        });
    });

    describe("Test invalid input data", () => {
        it("The data is empty", (done: DoneFn) => {
            dataView = defaultDataViewBuilder.getDataView(
                [
                    defaultDataViewBuilder.RegionsDataSet
                ]);

            if (dataView?.matrix?.rows?.root?.children) {
            dataView.matrix.rows.root.children = [];

            visualBuilder.updateRenderTimeout(
                dataView,
                () => {
                    expect(visualBuilder.slices.length).toBe(0);
                    done();
                });
            }
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
                    expect(visualBuilder.element.querySelectorAll(`${LegendSelector.trim()}>*`).length).toBe(0);
                    done();
                });
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
                    debugger;
                    expect(visualBuilder.element.querySelectorAll(`${LegendSelector.trim()}>*`).length).toBeTruthy();
                    done();
                });
        });
    });

    describe("Central caption", () => {
        it("percentage font size should be correct", (done: DoneFn) => {
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
                    const firstClickPoint: HTMLElement = visualBuilder.slices[visualBuilder.slices.length - 1];
                    const secondClickPoint: HTMLElement = visualBuilder.mainElement[0];
                    d3Click(firstClickPoint, 5, 5);
                    setTimeout(
                        () => {
                            expect(visualBuilder.element.querySelectorAll(LabelVisibleSelector).length).toBe(1);
                            d3Click(secondClickPoint, 1, 1);
                            setTimeout(
                                () => {
                                    expect((<HTMLElement>visualBuilder.element.querySelector(PercentageSelector)).style['font-size']).toBe("28px");
                                    done();
                                });
                        });
                });
        });

        it("label font size should be correct", (done: DoneFn) => {
            dataView = defaultDataViewBuilder.getDataView(
                [
                    defaultDataViewBuilder.RegionsDataSet,
                    defaultDataViewBuilder.CountriesDataSet
                ]);
            const fontSize: number = 22;
            const expectedFontSize: string = "44px";
            dataView.metadata.objects = {
                group: { fontSize: fontSize }
            };
            visualBuilder.updateRenderTimeout(
                dataView,
                () => {
                    const firstClickPoint: HTMLElement = visualBuilder.slices[visualBuilder.slices.length - 1];
                    const secondClickPoint: HTMLElement = visualBuilder.mainElement[0];
                    d3Click(firstClickPoint, 5, 5);
                    setTimeout(
                        () => {
                            d3Click(secondClickPoint, 1, 1);
                            setTimeout(
                                () => {
                                    expect((<HTMLElement>visualBuilder.element.querySelector(PercentageSelector)).style.fontSize).toBe(expectedFontSize);
                                    done();
                                },
                                DefaultWaitForRender);
                        },
                        DefaultWaitForRender);
                });
        });
    });

    describe("Colors", () => {
        /*
        it("should be parsed correctly", (done: DoneFn) => {
            const color: string = "#006400";
            dataView = defaultDataViewBuilder.getDataView(
                [
                    defaultDataViewBuilder.RegionsDataSet,
                    defaultDataViewBuilder.CountriesDataSet
                ]);
                if (dataView?.matrix?.rows?.root?.children) {
            dataView.matrix.rows.root.children[0].objects = {
                group: {
                    fill: {
                        solid: {
                            color: color
                        }
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
                });
        });*/

        it("should be displayed correctly", (done: DoneFn) => {
            const color: string = "#006400";
            const colorAsRGB: string = "rgb(0, 100, 0)";

            dataView = defaultDataViewBuilder.getDataView(
                [
                    defaultDataViewBuilder.RegionsDataSet,
                    defaultDataViewBuilder.CountriesDataSet
                ]);

            if (dataView?.matrix?.rows?.root?.children) {
                dataView.matrix.rows.root.children[0].objects = {
                    group: {
                        fill: {
                            solid: {
                                color: color
                            }
                        }
                    }
                }
            };

            visualBuilder.updateRenderTimeout(
                dataView,
                () => {
                    const elements: HTMLElement[] = Array.from(visualBuilder.slices).filter(element => {
                        const appliedColor: string = element.style.fill;

                        return appliedColor === colorAsRGB;
                    });

                    expect(elements.length).toBeTruthy();

                    done();
                });
        });
    });

    describe("Capabilities tests", () => {
        it("all items having displayName should have displayNameKey property", () => {
            let r = fetch("base/capabilities.json");
            let jsonData = JSON.stringify(r);

            let objectsChecker: Function = (obj) => {
                for (let property of Object.keys(obj)) {
                    let value: any = obj[property];

                    if (value.displayName) {
                        expect(value.displayNameKey).toBeDefined();
                    }

                    if (typeof value === "object") {
                        objectsChecker(value);
                    }
                }
            };

            objectsChecker(jsonData);
        });
    });

    describe("Bookmarks", () => {
        it("select and reset", (done: DoneFn) => {
            dataView = defaultDataViewBuilder.getDataView(
                [
                    defaultDataViewBuilder.RegionsDataSet,
                    defaultDataViewBuilder.CountriesDataSet
                ]
            );

            visualBuilder.updateRenderTimeout(
                dataView,
                () => {
                    visualBuilder.bookmarksCallback([(<any>visualBuilder.data).dataPoints[2].identity]);

                    expect(visualBuilder.selectedSlices.length).toBeGreaterThan(0);

                    visualBuilder.bookmarksCallback([]);

                    expect(visualBuilder.selectedSlices.length).toBe((<any>visualBuilder.data).dataPoints.length - 1); // ignore root node

                    done();
                }
            );
        });
    });

    describe("Accessibility", () => {
        describe("High contrast mode", () => {
            const backgroundColor: string = "#000000";
            const foregroundColor: string = "#ffff00";

            beforeEach(() => {
                visualBuilder.visualHost.colorPalette.isHighContrast = true;

                visualBuilder.visualHost.colorPalette.background = { value: backgroundColor };
                visualBuilder.visualHost.colorPalette.foreground = { value: foregroundColor };
            });

            it("should not use fill style", (done) => {
                visualBuilder.updateRenderTimeout(dataView, () => {
                    const layers = visualBuilder.slices;

                    expect(isColorAppliedToElements(layers, undefined, "fill"));

                    done();
                });
            });

            it("should use stroke style", (done) => {
                visualBuilder.updateRenderTimeout(dataView, () => {
                    const layers = visualBuilder.slices;

                    expect(isColorAppliedToElements(layers, foregroundColor, "stroke"));

                    done();
                });
            });

            function isColorAppliedToElements(
                elements: NodeListOf<HTMLElement>,
                color?: string,
                colorStyleName: string = "fill"
            ): boolean {
                return Array.from(elements).some((element: HTMLElement) => {
                    const currentColor: string = element.style[colorStyleName];

                    if (!currentColor || !color) {
                        return currentColor === color;
                    }

                    return assertColorsMatch(currentColor, color);
                });
            }
        });
    });

    describe("covertTreeNodeToSunBurstDataPoint", () => {
        it("SunburstDataPoint name should not contain `undefined` value", () => {
            const dataPoint: SunburstDataPoint = visualBuilder.instance.covertTreeNodeToSunBurstDataPoint(
                {
                    name: undefined
                },
                [],
                {
                    dataPoints: [],
                    total: 0,
                    root: undefined,
                },
                "#00ff00",
                visualBuilder.visualHost,
                0,
                vf.create({}),
                []
            );

            expect(dataPoint.name).not.toBe("undefined");
        });
    });
});
