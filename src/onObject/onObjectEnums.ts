import powerbi from "powerbi-visuals-api";
import SubSelectableDirectEdit = powerbi.visuals.SubSelectableDirectEdit;
import SubSelectableDirectEditStyle = powerbi.visuals.SubSelectableDirectEditStyle;

import { IColorReference, IDataLabelReference, IFontReference, ILegendReference } from "./interfaces";
import { SunburstOnObjectService } from "./SunbusrtOnObjectService";

export const enum SunburstObjectNames {
    Legend = "legend",
    LegendTitle = "legendTitle",
    LegendText = "legendText",
    LegendOptions = "legendOptions",
    Group = "group",
    Color = "colorsGroup",
    Label = "labelsGroup"
}

export const TitleEdit: SubSelectableDirectEdit = {
    reference: {
        objectName: SunburstObjectNames.Legend,
        propertyName: "titleText"
    },
    style: SubSelectableDirectEditStyle.HorizontalLeft,
}

export const visualTitleEditSubSelection = JSON.stringify(TitleEdit);

const createBaseFontReference = (objectName: string, settingName: string = ""): IFontReference => {
    return {
        fontFamily: {
            objectName: objectName,
            propertyName: "fontFamily" + settingName
        },
        bold: {
            objectName: objectName,
            propertyName: "fontBold" + settingName
        },
        italic: {
            objectName: objectName,
            propertyName: "fontItalic" + settingName
        },
        underline: {
            objectName: objectName,
            propertyName: "fontUnderline" + settingName
        },
        fontSize: {
            objectName: objectName,
            propertyName: "fontSize" + settingName
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

export const colorReferences: IColorReference = {
    cardUid: "Visual-group-card",
    groupUid: "colorsGroup-group",
    fill: {
        objectName: SunburstObjectNames.Group,
        propertyName: "fill"
    }
}

export const dataLabelsReferences: IDataLabelReference = {
    ...createBaseFontReference(SunburstObjectNames.Group, "Label"),
    cardUid: "Visual-group-card",
    groupUid: "labelsGroup-group",
    show: {
        objectName: SunburstObjectNames.Group,
        propertyName: "showDataLabels"
    },
    color: {
        objectName: SunburstObjectNames.Group,
        propertyName: "labelColor"
    }
}