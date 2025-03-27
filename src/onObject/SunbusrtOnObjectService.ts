import powerbi from "powerbi-visuals-api";

import ISelectionId = powerbi.visuals.ISelectionId;

import IVisualHost = powerbi.extensibility.visual.IVisualHost;

import CustomVisualSubSelection = powerbi.visuals.CustomVisualSubSelection;
import SubSelectionStyles = powerbi.visuals.SubSelectionStyles;
import SubSelectionShortcutsKey = powerbi.visuals.SubSelectionShortcutsKey;
import VisualSubSelectionShortcuts = powerbi.visuals.VisualSubSelectionShortcuts;
import SubSelectionStylesType = powerbi.visuals.SubSelectionStylesType;
import VisualShortcutType = powerbi.visuals.VisualShortcutType;
import SubSelectionRegionOutlineFragment = powerbi.visuals.SubSelectionRegionOutlineFragment;

import VisualOnObjectFormatting = powerbi.extensibility.visual.VisualOnObjectFormatting;

import ILocalizationManager = powerbi.extensibility.ILocalizationManager;

import { HtmlSubSelectionHelper, SubSelectableObjectNameAttribute } from "powerbi-visuals-utils-onobjectutils";

import { select as d3Select } from "d3-selection";
import { colorReferences, dataLabelsReferences, legendReferences, SunburstObjectNames } from "./onObjectEnums";
import { SunburstDataPoint } from "../dataInterfaces";
import { HierarchyRectangularNode } from "d3-hierarchy";

export class SunburstOnObjectService implements VisualOnObjectFormatting {
    private subSelectionHelper: SunburstSubSelectionHelper;
    private localizationManager: ILocalizationManager;
    
    constructor(element: HTMLElement, host: IVisualHost, localizationManager: ILocalizationManager, getArcOutlines: (selectionId: ISelectionId) => SubSelectionRegionOutlineFragment[]){
        this.subSelectionHelper = new SunburstSubSelectionHelper(element, host, getArcOutlines);
        this.localizationManager = localizationManager;
    }
    
    public setFormatMode(isFormatMode: boolean): void {
        this.subSelectionHelper.setFormatMode(isFormatMode);
    }

    public updateOutlinesFromSubSelections(subSelections: CustomVisualSubSelection[], clearExistingOutlines?: boolean, suppressRender?: boolean): void {
        this.subSelectionHelper.updateOutlinesFromSubSelections(subSelections, clearExistingOutlines, suppressRender);
    }

    public getSubSelectionStyles(subSelections: CustomVisualSubSelection[]): SubSelectionStyles | undefined{
        const visualObject = subSelections[0]?.customVisualObjects[0];
        if (visualObject) {
            switch (visualObject.objectName) {
                case SunburstObjectNames.Legend:
                    return this.getLegendStyles();
                case SunburstObjectNames.Color:
                    return this.getColorStyles(subSelections);
                case SunburstObjectNames.Label:
                    return this.getLabelsStyles();
            }
        }
    }

    public getSubSelectionShortcuts(subSelections: CustomVisualSubSelection[], filter: SubSelectionShortcutsKey | undefined): VisualSubSelectionShortcuts | undefined{
        const visualObject = subSelections[0]?.customVisualObjects[0];
        if (visualObject) {
            switch (visualObject.objectName) {
                case SunburstObjectNames.Legend:
                    return this.getLegendShortcuts();
                case SunburstObjectNames.LegendTitle:
                    return this.getLegendTitleShortcuts();
                case SunburstObjectNames.Color:
                    return this.getColorShortcuts(subSelections);
                case SunburstObjectNames.Label:
                    return this.getLabelsShortcuts();
            }
        }
    }
    ////
    private getLegendStyles(): SubSelectionStyles {
        return {
            type: SubSelectionStylesType.Text,
            fontFamily: {
                reference: {
                    ...legendReferences.fontFamily
                },
                label: legendReferences.fontFamily.propertyName
            },
            bold: {
                reference: {
                    ...legendReferences.bold
                },
                label: legendReferences.bold.propertyName
            },
            italic: {
                reference: {
                    ...legendReferences.italic
                },
                label: legendReferences.italic.propertyName
            },
            underline: {
                reference: {
                    ...legendReferences.underline
                },
                label: legendReferences.underline.propertyName
            },
            fontSize: {
                reference: {
                    ...legendReferences.fontSize
                },
                label: legendReferences.fontSize.propertyName
            },
            fontColor: {
                reference: {
                    ...legendReferences.color
                },
                label: legendReferences.color.propertyName
            }
        };
    }
    private getLegendShortcuts(): VisualSubSelectionShortcuts{
        return [
            {
                type: VisualShortcutType.Picker,
                ...legendReferences.position,
                label: this.localizationManager.getDisplayName("Visual_Position")
            },
            {
                type: VisualShortcutType.Toggle,
                ...legendReferences.show,
                disabledLabel: this.localizationManager.getDisplayName("Visual_OnObject_Delete")
            },
            {
                type: VisualShortcutType.Toggle,
                ...legendReferences.showTitle,
                enabledLabel: this.localizationManager.getDisplayName("Visual_OnObject_AddTitle")
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
                label: this.localizationManager.getDisplayName("Visual_OnObject_FormatLegend")
            }
        ];
    }
    private getLegendTitleShortcuts(): VisualSubSelectionShortcuts {
        return [
            {
                type: VisualShortcutType.Toggle,
                ...legendReferences.showTitle,
                disabledLabel: this.localizationManager.getDisplayName("Visual_OnObject_Delete")
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
                label: this.localizationManager.getDisplayName("Visual_OnObject_FormatTitle")
            }
        ];
    }

    private getColorStyles(subSelections: CustomVisualSubSelection[]): SubSelectionStyles {
        const selector = subSelections[0].customVisualObjects[0].selectionId?.getSelector();
        return {
            type: SubSelectionStylesType.Shape,
            fill: {
                reference: {
                    ...colorReferences.fill,
                    selector
                },
                label: this.localizationManager.getDisplayName("Visual_Fill")
            },
        };
    }
    private getColorShortcuts(subSelections: CustomVisualSubSelection[]): VisualSubSelectionShortcuts {
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
                label: this.localizationManager.getDisplayName("Visual_OnObject_FormatColors")
            }
        ];
    }

    public getSubSelectables(filter?: SubSelectionStylesType): CustomVisualSubSelection[] | undefined{
        return this.subSelectionHelper.getAllSubSelectables(filter);
    }

    private getLabelsStyles(): SubSelectionStyles {
        return {
            type: SubSelectionStylesType.Text,
            fontFamily: {
                reference: {
                    ...dataLabelsReferences.fontFamily
                },
                label: dataLabelsReferences.fontFamily.propertyName
            },
            bold: {
                reference: {
                    ...dataLabelsReferences.bold
                },
                label: dataLabelsReferences.bold.propertyName
            },
            italic: {
                reference: {
                    ...dataLabelsReferences.italic
                },
                label: dataLabelsReferences.italic.propertyName
            },
            underline: {
                reference: {
                    ...dataLabelsReferences.underline
                },
                label: dataLabelsReferences.underline.propertyName
            },
            fontSize: {
                reference: {
                    ...dataLabelsReferences.fontSize
                },
                label: dataLabelsReferences.fontSize.propertyName
            },
            fontColor: {
                reference: {
                    ...dataLabelsReferences.color
                },
                label: dataLabelsReferences.color.propertyName
            }
        };
    }
    private getLabelsShortcuts(): VisualSubSelectionShortcuts {
        return [
            {
                type: VisualShortcutType.Toggle,
                ...dataLabelsReferences.show,
                disabledLabel: this.localizationManager.getDisplayName("Visual_OnObject_Delete")
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
                    dataLabelsReferences.show
                ]
            },
            {
                type: VisualShortcutType.Navigate,
                destinationInfo: { cardUid: dataLabelsReferences.cardUid, groupUid: dataLabelsReferences.groupUid },
                label: this.localizationManager.getDisplayName("Visual_OnObject_FormatLabels")
            }
        ];
    }
}

export class SunburstSubSelectionHelper {
    private subSelectionHelper: HtmlSubSelectionHelper;
    private getArcOutlines: (selectionId: ISelectionId) => SubSelectionRegionOutlineFragment[];

    constructor(element: HTMLElement, host: IVisualHost, getArcOutlines: (selectionId: ISelectionId) => SubSelectionRegionOutlineFragment[]){
        this.subSelectionHelper = HtmlSubSelectionHelper.createHtmlSubselectionHelper({
            hostElement: element,
            subSelectionService: host.subSelectionService,
            selectionIdCallback: (e) => this.selectionIdCallback(e),
            customOutlineCallback: (e) => this.customOutlineCallback(e)
        });

        this.getArcOutlines = getArcOutlines;
    }

    public selectionIdCallback(e: Element): powerbi.visuals.ISelectionId {
        const elementType: string = d3Select(e).attr(SubSelectableObjectNameAttribute);

        switch (elementType) {
            case SunburstObjectNames.Color: {
                const datum = d3Select<Element, HierarchyRectangularNode<SunburstDataPoint>>(e).datum();
                return datum.data.identity;
            }
            default:
                return undefined;
        }
    }

    public customOutlineCallback(subSelections: CustomVisualSubSelection): powerbi.visuals.SubSelectionRegionOutlineFragment[] {
        const elementType: string = subSelections.customVisualObjects[0].objectName;

        switch (elementType) {
            case SunburstObjectNames.Color: {
                const subSelectionIdentity: powerbi.visuals.ISelectionId = subSelections.customVisualObjects[0].selectionId;
                const result = this.getArcOutlines(subSelectionIdentity);
                return result;
            }
            default:
                return undefined;
        }
    }

    public setFormatMode(isFormatMode: boolean): void{
        this.subSelectionHelper.setFormatMode(isFormatMode);
    }

    public updateOutlinesFromSubSelections(subSelections: CustomVisualSubSelection[], clearExistingOutlines?: boolean, suppressRender?: boolean): void{
        this.subSelectionHelper.updateOutlinesFromSubSelections(subSelections, clearExistingOutlines, suppressRender);
    }

    public getAllSubSelectables(filterType?: SubSelectionStylesType): CustomVisualSubSelection[] | undefined {
        return this.subSelectionHelper.getAllSubSelectables(filterType);
    }
}
