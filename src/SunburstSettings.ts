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

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

import FormattingSettingsCard = formattingSettings.Card;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;

import { SunburstDataPoint } from "./dataInterfaces";
import powerbiVisualsApi from "powerbi-visuals-api";
import ISelectionId = powerbiVisualsApi.visuals.ISelectionId;

class SunburstGroupSettings extends FormattingSettingsCard {
    public defaultShowSelected: boolean = true;
    public defaultFontSize: number = 14;
    public defaultFontFamily: string = "wf_standard-font, helvetica, arial, sans-serif";
    public defaultFontBold: boolean = false;
    public defaultFontItalic: boolean = false;
    public defaultFontUnderline: boolean = false;

    public defaultShowDataLabels: boolean = true;
    public defaultLabelFontSize: number = 14;
    public defaultLabelFontFamily: string = "wf_standard-font, helvetica, arial, sans-serif";
    public defaultLabelFontBold: boolean = false;
    public defaultLabelFontItalic: boolean = false;
    public defaultLabelFontUnderline: boolean = false;

    public name: string = "group";
    public displayNameKey: string = "Visual_Groups";
    public analyticsPane: boolean = false;

    public showSelected = new formattingSettings.ToggleSwitch({
        name: "showSelected",
        displayNameKey: "Visual_ShowCategoryLabel",
        value: this.defaultShowSelected,
    });

    public selectedFont = new formattingSettings.FontControl({
        name: "fontControl",
        displayNameKey: "Visual_CategoryFontControl",
        fontFamily: new formattingSettings.FontPicker({
            name: "fontFamily",
            displayNameKey: "Visual_FontFamily",
            value: this.defaultFontFamily,
        }),
        fontSize: new formattingSettings.NumUpDown({
            name: "fontSize",
            displayNameKey: "Visual_FontSize",
            value: this.defaultFontSize,
            options: {
                minValue: {
                    type: powerbi.visuals.ValidatorType.Min,
                    value: 1
                },
                maxValue: {
                    type: powerbi.visuals.ValidatorType.Max,
                    value: 100
                },
            }
        }),
        bold: new formattingSettings.ToggleSwitch({
            name: "fontBold",
            displayNameKey: "Visual_Bold",
            value: this.defaultFontBold,
        }),
        italic: new formattingSettings.ToggleSwitch({
            name: "fontItalic",
            displayNameKey: "Visual_Italic",
            value: this.defaultFontItalic,
        }),
        underline: new formattingSettings.ToggleSwitch({
            name: "fontUnderline",
            displayNameKey: "Visual_Underline",
            value: this.defaultFontUnderline,
        }),
    });

    public showDataLabels = new formattingSettings.ToggleSwitch({
        name: "showDataLabels",
        displayNameKey: "Visual_ShowDataLabels",
        value: this.defaultShowDataLabels,
    });

    public labelFont = new formattingSettings.FontControl({
        name: "labelFontControl",
        displayNameKey: "Visual_LabelFontControl",
        fontFamily: new formattingSettings.FontPicker({
            name: "labelFontFamily",
            displayNameKey: "Visual_FontFamily",
            value: this.defaultLabelFontFamily,
        }),
        fontSize: new formattingSettings.NumUpDown({
            name: "labelFontSize",
            displayNameKey: "Visual_FontSize",
            value: this.defaultLabelFontSize,
            options: {
                minValue: {
                    type: powerbi.visuals.ValidatorType.Min,
                    value: 1
                },
                maxValue: {
                    type: powerbi.visuals.ValidatorType.Max,
                    value: 100
                },
            }
        }),
        bold: new formattingSettings.ToggleSwitch({
            name: "labelFontBold",
            displayNameKey: "Visual_Bold",
            value: this.defaultLabelFontBold,
        }),
        italic: new formattingSettings.ToggleSwitch({
            name: "labelFontItalic",
            displayNameKey: "Visual_Italic",
            value: this.defaultLabelFontItalic,
        }),
        underline: new formattingSettings.ToggleSwitch({
            name: "labelFontUnderline",
            displayNameKey: "Visual_Underline",
            value: this.defaultLabelFontUnderline,
        }),
    });

    public slices: Array<FormattingSettingsSlice> = [this.showSelected, this.selectedFont, this.showDataLabels, this.labelFont];
}

class SunburstTooltipSettings extends FormattingSettingsCard {
    public defaultDisplayUnits: number = 0;
    public defaultPrecision: number = 2;

    public name: string = "tooltip";
    public displayNameKey: string = "Visual_Tooltip";
    public analyticsPane: boolean = false;

    public displayUnits = new formattingSettings.AutoDropdown({
        name: "displayUnits",
        displayNameKey: "Visual_DisplayUnits",
        value: this.defaultDisplayUnits,
    });

    public precision = new formattingSettings.NumUpDown({
        name: "precision",
        displayNameKey: "Visual_Precision",
        value: this.defaultPrecision,
        options: {
            minValue: {
                type: powerbi.visuals.ValidatorType.Min,
                value: 0
            },
            maxValue: {
                type: powerbi.visuals.ValidatorType.Max,
                value: 10
            },
        }
    });

    public slices: Array<FormattingSettingsSlice> = [this.displayUnits, this.precision];
}

class LegendSettings extends FormattingSettingsCard {
    public defaultShow: boolean = false;
    public defaultPosition: string = "Top";
    public defaultShowTitle: boolean = true;
    public defaultTitleText: string = "Legend";
    public defaultLabelColor: string = "#000000";
    public defaultFontSize: number = 8;
    public defaultFontFamily: string = "wf_standard-font, helvetica, arial, sans-serif";

    public name: string = "legend";
    public displayNameKey: string = "Visual_Legend";
    public analyticsPane: boolean = false;

    public show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayNameKey: "Visual_LegendShow",
        value: this.defaultShow,
    });

    public position = new formattingSettings.AutoDropdown({
        name: "position",
        displayNameKey: "Visual_Position",
        value: this.defaultPosition,
    });

    public showTitle = new formattingSettings.ToggleSwitch({
        name: "showTitle",
        displayNameKey: "Visual_ShowTitle",
        value: this.defaultShowTitle,
    });

    public titleText = new formattingSettings.TextInput({
        name: "titleText",
        displayNameKey: "Visual_Title",
        value: this.defaultTitleText,
        placeholder: "Title Text",
    });

    public labelColor = new formattingSettings.ColorPicker({
        name: "labelColor",
        displayNameKey: "Visual_LegendLabelColor",
        value: { value: this.defaultLabelColor },
    });

    public font = new formattingSettings.FontControl({
        name: "fontControl",
        displayNameKey: "Visual_FontControl",
        fontFamily: new formattingSettings.FontPicker({
            name: "fontFamily",
            displayNameKey: "Visual_FontFamily",
            value: this.defaultFontFamily,
        }),
        fontSize: new formattingSettings.NumUpDown({
            name: "fontSize",
            displayNameKey: "Visual_FontSize",
            value: this.defaultFontSize,
            options: {
                minValue: {
                    type: powerbi.visuals.ValidatorType.Min,
                    value: 1
                },
                maxValue: {
                    type: powerbi.visuals.ValidatorType.Max,
                    value: 100
                },
            }
        }),
    });

    public slices: Array<FormattingSettingsSlice> = [this.show, this.position, this.showTitle, this.titleText, this.labelColor, this.font];
}

export class SunburstSettings extends FormattingSettingsModel {
    public group: SunburstGroupSettings = new SunburstGroupSettings();
    public legend: LegendSettings = new LegendSettings();
    public tooltip: SunburstTooltipSettings = new SunburstTooltipSettings();

    public cards: Array<FormattingSettingsCard> = [this.group, this.legend, this.tooltip];

    public setSlicesForTopCategoryColorPickers(topCategories: SunburstDataPoint[], LegendPropertyIdentifier: powerbiVisualsApi.DataViewObjectPropertyIdentifier, ColorHelper) {
        if (topCategories && topCategories.length > 0) {
            topCategories.forEach((category: SunburstDataPoint) => {
                const displayName: string = category.name.toString();
                const identity: ISelectionId = <ISelectionId>category.identity;

                this.group.slices.push(
                    new formattingSettings.ColorPicker({
                        name: LegendPropertyIdentifier.propertyName.toString(),
                        selector: ColorHelper.normalizeSelector(identity.getSelector(), false),
                        displayName: displayName,
                        value: { value: category.color },
                    })
                );

                this.setSlicesForTopCategoryColorPickers(category.children, LegendPropertyIdentifier, ColorHelper);
            });
        }
    }
}