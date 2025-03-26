import powerbi from "powerbi-visuals-api";

import IVisualHost = powerbi.extensibility.visual.IVisualHost;

import CustomVisualSubSelection = powerbi.visuals.CustomVisualSubSelection;
import SubSelectionStyles = powerbi.visuals.SubSelectionStyles;
import SubSelectionShortcutsKey = powerbi.visuals.SubSelectionShortcutsKey;
import VisualSubSelectionShortcuts = powerbi.visuals.VisualSubSelectionShortcuts;
import SubSelectionStylesType = powerbi.visuals.SubSelectionStylesType;
import VisualShortcutType = powerbi.visuals.VisualShortcutType;
import VisualOnObjectFormatting = powerbi.extensibility.visual.VisualOnObjectFormatting;

import ILocalizationManager = powerbi.extensibility.ILocalizationManager;

import { HtmlSubSelectionHelper, SubSelectableObjectNameAttribute } from "powerbi-visuals-utils-onobjectutils";

import { select as d3Select } from "d3-selection";
import { legendReferences, SunburstObjectNames } from "./onObjectEnums";

export class SunburstOnObjectService implements VisualOnObjectFormatting {
    private subSelectionHelper: SunburstSubSelectionHelper;
    private localizationManager: ILocalizationManager;
    
    constructor(element: HTMLElement, host: IVisualHost, localizationManager: ILocalizationManager){
        this.subSelectionHelper = new SunburstSubSelectionHelper(element, host);
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
            }
        }
    }

    public getSubSelectionShortcuts(subSelections: CustomVisualSubSelection[], filter: SubSelectionShortcutsKey | undefined): VisualSubSelectionShortcuts | undefined{
        const visualObject = subSelections[0]?.customVisualObjects[0];
        if (visualObject) {
            switch (visualObject.objectName) {
                case SunburstObjectNames.Legend:
                    return this.getLegendShortcuts();
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
                type: VisualShortcutType.Navigate,
                destinationInfo: { cardUid: legendReferences.cardUid, groupUid: legendReferences.groupUid },
                label: this.localizationManager.getDisplayName("Visual_OnObject_FormatLegend")
            }
        ];
    }
    ////

    public getSubSelectables(filter?: SubSelectionStylesType): CustomVisualSubSelection[] | undefined{
        return this.subSelectionHelper.getAllSubSelectables(filter);
    }
}

export class SunburstSubSelectionHelper {
    private subSelectionHelper: HtmlSubSelectionHelper;

    constructor(element: HTMLElement, host: IVisualHost){
        this.subSelectionHelper = HtmlSubSelectionHelper.createHtmlSubselectionHelper({
            hostElement: element,
            subSelectionService: host.subSelectionService,
            selectionIdCallback: (e) => this.selectionIdCallback(e),
            customOutlineCallback: (e) => this.customOutlineCallback(e)
        });
    }

    public selectionIdCallback(e: Element): powerbi.visuals.ISelectionId {
        const elementType: string = d3Select(e).attr(SubSelectableObjectNameAttribute);

        switch (elementType) {
            default:
                return undefined;
        }
    }

    public customOutlineCallback(subSelections: CustomVisualSubSelection): powerbi.visuals.SubSelectionRegionOutlineFragment[] {
        const elementType: string = subSelections.customVisualObjects[0].objectName;
        switch (elementType) {
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
