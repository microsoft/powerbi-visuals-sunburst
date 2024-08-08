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
import { ClickEventType, assertColorsMatch, d3Click, renderTimeout } from "powerbi-visuals-utils-testutils";
import { VisualData } from "./visualData";
import { VisualBuilder } from "./visualBuilder";
import { SunburstDataPoint } from "../src/dataInterfaces";
import { SunburstSettings } from "../src/SunburstSettings";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import FormattingSettingsSlice = formattingSettings.Slice;

const DefaultWaitForRender: number = 500;
const LegendSelector: string = "#legendGroup";
const LabelVisibleClass: string = "sunburst__label--visible";

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
                    DefaultWaitForRender);
            },
            DefaultWaitForRender);
    });

    describe("Labels", () => {
        describe("category and percentage labels", () => {
            beforeEach(() => {
                dataView = defaultDataViewBuilder.getDataView(
                    [
                        defaultDataViewBuilder.RegionsDataSet,
                        defaultDataViewBuilder.CountriesDataSet,
                        defaultDataViewBuilder.StatesDataSet
                    ], false);
            });

            it("should NOT be visible when no element is selected", (done: DoneFn) => {
                visualBuilder.updateRenderTimeout(dataView, () => {
                    expect(visualBuilder.visibleCategoryLabels?.length).toBe(0);
                    expect(visualBuilder.categoryLabel.classList.contains(LabelVisibleClass)).toBeFalse();
                    expect(visualBuilder.percentageLabel.classList.contains(LabelVisibleClass)).toBeFalse();
                    done();
                });
            });

            it("should be visible when 1 element is selected", (done: DoneFn) => {    
                visualBuilder.updateRenderTimeout(dataView, () => {
                    visualBuilder.sliceClick("ALABAMA");
                        renderTimeout(() => {
                            expect(visualBuilder.visibleCategoryLabels?.length).toBe(2);
                            expect(visualBuilder.categoryLabel.classList.contains(LabelVisibleClass)).toBeTrue();
                            expect(visualBuilder.percentageLabel.classList.contains(LabelVisibleClass)).toBeTrue();
                            done();

                    }, DefaultWaitForRender);
                });
            });

            it("should NOT be visible when 1 element is selected and showSelected settings = false", (done: DoneFn) => {    
                dataView.metadata.objects = {
                    centralLabel: { showSelected: false }
                };
                visualBuilder.updateRenderTimeout(dataView, () => {
                    visualBuilder.sliceClick("ALABAMA");
                        renderTimeout(() => {
                            expect(visualBuilder.visibleCategoryLabels?.length).toBe(1);
                            expect(visualBuilder.categoryLabel.classList.contains(LabelVisibleClass)).toBeFalse();
                            expect(visualBuilder.percentageLabel.classList.contains(LabelVisibleClass)).toBeTrue();
                            done();

                    }, DefaultWaitForRender);
                });
            });

            it("should not be visible when >1 elements are selected", (done: DoneFn) => {    
                visualBuilder.updateRenderTimeout(dataView, () => {
                    visualBuilder.sliceClick("ALABAMA");
                    visualBuilder.sliceClick("ALASKA", ClickEventType.CtrlKey);
                        renderTimeout(() => {
                            const percent: string | null = visualBuilder.percentageLabel.textContent;

                            expect(percent).toBe("41.67%");
                            expect(visualBuilder.visibleCategoryLabels?.length).toBe(1);
                            expect(visualBuilder.categoryLabel.classList.contains(LabelVisibleClass)).toBeFalse();
                            expect(visualBuilder.percentageLabel.classList.contains(LabelVisibleClass)).toBeTrue();

                            done();
                    }, DefaultWaitForRender);
                });
            });

            describe("percentage label", () => {
                it("should display percent of selected slice", (done: DoneFn) => {    
                    visualBuilder.updateRenderTimeout(dataView, () => {
                        visualBuilder.sliceClick("ALABAMA");
                            renderTimeout(() => {
                                const percent: string | null = visualBuilder.percentageLabel.textContent;
                                expect(percent).toBe("19.44%");
                                done();
                        }, DefaultWaitForRender);
                    });
                });

                it("should display sum of percentage of all selected slices", (done: DoneFn) => {    
                    visualBuilder.updateRenderTimeout(dataView, () => {
                        visualBuilder.sliceClick("ALABAMA");
                        visualBuilder.sliceClick("ALASKA", ClickEventType.CtrlKey);
                            renderTimeout(() => {
                                const percent: string | null = visualBuilder.percentageLabel.textContent;
                                expect(percent).toBe("41.67%");
                                done();
                        }, DefaultWaitForRender);
                    });
                });

                it("should display percentage of selected parent slice", (done: DoneFn) => {    
                    visualBuilder.updateRenderTimeout(dataView, () => {
                        visualBuilder.sliceClick("ALABAMA");
                        visualBuilder.sliceClick("Europe", ClickEventType.CtrlKey);
                        visualBuilder.sliceClick("ALASKA", ClickEventType.CtrlKey);
                            renderTimeout(() => {
                                const percent: string | null = visualBuilder.percentageLabel.textContent;
                                expect(percent).toBe("72.22%");
                                done();
                        }, DefaultWaitForRender);
                    });
                });
            })
        });

        describe("Data labels", () => {
            beforeEach(() => {
                dataView = defaultDataViewBuilder.getDataView(
                    [
                        defaultDataViewBuilder.RegionsDataSet,
                        defaultDataViewBuilder.CountriesDataSet
                    ]);
            });

            it("should be visible by default", (done: DoneFn) => {
                visualBuilder.updateRenderTimeout(dataView, () => {
                    expect(visualBuilder.dataLabels.length).toBe(12);
                    done();
                }, DefaultWaitForRender);
            });
    
            it("count should be equal slice count", (done: DoneFn) => {
                visualBuilder.updateRenderTimeout(dataView, () => {
                    expect(visualBuilder.dataLabels.length).toBe(visualBuilder.slices.length);
                    done();
                }, DefaultWaitForRender);
            });
    
            it("font weight should be correct", (done: DoneFn) => {
                const fontWeight: boolean = true;
                const expectedWeight: string = "bold";
                dataView.metadata.objects = {
                    group: { labelFontBold: fontWeight }
                };
                visualBuilder.updateRenderTimeout(dataView, () => {
                    const dataLabels: HTMLElement[] = visualBuilder.dataLabels;
                    dataLabels.forEach((element: HTMLElement) => {
                        expect(element.style.fontWeight).toBe(expectedWeight);
                    });
                    done();
                });
            });
    
            it("text decoration should be correct", (done: DoneFn) => {
                const textDecoration: boolean = true;
                const expectedDecoration: string = "underline";
                dataView.metadata.objects = {
                    group: { labelFontUnderline: textDecoration }
                };
                visualBuilder.updateRenderTimeout(dataView, () => {
                    const dataLabels: HTMLElement[] = visualBuilder.dataLabels;
                    dataLabels.forEach((element: HTMLElement) => {
                        expect(element.style.textDecoration).toBe(expectedDecoration);
                    });
                    done();
                });
            });
    
            it("font style should be correct", (done: DoneFn) => {
                const fontItalic: boolean = true;
                const expectedStyle: string = "italic";
                dataView.metadata.objects = {
                    group: { labelFontItalic: fontItalic }
                };
                visualBuilder.updateRenderTimeout(dataView, () => {
                    const dataLabels: HTMLElement[] = visualBuilder.dataLabels;
                    dataLabels.forEach((element: HTMLElement) => {
                        expect(element.style.fontStyle).toBe(expectedStyle);
                    });
                    done();
                });
            });
    
            it("font family should be correct", (done: DoneFn) => {
                const fontFamily: string = "Arial";
                const expectedFamily: string = "Arial";
                dataView.metadata.objects = {
                    group: { labelFontFamily: fontFamily }
                };
                visualBuilder.updateRenderTimeout(dataView, () => {
                    const dataLabels: HTMLElement[] = visualBuilder.dataLabels;
                    dataLabels.forEach((element: HTMLElement) => {
                        expect(element.style.fontFamily).toBe(expectedFamily);
                    });
                    done();
                });
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
                }, DefaultWaitForRender);
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
                }, DefaultWaitForRender);
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
                centralLabel: { showSelected: false }
            };

            visualBuilder.updateRenderTimeout(dataView, () => {
                const firstSlice: HTMLElement = visualBuilder.slices[0];
                d3Click(firstSlice, 5, 5);

                renderTimeout(() => {
                    expect(visualBuilder.visibleCategoryLabels.length).toBe(1);
                    expect(visualBuilder.percentageLabel.classList.contains(LabelVisibleClass)).toBeTrue();

                    expect(visualBuilder.percentageLabel.style.fontSize).toBe("28px");
                    done();
                });
            });
        });

        it("percentage label font size should be correct", (done: DoneFn) => {
            const fontSize: number = 22;
            const expectedFontSize: string = "44px";
            dataView.metadata.objects = {
                centralLabel: { fontSize: fontSize }
            };
            visualBuilder.updateRenderTimeout(dataView, () => {
                const firstSlice: HTMLElement = visualBuilder.slices[0];
                d3Click(firstSlice, 5, 5);

                renderTimeout(() => {
                    expect(visualBuilder.percentageLabel.style.fontSize).toBe(expectedFontSize);
                    done();
                });
            });
        });

        it("label font weight should be correct", (done: DoneFn) => {
            const fontWeight: boolean = true;
            const expectedWeight: string = "bold";
            dataView.metadata.objects = {
                centralLabel: { fontBold: fontWeight }
            };
            visualBuilder.updateRenderTimeout(dataView, () => {
                const firstSlice: HTMLElement = visualBuilder.slices[0];
                d3Click(firstSlice, 5, 5);

                renderTimeout(() => {
                    expect(visualBuilder.categoryLabel.style.fontWeight).toBe(expectedWeight);
                    done();
                });
            });
        });

        it("label text decoration should be correct", (done: DoneFn) => {
            const textDecoration: boolean = true;
            const expectedDecoration: string = "underline";
            dataView.metadata.objects = {
                centralLabel: { fontUnderline: textDecoration }
            };
            visualBuilder.updateRenderTimeout(dataView, () => {
                const firstSlice: HTMLElement = visualBuilder.slices[0];
                d3Click(firstSlice, 5, 5);

                renderTimeout(() => {
                    expect(visualBuilder.categoryLabel.style.textDecoration).toBe(expectedDecoration);
                    done();
                });
            });
        });

        it("label font style should be correct", (done: DoneFn) => {
            const fontItalic: boolean = true;
            const expectedStyle: string = "italic";
            dataView.metadata.objects = {
                centralLabel: { fontItalic: fontItalic }
            };
            visualBuilder.updateRenderTimeout(dataView, () => {
                const firstSlice: HTMLElement = visualBuilder.slices[0];
                d3Click(firstSlice, 5, 5);

                renderTimeout(() => {
                    expect(visualBuilder.categoryLabel.style.fontStyle).toBe(expectedStyle);
                    done();
                });
            });
        });

        it("label font family should be correct", (done: DoneFn) => {
            const fontFamily: string = "Arial";
            const expectedFamily: string = "Arial";
            dataView.metadata.objects = {
                centralLabel: { fontFamily: fontFamily }
            };
            visualBuilder.updateRenderTimeout(dataView, () => {
                const firstSlice: HTMLElement = visualBuilder.slices[0];
                d3Click(firstSlice, 5, 5);

                renderTimeout(() => {
                    expect(visualBuilder.categoryLabel.style.fontFamily).toBe(expectedFamily);
                    done();
                });
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
                    const settings: SunburstSettings = visualBuilder.instance.settings;
                    const colorsGroup = settings.group.colors;
                
                    const colorExist: boolean = colorsGroup.slices.some((slice: FormattingSettingsSlice) =>
                        (<any>slice).value.value === color
                    );
                    expect(colorExist).toBeTruthy();
                    done();
                }, DefaultWaitForRender);
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
                }, DefaultWaitForRender);
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

        describe("Keyboard navigation and related aria-attributes tests:", () => {
            let dataViewKN: DataView;

            beforeEach(() => {
                dataViewKN = defaultDataViewBuilder.getDataView(
                    [
                        defaultDataViewBuilder.RegionsDataSet,
                        defaultDataViewBuilder.CountriesDataSet,
                        defaultDataViewBuilder.StatesDataSet
                    ], false);
            });

            it("should have role=listbox and aria-multiselectable attributes correctly set", (done) => {
                visualBuilder.updateRenderTimeout(dataViewKN, () => {
                    const gElement: HTMLElement = visualBuilder.element.firstChild?.firstChild?.firstChild as HTMLElement;

                    expect(gElement.getAttribute("role")).toBe("listbox");
                    expect(gElement.getAttribute("aria-multiselectable")).toBe("true");

                    done();
                }, DefaultWaitForRender);
            });

            it("should have role=presentation correctly set on text labels", (done) => {
                visualBuilder.updateRenderTimeout(dataViewKN, () => {

                    const dataLabels: HTMLElement[] = visualBuilder.dataLabels;
                    for (const label of dataLabels) { 
                        expect(label.getAttribute("role")).toBe("presentation");
                    }

                    done();
                }, DefaultWaitForRender);
            });

            it("enter toggles the correct slice", () => {
                const enterEvent = new KeyboardEvent("keydown", { code: "Enter", bubbles: true });
                checkKeyboardSingleSelection(enterEvent);
            });

            it("space toggles the correct slice", () => {
                const spaceEvent = new KeyboardEvent("keydown", { code: "Space", bubbles: true });
                checkKeyboardSingleSelection(spaceEvent);
            });

            it("multiselection should work with ctrlKey", () => {
                const enterEventCtrlKey = new KeyboardEvent("keydown", { code: "Enter", bubbles: true, ctrlKey: true });
                checkKeyboardMultiSelection(enterEventCtrlKey);
            });

            it("multiselection should work with metaKey", () => {
                const enterEventMetaKey = new KeyboardEvent("keydown", { code: "Enter", bubbles: true, metaKey: true });
                checkKeyboardMultiSelection(enterEventMetaKey);
            });

            it("multiselection should work with shiftKey", () => {
                const enterEventShiftKey = new KeyboardEvent("keydown", { code: "Enter", bubbles: true, shiftKey: true });
                checkKeyboardMultiSelection(enterEventShiftKey);
            });

            it("slice can be focused", () => {
                visualBuilder.updateFlushAllD3Transitions(dataViewKN);

                const slices: HTMLElement[] = Array.from(visualBuilder.slices);
                const firstSlice: HTMLElement = slices[0];

                slices.forEach((slice: HTMLElement) => {
                    expect(slice.matches(":focus-visible")).toBeFalse();
                });

                firstSlice.focus();
                expect(firstSlice.matches(':focus-visible')).toBeTrue();

                const otherSlices: HTMLElement[] = slices.slice(1);
                otherSlices.forEach((slice: HTMLElement) => {
                    expect(slice.matches(":focus-visible")).toBeFalse();
                });

            });

            function checkKeyboardSingleSelection(keyboardSingleSelectionEvent: KeyboardEvent): void {
                visualBuilder.updateFlushAllD3Transitions(dataViewKN);
                const slices: HTMLElement[] = Array.from(visualBuilder.slices);
                const firstSlice: HTMLElement = slices[0];
                const secondSlice: HTMLElement = slices[1];

                firstSlice.dispatchEvent(keyboardSingleSelectionEvent);
                expect(firstSlice.getAttribute("aria-selected")).toBe("true");

                const otherSlices: HTMLElement[] = slices.slice(1);
                otherSlices.forEach((slice: HTMLElement) => {
                    expect(slice.getAttribute("aria-selected")).toBe("false");
                });

                secondSlice.dispatchEvent(keyboardSingleSelectionEvent);
                expect(secondSlice.getAttribute("aria-selected")).toBe("true");

                slices.splice(1, 1);
                slices.forEach((slice: HTMLElement) => {
                    expect(slice.getAttribute("aria-selected")).toBe("false");
                }
                );
            }

            function checkKeyboardMultiSelection(keyboardMultiselectionEvent: KeyboardEvent): void {
                visualBuilder.updateFlushAllD3Transitions(dataViewKN);
                const enterEvent = new KeyboardEvent("keydown", { code: "Enter", bubbles: true });
                const slices: HTMLElement[] = Array.from(visualBuilder.slices);
                const firstSlice: HTMLElement = slices[0];
                const secondSlice: HTMLElement = slices[1];

                // select first slice
                firstSlice.dispatchEvent(enterEvent);
                const firstSliceOpacity: string = firstSlice.style.getPropertyValue("opacity");
                // multiselect second slice
                secondSlice.dispatchEvent(keyboardMultiselectionEvent);
                const secondSliceOpacity: string = secondSlice.style.getPropertyValue("opacity");

                expect(firstSlice.getAttribute("aria-selected")).toBe("true");
                expect(parseFloat(firstSliceOpacity)).toBe(1);

                expect(secondSlice.getAttribute("aria-selected")).toBe("true");
                expect(parseFloat(secondSliceOpacity)).toBe(1);

                const notSelectedSlices: HTMLElement[] = slices.slice(2);
                notSelectedSlices.forEach((slice: HTMLElement) => {
                    const sliceOpacity: string = slice.style.getPropertyValue("opacity");
                    expect(parseFloat(sliceOpacity)).toBeLessThan(1);
                    expect(slice.getAttribute("aria-selected")).toBe("false");
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

    describe("Selection tests", () => {
        let dataViewSelection: DataView;
        beforeEach(() => {
            dataViewSelection = defaultDataViewBuilder.getDataView(
                [
                    defaultDataViewBuilder.RegionsDataSet,
                    defaultDataViewBuilder.CountriesDataSet,
                    defaultDataViewBuilder.StatesDataSet
                ], false);
        });

        it("slice can be selected", (done) => {
            visualBuilder.updateRenderTimeout(dataViewSelection, () => {
                visualBuilder.sliceClick("ALABAMA");

                renderTimeout(() => {
                    expect(visualBuilder.selectedSlices?.length).toBe(1);
                    done();
                });
            }, DefaultWaitForRender);
        });

        it("slice can be deselected", (done) => {
            visualBuilder.updateRenderTimeout(dataViewSelection, () => {
                visualBuilder.sliceClick("ALABAMA");

                renderTimeout(() => {
                    expect(visualBuilder.selectedSlices?.length).toBe(1);
                    visualBuilder.sliceClick("ALABAMA", ClickEventType.CtrlKey);

                    renderTimeout(() => {
                        expect(visualBuilder.selectedSlices?.length).toBe(14);

                        done();
                    });
                });
            }, DefaultWaitForRender);
        });

        it("multi-selection should work with ctrlKey", (done) => {
            visualBuilder.updateRenderTimeout(dataViewSelection, () => {
                checkMultiselection(ClickEventType.CtrlKey, done);
            }, DefaultWaitForRender);
        });

        it("multi-selection should work with metaKey", (done) => {
            visualBuilder.updateRenderTimeout(dataViewSelection, () => {
                checkMultiselection(ClickEventType.MetaKey, done);
            }, DefaultWaitForRender);
        });

        it("multi-selection should work with shiftKey", (done) => {
            visualBuilder.updateRenderTimeout(dataViewSelection, () => {
                checkMultiselection(ClickEventType.ShiftKey, done);
            }, DefaultWaitForRender);
        });

        function checkMultiselection(eventType: number, done: DoneFn): void {
            visualBuilder.sliceClick("ALABAMA");
            renderTimeout(() => {
                expect(visualBuilder.selectedSlices?.length).toBe(1);

                visualBuilder.sliceClick("ALASKA", eventType);
                renderTimeout(() => {
                    expect(visualBuilder.selectedSlices?.length).toBe(2);
                    done();
                });
            });
        }
    });
});

function timeout(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}