import powerbi from "powerbi-visuals-api";

import ISelectionId = powerbi.visuals.ISelectionId;

import IVisualHost = powerbi.extensibility.visual.IVisualHost;

import CustomVisualSubSelection = powerbi.visuals.CustomVisualSubSelection;
import SubSelectionStyles = powerbi.visuals.SubSelectionStyles;
import SubSelectionShortcutsKey = powerbi.visuals.SubSelectionShortcutsKey;
import VisualSubSelectionShortcuts = powerbi.visuals.VisualSubSelectionShortcuts;
import SubSelectionStylesType = powerbi.visuals.SubSelectionStylesType;
import SubSelectionRegionOutlineFragment = powerbi.visuals.SubSelectionRegionOutlineFragment;

import VisualOnObjectFormatting = powerbi.extensibility.visual.VisualOnObjectFormatting;

import ILocalizationManager = powerbi.extensibility.ILocalizationManager;

import { HtmlSubSelectionHelper, SubSelectableObjectNameAttribute } from "powerbi-visuals-utils-onobjectutils";

import { select as d3Select } from "d3-selection";
import { SunburstDataPoint } from "../dataInterfaces";
import { HierarchyRectangularNode } from "d3-hierarchy";
import { SunburstObjectNames } from "../SunburstSettings";
import { SubSelectionStylesService, SubSelectionShortcutsService } from "./helperServices";

export class SunburstOnObjectService implements VisualOnObjectFormatting {
    private localizationManager: ILocalizationManager;
    private htmlSubSelectionHelper: HtmlSubSelectionHelper;
    private getArcOutlines: (selectionId: ISelectionId) => SubSelectionRegionOutlineFragment[];
    
    constructor(element: HTMLElement, host: IVisualHost, localizationManager: ILocalizationManager, getArcOutlines: (selectionId: ISelectionId) => SubSelectionRegionOutlineFragment[]){
        this.localizationManager = localizationManager;
        this.getArcOutlines = getArcOutlines;
        this.htmlSubSelectionHelper = HtmlSubSelectionHelper.createHtmlSubselectionHelper({
            hostElement: element,
            subSelectionService: host.subSelectionService,
            selectionIdCallback: (e) => this.selectionIdCallback(e),
            customOutlineCallback: (e) => this.customOutlineCallback(e)
        });
    }
    
    public setFormatMode(isFormatMode: boolean): void {
        this.htmlSubSelectionHelper.setFormatMode(isFormatMode);
    }

    public updateOutlinesFromSubSelections(subSelections: CustomVisualSubSelection[], clearExistingOutlines?: boolean, suppressRender?: boolean): void {
        this.htmlSubSelectionHelper.updateOutlinesFromSubSelections(subSelections, clearExistingOutlines, suppressRender);
    }

    public getSubSelectables(filter?: SubSelectionStylesType): CustomVisualSubSelection[] | undefined{
        return this.htmlSubSelectionHelper.getAllSubSelectables(filter);
    }

    public getSubSelectionStyles(subSelections: CustomVisualSubSelection[]): SubSelectionStyles | undefined{
        const visualObject = subSelections[0]?.customVisualObjects[0];
        if (visualObject) {
            switch (visualObject.objectName) {
                case SunburstObjectNames.Legend:
                    return SubSelectionStylesService.GetLegendStyles();
                case SunburstObjectNames.Color:
                    return SubSelectionStylesService.GetColorStyles(subSelections, this.localizationManager);
                case SunburstObjectNames.Label:
                    return SubSelectionStylesService.GetLabelsStyles();
            }
        }
    }

    public getSubSelectionShortcuts(subSelections: CustomVisualSubSelection[]): VisualSubSelectionShortcuts | undefined{
        const visualObject = subSelections[0]?.customVisualObjects[0];
        if (visualObject) {
            switch (visualObject.objectName) {
                case SunburstObjectNames.Legend:
                    return SubSelectionShortcutsService.GetLegendShortcuts(this.localizationManager);
                case SunburstObjectNames.LegendTitle:
                    return SubSelectionShortcutsService.GetLegendTitleShortcuts(this.localizationManager);
                case SunburstObjectNames.Color:
                    return SubSelectionShortcutsService.GetColorShortcuts(subSelections, this.localizationManager);
                case SunburstObjectNames.Label:
                    return SubSelectionShortcutsService.GetLabelsShortcuts(this.localizationManager);
            }
        }
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
}
