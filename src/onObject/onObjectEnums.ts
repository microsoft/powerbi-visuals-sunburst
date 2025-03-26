import powerbi from "powerbi-visuals-api";
import SubSelectableDirectEdit = powerbi.visuals.SubSelectableDirectEdit;
import SubSelectableDirectEditStyle = powerbi.visuals.SubSelectableDirectEditStyle;

import { IFontReference, ILegendReference } from "./interfaces";

export const enum SunburstObjectNames {
    Legend = "legend",
    LegendTitle = "legendTitle",
    LegendText = "legendText",
    LegendOptions = "legendOptions",
    Group = "group",
}

const createBaseFontReference = (objectName: string): IFontReference => {
    return {
        fontFamily: {
            objectName: objectName,
            propertyName: "fontFamily"
        },
        bold: {
            objectName: objectName,
            propertyName: "fontBold"
        },
        italic: {
            objectName: objectName,
            propertyName: "fontItalic"
        },
        underline: {
            objectName: objectName,
            propertyName: "fontUnderline"
        },
        fontSize: {
            objectName: objectName,
            propertyName: "fontSize"
        }
    }
}

export const legendReferences: ILegendReference = {
    ...createBaseFontReference(SunburstObjectNames.Legend),
    cardUid: "Visual-legend-card",
    groupUid: "legendOptions-group",
    show: {
        objectName: SunburstObjectNames.Legend,
        propertyName: "show"
    },
    showTitle: {
        objectName: SunburstObjectNames.Legend,
        propertyName: "showTitle"
    },
    titleText: {
        objectName: SunburstObjectNames.Legend,
        propertyName: "titleText"
    },
    position: {
        objectName: SunburstObjectNames.Legend,
        propertyName: "position"
    },
    color: {
        objectName: SunburstObjectNames.Legend,
        propertyName: "labelColor"
    }
}