import powerbi from "powerbi-visuals-api";

import CustomVisualSubSelection = powerbi.visuals.CustomVisualSubSelection;
import SubSelectionStyles = powerbi.visuals.SubSelectionStyles;
import VisualSubSelectionShortcuts = powerbi.visuals.VisualSubSelectionShortcuts;
import SubSelectionStylesType = powerbi.visuals.SubSelectionStylesType;
import VisualShortcutType = powerbi.visuals.VisualShortcutType;

import ILocalizationManager = powerbi.extensibility.ILocalizationManager;

import { colorReferences, dataLabelsReferences, legendReferences, valuesReferences } from "./references";
import { IFontReference } from "./interfaces";

export class SubSelectionStylesService {
    private static GetSubselectionStylesForText(objectReference: IFontReference): SubSelectionStyles {
        return {
            type: SubSelectionStylesType.Text,
            fontFamily: {
                reference: {
                    ...objectReference.fontFamily
                },
                label: objectReference.fontFamily.propertyName
            },
            bold: {
                reference: {
                    ...objectReference.bold
                },
                label: objectReference.bold.propertyName
            },
            italic: {
                reference: {
                    ...objectReference.italic
                },
                label: objectReference.italic.propertyName
            },
            underline: {
                reference: {
                    ...objectReference.underline
                },
                label: objectReference.underline.propertyName
            },
            fontSize: {
                reference: {
                    ...objectReference.fontSize
                },
                label: objectReference.fontSize.propertyName
            },
            fontColor: {
                reference: {
                    ...objectReference.color
                },
                label: objectReference.color.propertyName
            }
        };
    }

    public static GetLegendStyles(): SubSelectionStyles {
        return SubSelectionStylesService.GetSubselectionStylesForText(legendReferences);
    }

    public static GetColorStyles(subSelections: CustomVisualSubSelection[], localizationManager: ILocalizationManager): SubSelectionStyles {
        const selector = subSelections[0].customVisualObjects[0].selectionId?.getSelector();
        return {
            type: SubSelectionStylesType.Shape,
            fill: {
                reference: {
                    ...colorReferences.fill,
                    selector
                },
                label: localizationManager.getDisplayName("Visual_Fill")
            },
        };
    }

    public static GetLabelsStyles(): SubSelectionStyles {
        return SubSelectionStylesService.GetSubselectionStylesForText(dataLabelsReferences);
    }
}

export class SubSelectionShortcutsService {
    public static GetLegendShortcuts(localizationManager: ILocalizationManager): VisualSubSelectionShortcuts{
        return [
            {
                type: VisualShortcutType.Picker,
                ...legendReferences.position,
                label: localizationManager.getDisplayName("Visual_Position")
            },
            {
                type: VisualShortcutType.Toggle,
                ...legendReferences.show,
                disabledLabel: localizationManager.getDisplayName("Visual_OnObject_Delete")
            },
            {
                type: VisualShortcutType.Toggle,
                ...legendReferences.showTitle,
                enabledLabel: localizationManager.getDisplayName("Visual_OnObject_AddTitle")
            },
            {
                type: VisualShortcutType.Divider,
            },
            {
                type: VisualShortcutType.Reset,
                relatedResetFormattingIds: [
                    legendReferences.bold,
                    legendReferences.fontFamily,
                    legendReferences.fontSize,
                    legendReferences.italic,
                    legendReferences.underline,
                    legendReferences.color,
                    legendReferences.showTitle,
                    legendReferences.titleText
                ]
            },
            {
                type: VisualShortcutType.Navigate,
                destinationInfo: { cardUid: legendReferences.cardUid, groupUid: legendReferences.groupUid },
                label: localizationManager.getDisplayName("Visual_OnObject_FormatLegend")
            }
        ];
    }
    public static GetLegendTitleShortcuts(localizationManager: ILocalizationManager): VisualSubSelectionShortcuts {
        return [
            {
                type: VisualShortcutType.Toggle,
                ...legendReferences.showTitle,
                disabledLabel: localizationManager.getDisplayName("Visual_OnObject_Delete")
            },
            {
                type: VisualShortcutType.Divider,
            },
            {
                type: VisualShortcutType.Reset,
                relatedResetFormattingIds: [
                    legendReferences.showTitle,
                    legendReferences.titleText
                ]
            },
            {
                type: VisualShortcutType.Navigate,
                destinationInfo: { cardUid: legendReferences.cardUid, groupUid: "legendTitle-group" },
                label: localizationManager.getDisplayName("Visual_OnObject_FormatTitle")
            }
        ];
    }
    public static GetColorShortcuts(subSelections: CustomVisualSubSelection[], localizationManager: ILocalizationManager): VisualSubSelectionShortcuts {
        const selector = subSelections[0].customVisualObjects[0].selectionId?.getSelector();
        return [
            {
                type: VisualShortcutType.Reset,
                relatedResetFormattingIds: [{
                    ...colorReferences.fill,
                    selector
                }],
            },
            {
                type: VisualShortcutType.Navigate,
                destinationInfo: { cardUid: colorReferences.cardUid, groupUid: colorReferences.groupUid },
                label: localizationManager.getDisplayName("Visual_OnObject_FormatColors")
            }
        ];
    }
    public static GetLabelsShortcuts(localizationManager: ILocalizationManager): VisualSubSelectionShortcuts {
        return [
            {
                type: VisualShortcutType.Toggle,
                ...dataLabelsReferences.show,
                disabledLabel: localizationManager.getDisplayName("Visual_OnObject_Delete")
            },
            {
                type: VisualShortcutType.Toggle,
                ...valuesReferences.show,
                disabledLabel: localizationManager.getDisplayName("Visual_OnObject_DeleteValues"),
                enabledLabel: localizationManager.getDisplayName("Visual_OnObject_AddValues")
            },
            {
                type: VisualShortcutType.Divider,
            },
            {
                type: VisualShortcutType.Reset,
                relatedResetFormattingIds: [
                    dataLabelsReferences.bold,
                    dataLabelsReferences.fontFamily,
                    dataLabelsReferences.fontSize,
                    dataLabelsReferences.italic,
                    dataLabelsReferences.underline,
                    dataLabelsReferences.color,
                    dataLabelsReferences.show,
                    valuesReferences.show,
                    valuesReferences.format
                ]
            },
            {
                type: VisualShortcutType.Navigate,
                destinationInfo: { cardUid: dataLabelsReferences.cardUid, groupUid: dataLabelsReferences.groupUid },
                label: localizationManager.getDisplayName("Visual_OnObject_FormatLabels")
            },
            {
                type: VisualShortcutType.Navigate,
                destinationInfo: { cardUid: valuesReferences.cardUid, groupUid: valuesReferences.groupUid },
                label: localizationManager.getDisplayName("Visual_OnObject_FormatValues")
            }
        ];
    }
}