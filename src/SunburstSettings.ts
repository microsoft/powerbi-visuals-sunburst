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

import FormattingSettingsCard = formattingSettings.SimpleCard;
import FormattingSettingsCompositeCard = formattingSettings.CompositeCard;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;
import FormattingSettingsGroup = formattingSettings.Group;

import { SunburstDataPoint } from "./dataInterfaces";
import powerbiVisualsApi from "powerbi-visuals-api";
import ISelectionId = powerbiVisualsApi.visuals.ISelectionId;

class BaseFontCardSettings extends formattingSettings.FontControl {
    private static fontFamilyName: string = "fontFamily";
    private static fontSizeName: string = "fontSize";
    private static boldName: string = "fontBold";
    private static italicName: string = "fontItalic";
    private static underlineName: string = "fontUnderline";
    private static fontName: string = "font";
    public static defaultFontFamily: string = "wf_standard-font, helvetica, arial, sans-serif";
    public static minFontSize: number = 8;
    public static maxFontSize: number = 60;
    constructor(defaultFontSize: number, settingName: string = ""){
        super(
            new formattingSettings.FontControl({
                name: BaseFontCardSettings.fontName + settingName,
                displayNameKey: "Visual_FontControl",
                fontFamily: new formattingSettings.FontPicker({
                    name: BaseFontCardSettings.fontFamilyName + settingName,
                    value: BaseFontCardSettings.defaultFontFamily
                }),
                fontSize: new formattingSettings.NumUpDown({
                    name: BaseFontCardSettings.fontSizeName + settingName,
                    displayNameKey: "Visual_FontSize",
                    value: defaultFontSize,
                    options: {
                        minValue: {
                            type: powerbi.visuals.ValidatorType.Min,
                            value: BaseFontCardSettings.minFontSize
                        },
                        maxValue: {
                            type: powerbi.visuals.ValidatorType.Max,
                            value: BaseFontCardSettings.maxFontSize
                        }
                    }
                }),
                bold: new formattingSettings.ToggleSwitch({
                    name: BaseFontCardSettings.boldName + settingName,
                    value: false
                }),
                italic: new formattingSettings.ToggleSwitch({
                    name: BaseFontCardSettings.italicName + settingName,
                    value: false
                }),
                underline: new formattingSettings.ToggleSwitch({
                    name: BaseFontCardSettings.underlineName + settingName,
                    value: false
                })
            })
        );
    }
}

class SelectedCategoryGroup extends FormattingSettingsCard {
    public defaultShowSelected: boolean = true;
    public defaultCustomizeStyle: boolean = false;
    public defaultFontSize: number = 14;
    public defaultIndentation: number = 0;

    public showSelected = new formattingSettings.ToggleSwitch({
        name: "showSelected",
        displayNameKey: "Visual_ShowCategoryLabel",
        value: this.defaultShowSelected,
    });

    public indentation = new formattingSettings.Slider({
        name: "indentation",
        displayNameKey: "Visual_Indentation",
        value: this.defaultIndentation,
        options: {
            maxValue: {
                type: powerbi.visuals.ValidatorType.Max,
                value: 100
            },
            minValue: {
                type: powerbi.visuals.ValidatorType.Min,
                value: 0
            }
        }
    });

    public customizeStyle = new formattingSettings.ToggleSwitch({
        name: "customizeStyle",
        displayNameKey: "Visual_CustomizeStyle",
        value: this.defaultCustomizeStyle,
    });

    public font = new BaseFontCardSettings(this.defaultFontSize, "Category");

    topLevelSlice: formattingSettings.ToggleSwitch = this.showSelected;
    name: string = "selectedCategoryGroup";
    displayNameKey: string = "Visual_ShowCategoryLabel";
    slices: FormattingSettingsSlice[] = [ this.indentation, this.customizeStyle, this.font];
}

class PercentageLabelGroup extends FormattingSettingsCard {
    public defaultFontSize: number = 21;

    public font = new BaseFontCardSettings(this.defaultFontSize, "Percentage");

    name: string = "percentageLabelGroup";
    displayNameKey: string = "Visual_PercentageLabel";
    slices: FormattingSettingsSlice[] = [this.font];
}

class SunburstCentralLabelSettings extends FormattingSettingsCompositeCard {
    public percentageLabel = new PercentageLabelGroup();
    public categoryLabel = new SelectedCategoryGroup();

    public groups: FormattingSettingsGroup[] = [this.percentageLabel, this.categoryLabel];
    public name: string = "centralLabel";
    public displayNameKey: string = "Visual_CentralLabel";
}

class LabelsGroup extends FormattingSettingsCard {
    public defaultShowDataLabels: boolean = true;
    public defaultLabelFontSize: number = 12;

    public showDataLabels = new formattingSettings.ToggleSwitch({
        name: "showDataLabels",
        displayNameKey: "Visual_ShowDataLabels",
        value: this.defaultShowDataLabels,
    });
    public font = new BaseFontCardSettings(this.defaultLabelFontSize, "Label");

    public color: formattingSettings.ColorPicker = new formattingSettings.ColorPicker({
        name: "fontColor",
        displayName: "Color",
        value: { value: "#252423" }
    });

    topLevelSlice: formattingSettings.ToggleSwitch = this.showDataLabels;
    name: string = "labelsGroup";
    displayNameKey: string = "Visual_ShowDataLabels";
    slices: FormattingSettingsSlice[] = [this.font, this.color];
}

class SunburstValueSettings extends FormattingSettingsCard {
    public defaultLShowDataValues: boolean = false;
    public defaultDelimiter: string = ":";

    public name: string = "value";
    public displayNameKey: string = "Visual_ShowDataValues";
    public analyticsPane: boolean = false;

    public showDataValues = new formattingSettings.ToggleSwitch({
        name: "showDataValues",
        displayNameKey: "Visual_ShowDataValues",
        value: this.defaultLShowDataValues,
    });

    public delimiter: formattingSettings.TextInput = new formattingSettings.TextInput({
        name: "delimiter",
        displayNameKey: "Visual_Delimiter",
        value: this.defaultDelimiter,
        placeholder: ""
    });

    topLevelSlice: formattingSettings.ToggleSwitch = this.showDataValues;
    slices: FormattingSettingsSlice[] = [this.delimiter];
}

class ColorsGroup extends FormattingSettingsCard {
    name: string = "colorsGroup";
    displayNameKey: string = "Visual_Colors";
    slices: FormattingSettingsSlice[] = [];
}

class SunburstGroupSettings extends FormattingSettingsCompositeCard {
    public labels = new LabelsGroup();
    public colors = new ColorsGroup();

    public groups: FormattingSettingsGroup[] = [this.labels, this.colors];
    public name: string = "group";
    public displayNameKey: string = "Visual_Groups";
    public analyticsPane: boolean = false;
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

class LegendOptionsGroup extends FormattingSettingsCard {
    public defaultPosition: string = "Top";

    public position = new formattingSettings.AutoDropdown({
        name: "position",
        displayNameKey: "Visual_Position",
        value: this.defaultPosition,
    });

    name: string = "legendOptions";
    displayName: string = "Options";
    displayNameKey: string = "Visual_Options";
    slices: FormattingSettingsSlice[] = [this.position];
}

class LegendTextGroup extends FormattingSettingsCard {
    public defaultLabelColor: string = "#000000";
    public defaultFontSize: number = 8;

    public labelColor = new formattingSettings.ColorPicker({
        name: "labelColor",
        displayNameKey: "Visual_LegendLabelColor",
        value: { value: this.defaultLabelColor },
    });

    public font = new BaseFontCardSettings(this.defaultFontSize);

    name: string = "legendText";
    displayName: string = "Text";
    displayNameKey: string = "Visual_Text";
    slices: FormattingSettingsSlice[] = [this.font, this.labelColor];
}

class LegendTitleGroup extends FormattingSettingsCard {
    public defaultShowTitle: boolean = true;
    public defaultTitleText: string = "Legend";

    public showTitle = new formattingSettings.ToggleSwitch({
        name: "showTitle",
        displayNameKey: "Visual_ShowTitle",
        value: this.defaultShowTitle,
    });

    topLevelSlice = this.showTitle;

    public titleText = new formattingSettings.TextInput({
        name: "titleText",
        displayNameKey: "Visual_Title",
        value: this.defaultTitleText,
        placeholder: "Title Text",
    });

    name: string = "legendTitle";
    displayName: string = "Title";
    displayNameKey: string = "Visual_Title";
    slices: FormattingSettingsSlice[] = [this.titleText];
}

class LegendSettings extends FormattingSettingsCompositeCard {
    public defaultShow: boolean = false;

    public name: string = "legend";
    public displayNameKey: string = "Visual_Legend";
    public analyticsPane: boolean = false;

    public show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayNameKey: "Visual_LegendShow",
        value: this.defaultShow,
    });

    public topLevelSlice: formattingSettings.ToggleSwitch = this.show;

    public options: LegendOptionsGroup = new LegendOptionsGroup();
    public text: LegendTextGroup = new LegendTextGroup();
    public title: LegendTitleGroup = new LegendTitleGroup();

    public groups: FormattingSettingsGroup[] = [this.options, this.text, this.title];
}

export class SunburstSettings extends FormattingSettingsModel {
    public centralLabel: SunburstCentralLabelSettings = new SunburstCentralLabelSettings();
    public group: SunburstGroupSettings = new SunburstGroupSettings();
    public value: SunburstValueSettings = new SunburstValueSettings();
    public legend: LegendSettings = new LegendSettings();
    public tooltip: SunburstTooltipSettings = new SunburstTooltipSettings();

    public cards: Array<FormattingSettingsCard> = [this.centralLabel, this.group, this.value, this.tooltip, this.legend];

    public setSlicesForTopCategoryColorPickers(topCategories: SunburstDataPoint[], LegendPropertyIdentifier: powerbiVisualsApi.DataViewObjectPropertyIdentifier, ColorHelper) {
        if (topCategories && topCategories.length > 0) {
            topCategories.forEach((category: SunburstDataPoint) => {
                const displayName: string = category.name.toString();
                const identity: ISelectionId = <ISelectionId>category.identity;
                this.group.colors.slices.push(
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