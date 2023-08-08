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
import { valueFormatter as vf } from "powerbi-visuals-utils-formattingutils";
import { assertColorsMatch, d3Click } from "powerbi-visuals-utils-testutils";
import { VisualData } from "./visualData";
import { VisualBuilder } from "./visualBuilder";
import { SunburstDataPoint } from "../src/dataInterfaces";

const DefaultWaitForRender: number = 500;
const LegendSelector: string = "#legendGroup";
const SliceSelector: string = ".sunburst__slice";
const SliceLabelSelector: string = ".sunburst__slice-label";
const LabelVisibleSelector: string = ".sunburst__label--visible";
const PercentageSelector: string = ".sunburst__percentage-label";
const CategoryLabelSelector: string = ".sunburst__category-label";

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
                expect(visualBuilder.slices.length).toBe(12);
                visualBuilder.updateRenderTimeout(
                    updatedDataView,
                    () => {
                        expect(visualBuilder.slices.length).toBe(39);
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
                async () => {
                    const firstPoint: HTMLElement = visualBuilder.slices[visualBuilder.slices.length - 1];
                    const secondClickPoint: HTMLElement = visualBuilder.mainElement[0];
                    d3Click(firstPoint, 5, 5);
                    await timeout(DefaultWaitForRender);
                    expect(visualBuilder.element.querySelectorAll(LabelVisibleSelector).length).toBe(2);
                    d3Click(secondClickPoint, 1, 1);
                    await timeout(DefaultWaitForRender);
                    expect(visualBuilder.element.querySelectorAll(LabelVisibleSelector).length).toBe(0);
                    done();
                });
        });

        beforeEach(() => {
            dataView = defaultDataViewBuilder.getDataView(
                [
                    defaultDataViewBuilder.RegionsDataSet,
                    defaultDataViewBuilder.CountriesDataSet
                ]);
        });

        it("category labels should be hidden", (done: DoneFn) => {
            dataView.metadata.objects = {
                group: { showSelected: false }
            };

            visualBuilder.updateRenderTimeout(
                dataView,
                async () => {
                    const firstClickPoint: HTMLElement = visualBuilder.slices[visualBuilder.slices.length - 1];
                    const secondClickPoint: HTMLElement = visualBuilder.mainElement[0];
                    d3Click(firstClickPoint, 5, 5);
                    await timeout(DefaultWaitForRender);
                    expect(visualBuilder.element.querySelectorAll(LabelVisibleSelector).length).toBe(1);
                    d3Click(secondClickPoint, 1, 1);
                    await timeout(DefaultWaitForRender);
                    expect(visualBuilder.element.querySelectorAll(LabelVisibleSelector).length).toBe(0);
                    done();
                });
        });

        it("category labels should be visible always", (done: DoneFn) => {
            dataView.metadata.objects = {
                group: { showSelected: true }
            };

            visualBuilder.updateRenderTimeout(
                dataView,
                async () => {
                    const firstClickPoint: HTMLElement = visualBuilder.slices[visualBuilder.slices.length - 1];
                    const secondClickPoint: HTMLElement = visualBuilder.mainElement[0];
                    d3Click(firstClickPoint, 5, 5);
                    await timeout(DefaultWaitForRender);
                    expect(visualBuilder.element.querySelectorAll(LabelVisibleSelector).length).toBe(2);
                    d3Click(secondClickPoint, 1, 1);
                    await timeout(DefaultWaitForRender);
                    expect(visualBuilder.element.querySelectorAll(LabelVisibleSelector).length).toBe(0);
                    done();
                });
        });

        it("data labels should not be hidden by default", (done: DoneFn) => {
            visualBuilder.updateRenderTimeout(
                dataView,
                () => {
                    expect(visualBuilder.element.querySelectorAll(SliceLabelSelector).length).toBe(12);
                    done();
                }, 2, DefaultWaitForRender);
        });

        it("count of data labels should be equal slice count", (done: DoneFn) => {
            dataView.metadata.objects = {
                group: { showDataLabels: true }
            };
            visualBuilder.updateRenderTimeout(
                dataView,
                () => {
                    expect(visualBuilder.element.querySelectorAll(SliceLabelSelector).length).toBe(visualBuilder.slices.length);
                    done();
                }, 2, DefaultWaitForRender);
        });

        it("data label font size should be correct", (done: DoneFn) => {
            const fontSize: number = 22;
            const expectedFontSize: string = "22px";
            dataView.metadata.objects = {
                group: { labelFontSize: fontSize }
            };
            visualBuilder.updateRenderTimeout(
                dataView,
                async () => {
                    const firstClickPoint: HTMLElement = visualBuilder.slices[visualBuilder.slices.length - 1];
                    const secondClickPoint: HTMLElement = visualBuilder.mainElement[0];
                    d3Click(firstClickPoint, 5, 5);
                    await timeout(DefaultWaitForRender);
                    d3Click(secondClickPoint, 1, 1);
                    await timeout(DefaultWaitForRender);
                    expect((<HTMLElement>visualBuilder.element.querySelector(SliceLabelSelector)).style.fontSize).toBe(expectedFontSize);
                    done();
                });
        });

        it("data label font weight should be correct", (done: DoneFn) => {
            const fontWeight: boolean = true;
            const expectedWeight: string = "bold";
            dataView.metadata.objects = {
                group: { labelFontBold: fontWeight }
            };
            visualBuilder.updateRenderTimeout(
                dataView,
                async () => {
                    const firstClickPoint: HTMLElement = visualBuilder.slices[visualBuilder.slices.length - 1];
                    const secondClickPoint: HTMLElement = visualBuilder.mainElement[0];
                    d3Click(firstClickPoint, 5, 5);
                    await timeout(DefaultWaitForRender);
                    d3Click(secondClickPoint, 1, 1);
                    await timeout(DefaultWaitForRender);
                    expect((<HTMLElement>visualBuilder.element.querySelector(SliceLabelSelector)).style.fontWeight).toBe(expectedWeight);
                    done();
                });
        });

        it("data label text decoration should be correct", (done: DoneFn) => {
            const textDecoration: boolean = true;
            const expectedDecoration: string = "underline";
            dataView.metadata.objects = {
                group: { labelFontUnderline: textDecoration }
            };
            visualBuilder.updateRenderTimeout(
                dataView,
                async () => {
                    const firstClickPoint: HTMLElement = visualBuilder.slices[visualBuilder.slices.length - 1];
                    const secondClickPoint: HTMLElement = visualBuilder.mainElement[0];
                    d3Click(firstClickPoint, 5, 5);
                    await timeout(DefaultWaitForRender);
                    d3Click(secondClickPoint, 1, 1);
                    await timeout(DefaultWaitForRender);
                    expect((<HTMLElement>visualBuilder.element.querySelector(SliceLabelSelector)).style.textDecoration).toBe(expectedDecoration);
                    done();
                });
        });

        it("data label font style should be correct", (done: DoneFn) => {
            const fontItalic: boolean = true;
            const expectedStyle: string = "italic";
            dataView.metadata.objects = {
                group: { labelFontItalic: fontItalic }
            };
            visualBuilder.updateRenderTimeout(
                dataView,
                async () => {
                    const firstClickPoint: HTMLElement = visualBuilder.slices[visualBuilder.slices.length - 1];
                    const secondClickPoint: HTMLElement = visualBuilder.mainElement[0];
                    d3Click(firstClickPoint, 5, 5);
                    await timeout(DefaultWaitForRender);
                    d3Click(secondClickPoint, 1, 1);
                    await timeout(DefaultWaitForRender);
                    expect((<HTMLElement>visualBuilder.element.querySelector(SliceLabelSelector)).style.fontStyle).toBe(expectedStyle);
                    done();
                });
        });

        it("label font family should be correct", (done: DoneFn) => {
            const fontFamily: string = "Arial";
            const expectedFamily: string = "Arial";
            dataView.metadata.objects = {
                group: { labelFontFamily: fontFamily }
            };
            visualBuilder.updateRenderTimeout(
                dataView,
                async () => {
                    const firstClickPoint: HTMLElement = visualBuilder.slices[visualBuilder.slices.length - 1];
                    const secondClickPoint: HTMLElement = visualBuilder.mainElement[0];
                    d3Click(firstClickPoint, 5, 5);
                    await timeout(DefaultWaitForRender);
                    d3Click(secondClickPoint, 1, 1);
                    await timeout(DefaultWaitForRender);
                    expect((<HTMLElement>visualBuilder.element.querySelector(SliceLabelSelector)).style.fontFamily).toBe(expectedFamily);
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
            dataView.matrix!.rows.root.children = [];

            visualBuilder.updateRenderTimeout(
                dataView,
                () => {
                    expect(visualBuilder.slices.length).toBe(0);
                    done();
                });
        });
    });

    describe("Legend", () => {
        beforeEach(() => {
            dataView = defaultDataViewBuilder.getDataView(
                [
                    defaultDataViewBuilder.RegionsDataSet,
                    defaultDataViewBuilder.CountriesDataSet
                ]);
        });

        it("legend should be hidden by default", (done: DoneFn) => {
            visualBuilder.updateRenderTimeout(
                dataView,
                () => {
                    expect(visualBuilder.element.querySelectorAll(`${LegendSelector.trim()}>*`).length).toBe(0);
                    done();
                }, 2, DefaultWaitForRender);
        });
        it("legend should be shown", (done: DoneFn) => {
            dataView.metadata.objects = {
                legend: { show: true }
            };
            visualBuilder.updateRenderTimeout(
                dataView,
                () => {
                    expect(visualBuilder.element.querySelectorAll(`${LegendSelector.trim()}>*`).length).toBeTruthy();
                    done();
                }, 2, DefaultWaitForRender);
        });
        it("legend font family should be correct", (done: DoneFn) => {
            const fontFamily: string = "Arial";
            const expectedFamily: string = "Arial";
            dataView.metadata.objects = {
                legend: { show: true, fontFamily: fontFamily }
            };
            visualBuilder.updateRenderTimeout(
                dataView,
                async () => {
                    const firstClickPoint: HTMLElement = visualBuilder.slices[visualBuilder.slices.length - 1];
                    const secondClickPoint: HTMLElement = visualBuilder.mainElement[0];
                    d3Click(firstClickPoint, 5, 5);
                    await timeout(DefaultWaitForRender);
                    d3Click(secondClickPoint, 1, 1);
                    await timeout(DefaultWaitForRender);
                    for (const element of visualBuilder.element.querySelectorAll(`${LegendSelector.trim()} text`)) {
                        expect((<HTMLElement>element).style.fontFamily).toBe(expectedFamily);
                    }
                    done();
                });
        });
        it("legend font size should be correct", (done: DoneFn) => {
            const fontSize: number = 22;
            const expectedSize: string = Math.round(fontSize * 4 / 3 * 10000) / 10000 + "px";
            dataView.metadata.objects = {
                legend: { show: true, fontSize: fontSize }
            };
            visualBuilder.updateRenderTimeout(
                dataView,
                async () => {
                    const firstClickPoint: HTMLElement = visualBuilder.slices[visualBuilder.slices.length - 1];
                    const secondClickPoint: HTMLElement = visualBuilder.mainElement[0];
                    d3Click(firstClickPoint, 5, 5);
                    await timeout(DefaultWaitForRender);
                    d3Click(secondClickPoint, 1, 1);
                    await timeout(DefaultWaitForRender);
                    for (const element of visualBuilder.element.querySelectorAll(`${LegendSelector.trim()} text`)) {
                        expect((<HTMLElement>element).style.fontSize).toBe(expectedSize);
                    }
                    done();
                });
        });
    });

    describe("Central caption", () => {
        beforeEach(() => {
            dataView = defaultDataViewBuilder.getDataView(
                [
                    defaultDataViewBuilder.RegionsDataSet,
                    defaultDataViewBuilder.CountriesDataSet
                ]);
        });

        it("percentage font size should be correct", (done: DoneFn) => {
            dataView.metadata.objects = {
                group: { showSelected: false }
            };

            visualBuilder.updateRenderTimeout(
                dataView,
                async () => {
                    const firstClickPoint: HTMLElement = visualBuilder.slices[visualBuilder.slices.length - 1];
                    const secondClickPoint: HTMLElement = visualBuilder.mainElement[0];
                    d3Click(firstClickPoint, 5, 5);
                    await timeout(DefaultWaitForRender);
                    expect(visualBuilder.element.querySelectorAll(LabelVisibleSelector).length).toBe(1);
                    d3Click(secondClickPoint, 1, 1);
                    await timeout(DefaultWaitForRender);
                    expect((<HTMLElement>visualBuilder.element.querySelector(PercentageSelector)).style['font-size']).toBe("28px");
                    done();
                });
        });

        it("label font size should be correct", (done: DoneFn) => {
            const fontSize: number = 22;
            const expectedFontSize: string = "44px";
            dataView.metadata.objects = {
                group: { fontSize: fontSize }
            };
            visualBuilder.updateRenderTimeout(
                dataView,
                async () => {
                    const firstClickPoint: HTMLElement = visualBuilder.slices[visualBuilder.slices.length - 1];
                    const secondClickPoint: HTMLElement = visualBuilder.mainElement[0];
                    d3Click(firstClickPoint, 5, 5);
                    await timeout(DefaultWaitForRender);
                    d3Click(secondClickPoint, 1, 1);
                    await timeout(DefaultWaitForRender);
                    expect((<HTMLElement>visualBuilder.element.querySelector(PercentageSelector)).style.fontSize).toBe(expectedFontSize);
                    done();
                });
        });

        it("label font weight should be correct", (done: DoneFn) => {
            const fontWeight: boolean = true;
            const expectedWeight: string = "bold";
            dataView.metadata.objects = {
                group: { fontBold: fontWeight }
            };
            visualBuilder.updateRenderTimeout(
                dataView,
                async () => {
                    const firstClickPoint: HTMLElement = visualBuilder.slices[visualBuilder.slices.length - 1];
                    const secondClickPoint: HTMLElement = visualBuilder.mainElement[0];
                    d3Click(firstClickPoint, 5, 5);
                    await timeout(DefaultWaitForRender);
                    d3Click(secondClickPoint, 1, 1);
                    await timeout(DefaultWaitForRender);
                    expect((<HTMLElement>visualBuilder.element.querySelector(CategoryLabelSelector)).style.fontWeight).toBe(expectedWeight);
                    done();
                });
        });

        it("label text decoration should be correct", (done: DoneFn) => {
            const textDecoration: boolean = true;
            const expectedDecoration: string = "underline";
            dataView.metadata.objects = {
                group: { fontUnderline: textDecoration }
            };
            visualBuilder.updateRenderTimeout(
                dataView,
                async () => {
                    const firstClickPoint: HTMLElement = visualBuilder.slices[visualBuilder.slices.length - 1];
                    const secondClickPoint: HTMLElement = visualBuilder.mainElement[0];
                    d3Click(firstClickPoint, 5, 5);
                    await timeout(DefaultWaitForRender);
                    d3Click(secondClickPoint, 1, 1);
                    await timeout(DefaultWaitForRender);
                    expect((<HTMLElement>visualBuilder.element.querySelector(CategoryLabelSelector)).style.textDecoration).toBe(expectedDecoration);
                    done();
                });
        });

        it("label font style should be correct", (done: DoneFn) => {
            const fontItalic: boolean = true;
            const expectedStyle: string = "italic";
            dataView.metadata.objects = {
                group: { fontItalic: fontItalic }
            };
            visualBuilder.updateRenderTimeout(
                dataView,
                async () => {
                    const firstClickPoint: HTMLElement = visualBuilder.slices[visualBuilder.slices.length - 1];
                    const secondClickPoint: HTMLElement = visualBuilder.mainElement[0];
                    d3Click(firstClickPoint, 5, 5);
                    await timeout(DefaultWaitForRender);
                    d3Click(secondClickPoint, 1, 1);
                    await timeout(DefaultWaitForRender);
                    expect((<HTMLElement>visualBuilder.element.querySelector(CategoryLabelSelector)).style.fontStyle).toBe(expectedStyle);
                    done();
                });
        });

        it("label font family should be correct", (done: DoneFn) => {
            const fontFamily: string = "Arial";
            const expectedFamily: string = "Arial";
            dataView.metadata.objects = {
                group: { fontFamily: fontFamily }
            };
            visualBuilder.updateRenderTimeout(
                dataView,
                async () => {
                    const firstClickPoint: HTMLElement = visualBuilder.slices[visualBuilder.slices.length - 1];
                    const secondClickPoint: HTMLElement = visualBuilder.mainElement[0];
                    d3Click(firstClickPoint, 5, 5);
                    await timeout(DefaultWaitForRender);
                    d3Click(secondClickPoint, 1, 1);
                    await timeout(DefaultWaitForRender);
                    expect((<HTMLElement>visualBuilder.element.querySelector(CategoryLabelSelector)).style.fontFamily).toBe(expectedFamily);
                    done();
                });
        });
    });

    describe("Colors", () => {
        beforeEach(() => {
            dataView = defaultDataViewBuilder.getDataView(
                [
                    defaultDataViewBuilder.RegionsDataSet,
                    defaultDataViewBuilder.CountriesDataSet
                ]);
        });
        it("should be parsed correctly", (done: DoneFn) => {
            const color: string = "#006400";
            dataView.matrix!.rows.root.children![0].objects = {
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
                    const result: powerbiVisualsApi.visuals.FormattingModel = visualBuilder.instance.getFormattingModel();
                    const visual_card: powerbiVisualsApi.visuals.FormattingCard = <powerbiVisualsApi.visuals.FormattingCard>result.cards[0];
                    const group_group: powerbiVisualsApi.visuals.FormattingGroup = <powerbiVisualsApi.visuals.FormattingGroup>visual_card.groups[0];
                    const group_slices: powerbiVisualsApi.visuals.FormattingSlice[] = <powerbiVisualsApi.visuals.FormattingSlice[]>group_group.slices;
                    const colorExist: boolean = group_slices.some((slice: powerbiVisualsApi.visuals.FormattingSlice) =>
                        (<any>slice).control?.properties?.value?.value === color
                    );
                    expect(colorExist).toBeTruthy();
                    done();
                }, 2, DefaultWaitForRender);
        });

        it("should be displayed correctly", (done: DoneFn) => {
            const color: string = "#006400";
            const colorAsRGB: string = "rgb(0, 100, 0)";

            dataView.matrix!.rows.root.children![0].objects = {
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
                    const elements: HTMLElement[] = Array.from(visualBuilder.slices).filter(element => {
                        const appliedColor: string = element.style.fill;

                        return appliedColor === colorAsRGB;
                    });

                    expect(elements.length).toBeTruthy();

                    done();
                }, 2, DefaultWaitForRender);
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
                },
                2,
                DefaultWaitForRender
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

        describe("keyboard navigation and related aria-attributes", () => {
            let originalTimeout;

            beforeEach(() => {
                originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
                jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
                dataView = defaultDataViewBuilder.getDataView([
                    defaultDataViewBuilder.RegionsDataSet,
                    defaultDataViewBuilder.CountriesDataSet,
                ]);
            });

            it("should have role=listbox and aria-multiselectable attributes correctly set", (done) => {
                visualBuilder.updateRenderTimeout(dataView, () => {
                    const gElement: HTMLElement = visualBuilder.element.firstChild?.firstChild?.firstChild as HTMLElement;

                    expect(gElement.getAttribute("role")).toBe("listbox");
                    expect(gElement.getAttribute("aria-multiselectable")).toBe("true");

                    done();
                }, DefaultWaitForRender);
            });

            it("should have tabindex, role=option, aria-label, and aria=selected correctly initialized", (done) => {
                visualBuilder.updateRenderTimeout(dataView, () => {
                    const slices = visualBuilder.slices;
                    const [, ...categoryLabels] = JSON.stringify(dataView.matrix?.rows.root.children).split('"levelValues":[{"value":"').map((x: string) => x.replace("\\\"", "~").split('"')[0].replace("~", "\\\""));
                    for (let i = 0; i < slices.length; i++) {
                        const slice = slices[i];
                        expect(slice.getAttribute("tabindex")).toBe("0");
                        expect(slice.getAttribute("role")).toBe("option");
                        expect(categoryLabels).toContain(slice.getAttribute("aria-label")!);
                        expect(slice.getAttribute("aria-selected")).toBe("false");
                    }

                    done();
                }, DefaultWaitForRender);
            });

            it("should have role=presentation correctly set on text labels", (done) => {
                visualBuilder.updateRenderTimeout(dataView, () => {
                    const gElement: HTMLElement = visualBuilder.element.firstChild?.firstChild?.firstChild as HTMLElement;
                    const slices: NodeListOf<SVGPathElement> = gElement.querySelectorAll(SliceLabelSelector);
                    for (const slice of slices) { 
                        expect(slice.getAttribute("role")).toBe("presentation");
                    }

                    done();
                }, DefaultWaitForRender);
            });

            it("aria attributs work when clicked", (done: DoneFn) => {
                visualBuilder.updateRenderTimeout(dataView, async () => {
                    d3Click(visualBuilder.slices[0], 5, 5);
                    await timeout(DefaultWaitForRender);
                    expect(visualBuilder.slices[0].getAttribute("aria-selected")).toBe("true");
                    expect(visualBuilder.slices[0].style.opacity).toBe("1");
                    for (const slice of visualBuilder.slices) {
                        if (slice !== visualBuilder.slices[0]) {
                            expect(slice.getAttribute("aria-selected")).toBe("false");
                            expect(slice.style.opacity).toBe("0.2");
                        }
                    }

                    done();
                });
            });

            it("enter toggles the correct slice", (done: DoneFn) => {
                const enterEvent = new KeyboardEvent("keydown", { code: "Enter", bubbles: true });
                visualBuilder.updateRenderTimeout(
                    dataView,
                    async () => {
                        visualBuilder.slices[0].dispatchEvent(enterEvent);
                        await timeout(DefaultWaitForRender);
                        expect(visualBuilder.slices[0].getAttribute("aria-selected")).toBe("true");
                        expect(visualBuilder.slices[0].style.opacity).toBe("1");
                        for (const slice of visualBuilder.slices) {
                            if (slice !== visualBuilder.slices[0]) {
                                expect(slice.getAttribute("aria-selected")).toBe("false");
                                expect(slice.style.opacity).toBe("0.2");
                            }
                        }

                        visualBuilder.slices[0].dispatchEvent(enterEvent);
                        await timeout(DefaultWaitForRender);
                        for (const slice of visualBuilder.slices) {
                            expect(slice.getAttribute("aria-selected")).toBe("false");
                            expect(slice.style.opacity).toBe("1");
                        }

                        done();
                    },
                    2,
                    DefaultWaitForRender);
            });

            it("space toggles the correct slice", (done: DoneFn) => {
                const spaceEvent = new KeyboardEvent("keydown", { code: "Space", bubbles: true });
                visualBuilder.updateRenderTimeout(
                    dataView,
                    async () => {
                        visualBuilder.slices[0].dispatchEvent(spaceEvent);
                        await timeout(DefaultWaitForRender);
                        expect(visualBuilder.slices[0].getAttribute("aria-selected")).toBe("true");
                        expect(visualBuilder.slices[0].style.opacity).toBe("1");
                        for (const slice of visualBuilder.slices) {
                            if (slice !== visualBuilder.slices[0]) {
                                expect(slice.getAttribute("aria-selected")).toBe("false");
                                expect(slice.style.opacity).toBe("0.2");
                            }
                        }

                        visualBuilder.slices[0].dispatchEvent(spaceEvent);
                        await timeout(DefaultWaitForRender);
                        for (const slice of visualBuilder.slices) {
                            expect(slice.getAttribute("aria-selected")).toBe("false");
                            expect(slice.style.opacity).toBe("1");
                        }

                        done();
                    },
                    2,
                    DefaultWaitForRender);
            });

            it("tab between slices works", (done: DoneFn) => {
                const tabEvent = new KeyboardEvent("keydown", { code: "Tab", bubbles: true });
                const enterEvent = new KeyboardEvent("keydown", { code: "Enter", bubbles: true });
                visualBuilder.updateRenderTimeout(
                    dataView,
                    async () => {
                        visualBuilder.slices[0].dispatchEvent(enterEvent);
                        await timeout(DefaultWaitForRender);
                        expect(visualBuilder.slices[0].getAttribute("aria-selected")).toBe("true");
                        expect(visualBuilder.slices[0].style.opacity).toBe("1");
                        for (const slice of visualBuilder.slices) {
                            if (slice !== visualBuilder.slices[0]) {
                                expect(slice.getAttribute("aria-selected")).toBe("false");
                                expect(slice.style.opacity).toBe("0.2");
                            }
                        }

                        visualBuilder.element.dispatchEvent(tabEvent);
                        await timeout(DefaultWaitForRender);

                        visualBuilder.slices[1].dispatchEvent(enterEvent);
                        await timeout(DefaultWaitForRender);
                        expect(visualBuilder.slices[1].getAttribute("aria-selected")).toBe("true");
                        expect(visualBuilder.slices[1].style.opacity).toBe("1");
                        for (const slice of visualBuilder.slices) {
                            if (slice !== visualBuilder.slices[1]) {
                                expect(slice.getAttribute("aria-selected")).toBe("false");
                                expect(slice.style.opacity).toBe("0.2");
                            }
                        }

                        done();
                    },
                    2,
                    DefaultWaitForRender);
            });

            afterEach(() => {
                jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
            });
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
                    // @ts-ignore
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

function timeout(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}