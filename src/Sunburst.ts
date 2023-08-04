/*
*  Power BI Visual CLI
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

"use strict";

import "../style/sunburst.less";
import { BaseType, Selection, select as d3Select } from "d3-selection";
import { Arc, arc as d3Arc } from "d3-shape";
import { partition as d3Partition, hierarchy as d3Hierarchy, HierarchyRectangularNode } from "d3-hierarchy";

import powerbiVisualsApi from "powerbi-visuals-api";
import DataView = powerbiVisualsApi.DataView;
import IViewport = powerbiVisualsApi.IViewport;
import PrimitiveValue = powerbiVisualsApi.PrimitiveValue;

import VisualObjectInstance = powerbiVisualsApi.VisualObjectInstance;
import VisualObjectInstanceEnumeration = powerbiVisualsApi.VisualObjectInstanceEnumeration;
import EnumerateVisualObjectInstancesOptions = powerbiVisualsApi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstanceEnumerationObject = powerbiVisualsApi.VisualObjectInstanceEnumerationObject;

import DataViewHierarchyLevel = powerbiVisualsApi.DataViewHierarchyLevel;
import DataViewObjects = powerbiVisualsApi.DataViewObjects;
import DataViewObjectPropertyIdentifier = powerbiVisualsApi.DataViewObjectPropertyIdentifier;
import DataViewTreeNode = powerbiVisualsApi.DataViewTreeNode;

import ISelectionIdBuilder = powerbiVisualsApi.visuals.ISelectionIdBuilder;
import ISelectionId = powerbiVisualsApi.visuals.ISelectionId;

import IColorPalette = powerbiVisualsApi.extensibility.IColorPalette;
import VisualTooltipDataItem = powerbiVisualsApi.extensibility.VisualTooltipDataItem;
import IVisualEventService = powerbiVisualsApi.extensibility.IVisualEventService;
import ISelectionManager = powerbiVisualsApi.extensibility.ISelectionManager;
import IVisual = powerbiVisualsApi.extensibility.visual.IVisual;
import IVisualHost = powerbiVisualsApi.extensibility.visual.IVisualHost;
import VisualUpdateOptions = powerbiVisualsApi.extensibility.visual.VisualUpdateOptions;
import VisualConstructorOptions = powerbiVisualsApi.extensibility.visual.VisualConstructorOptions;
import { ColorHelper } from "powerbi-visuals-utils-colorutils";
import { pixelConverter as PixelConverter } from "powerbi-visuals-utils-typeutils";
import {
    ITooltipServiceWrapper,
    createTooltipServiceWrapper,
} from "powerbi-visuals-utils-tooltiputils";

import {
    CssConstants,
    manipulation
} from "powerbi-visuals-utils-svgutils";
import translate = manipulation.translate;
import ClassAndSelector = CssConstants.ClassAndSelector;
import createClassAndSelector = CssConstants.createClassAndSelector;

import { textMeasurementService, valueFormatter } from "powerbi-visuals-utils-formattingutils";
import IValueFormatter = valueFormatter.IValueFormatter;

import {
    legend as Legend,
    legendInterfaces as LI
} from "powerbi-visuals-utils-chartutils";
import createLegend = Legend.createLegend;
import ILegend = LI.ILegend;
import LegendData = LI.LegendData;
import MarkerShape = LI.MarkerShape;
import LegendPosition = LI.LegendPosition;

import { interactivityBaseService, interactivitySelectionService } from "powerbi-visuals-utils-interactivityutils";
import IInteractivityService = interactivityBaseService.IInteractivityService;
import IInteractiveBehavior = interactivityBaseService.IInteractiveBehavior;
import createInteractivitySelectionService = interactivitySelectionService.createInteractivitySelectionService;

import { Behavior, BehaviorOptions } from "./behavior";
import { SunburstData, SunburstDataPoint } from "./dataInterfaces";
import { SunburstSettings } from "./SunburstSettings";
import { TextProperties } from "powerbi-visuals-utils-formattingutils/lib/src/interfaces";

interface IAppCssConstants {
    main: ClassAndSelector;
    mainInteractive: ClassAndSelector;
    slice: ClassAndSelector;
    sliceSelected: ClassAndSelector;
    sliceHidden: ClassAndSelector;
    label: ClassAndSelector;
    labelVisible: ClassAndSelector;
    categoryLabel: ClassAndSelector;
    percentageLabel: ClassAndSelector;
    sliceLabel: ClassAndSelector;
}

export class Sunburst implements IVisual {
    private static ViewBoxSize: number = 500;
    private static CentralPoint: number = Sunburst.ViewBoxSize / 2;
    private static OuterRadius: number = Sunburst.ViewBoxSize / 2;
    private static PercentageFontSizeMultiplier: number = 2;
    private static CategoryLineInterval: number = 0.6;
    private static DefaultPercentageLineInterval: number = 0.25;
    private static MultilinePercentageLineInterval: number = 0.6;
    private static LabelShift: number = 26;
    private static LabelShiftMultiplier: number = 1.7;

    private static DefaultDataLabelPadding: number = 15;

    private static LegendPropertyIdentifier: DataViewObjectPropertyIdentifier = {
        objectName: "group",
        propertyName: "fill"
    };

    private toggleLabels(isShown: boolean = true) {
        this.percentageLabel.classed(
            this.appCssConstants.labelVisible.className,
            isShown
        );

        this.selectedCategoryLabel.classed(
            this.appCssConstants.labelVisible.className,
            isShown && this.settings.group.showSelected
        );
    }

    private settings: SunburstSettings;
    private visualHost: IVisualHost;
    private selectionManager: ISelectionManager;
    private events: IVisualEventService;
    private data: SunburstData;
    private arc: Arc<any, any>;
    private chartWrapper: Selection<BaseType, any, BaseType, any>;
    private svg: Selection<BaseType, string, BaseType, string>;
    private main: Selection<BaseType, any, BaseType, any>;
    private percentageLabel: Selection<BaseType, string, BaseType, string>;
    private percentageFormatter: IValueFormatter;
    private selectedCategoryLabel: Selection<BaseType, string, BaseType, string>;

    private appCssConstants: IAppCssConstants = {
        main: createClassAndSelector("sunburst"),
        mainInteractive: createClassAndSelector("sunburst--interactive"),
        slice: createClassAndSelector("sunburst__slice"),
        sliceSelected: createClassAndSelector("sunburst__slice--selected"),
        sliceHidden: createClassAndSelector("sunburst__slice--hidden"),
        label: createClassAndSelector("sunburst__label"),
        labelVisible: createClassAndSelector("sunburst__label--visible"),
        categoryLabel: createClassAndSelector("sunburst__category-label"),
        percentageLabel: createClassAndSelector("sunburst__percentage-label"),
        sliceLabel: createClassAndSelector("sunburst__slice-label")
    };

    private colorPalette: IColorPalette;
    private colorHelper: ColorHelper;

    private interactivityService: IInteractivityService<any>;
    private behavior: IInteractiveBehavior = new Behavior();

    private tooltipService: ITooltipServiceWrapper;
    private viewport: IViewport;
    private legend: ILegend;
    private legendData: LegendData;

    constructor(options: VisualConstructorOptions) {

        this.visualHost = options.host;

        this.events = options.host.eventService;

        this.tooltipService = createTooltipServiceWrapper(
            options.host.tooltipService,
            options.element
        );

        this.percentageFormatter = valueFormatter.create({ format: "0.00%;-0.00%;0.00%" });

        this.colorPalette = this.visualHost.colorPalette;
        this.colorHelper = new ColorHelper(this.colorPalette);
        this.arc = d3Arc<HierarchyRectangularNode<SunburstDataPoint>>()
            .startAngle(d => d.x0)
            .endAngle(d => d.x1)
            .innerRadius((d) => Math.sqrt(d.y0))
            .outerRadius((d) => Math.sqrt(d.y1));

        this.colorPalette = options.host.colorPalette;

        this.interactivityService = createInteractivitySelectionService(options.host);

        this.chartWrapper = d3Select(options.element)
            .append("div")
            .classed(this.appCssConstants.main.className, true);

        this.svg = this.chartWrapper
            .append("svg")
            .attr("viewBox", `0 0 ${Sunburst.ViewBoxSize} ${Sunburst.ViewBoxSize}`)
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("preserveAspectRatio", "xMidYMid meet");

        this.selectionManager = options.host.createSelectionManager();

        this.main = this.svg.append("g");
        this.main.attr(CssConstants.transformProperty, translate(Sunburst.CentralPoint, Sunburst.CentralPoint));

        this.selectedCategoryLabel = this.svg
            .append("text")
            .classed(this.appCssConstants.label.className, true)
            .classed(this.appCssConstants.categoryLabel.className, true);

        this.selectedCategoryLabel.attr("x", Sunburst.CentralPoint);
        this.selectedCategoryLabel.attr("y", Sunburst.CentralPoint);

        this.percentageLabel = this.svg
            .append("text")
            .classed(this.appCssConstants.label.className, true)
            .classed(this.appCssConstants.percentageLabel.className, true);
        this.percentageLabel.attr("x", Sunburst.CentralPoint);
        this.percentageLabel.attr("y", Sunburst.CentralPoint);

        // create legend container
        this.legend = createLegend(options.element,
            false,
            null,
            true,
            LegendPosition.Top
        );

        this.renderContextMenu();
    }

    public update(options: VisualUpdateOptions): void {
        this.clear();

        if (!options
            || !options.dataViews
            || !options.dataViews[0]
            || !options.dataViews[0].matrix
            || !options.dataViews[0].matrix.rows
            || !options.dataViews[0].matrix.rows.root
            || !options.dataViews[0].matrix.rows.root.children
            || !options.dataViews[0].matrix.rows.root.children.length
            || !options.dataViews[0].matrix.columns
            || !options.dataViews[0].matrix.columns.root
            || !options.dataViews[0].matrix.columns.root.children
            || !options.dataViews[0].matrix.columns.root.children.length
        ) {
            return;
        }

        try {
            this.events && this.events.renderingStarted(options);

            this.viewport = options.viewport;

            this.settings = this.parseSettings(options.dataViews[0]);

            const formatter: IValueFormatter = valueFormatter.create({
                value: this.settings.tooltip.displayUnits,
                precision: this.settings.tooltip.precision,
                cultureSelector: this.visualHost.locale
            });

            this.data = this.convert(
                options.dataViews[0],
                this.colorPalette,
                this.colorHelper,
                this.visualHost,
                formatter
            );


            const selection = this.render(this.colorHelper);

            if (this.data) {
                this.legendData = Sunburst.createLegend(this.data, this.settings);

                this.renderLegend();
            }

            if (this.settings.legend.show) {
                this.chartWrapper.style("width", PixelConverter.toString(this.viewport.width));
                this.chartWrapper.style("height", PixelConverter.toString(this.viewport.height));
            } else {
                this.chartWrapper.attr("style", null);
            }

            if (this.interactivityService) {
                const behaviorOptions: BehaviorOptions = {
                    selection,
                    clearCatcher: this.svg,
                    interactivityService: this.interactivityService,
                    onSelect: this.onVisualSelection.bind(this),
                    dataPoints: this.data.dataPoints,
                    behavior: this.behavior
                };

                this.interactivityService.bind(behaviorOptions);

                this.behavior.renderSelection(false);
            }

            this.events && this.events.renderingFinished(options);
        }
        catch (e) {
            console.error(e);
            this.events && this.events.renderingFailed(options);
        }
    }

    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
        const instanceEnumeration: VisualObjectInstanceEnumeration = SunburstSettings.enumerateObjectInstances(
            this.settings || SunburstSettings.getDefault(),
            options
        );

        if (options.objectName === Sunburst.LegendPropertyIdentifier.objectName) {
            const topCategories: SunburstDataPoint[] = this.data.root.children;
            this.enumerateColors(topCategories, instanceEnumeration);
        }

        return (<VisualObjectInstanceEnumerationObject>instanceEnumeration).instances || [];
    }

    private enumerateColors(topCategories: SunburstDataPoint[], instanceEnumeration: VisualObjectInstanceEnumeration): void {
        if (topCategories && topCategories.length > 0) {
            topCategories.forEach((category: SunburstDataPoint) => {
                const displayName: string = category.name.toString();
                const identity: ISelectionId = <ISelectionId>category.identity;

                this.addAnInstanceToEnumeration(instanceEnumeration, {
                    displayName,
                    objectName: Sunburst.LegendPropertyIdentifier.objectName.toString(),
                    selector: ColorHelper.normalizeSelector(identity.getSelector(), false),
                    properties: {
                        fill: { solid: { color: category.color } }
                    }
                });

                this.enumerateColors(category.children, instanceEnumeration);
            });
        }
    }

    private addAnInstanceToEnumeration(
        instanceEnumeration: VisualObjectInstanceEnumeration,
        instance: VisualObjectInstance
    ): void {

        if ((<VisualObjectInstanceEnumerationObject>instanceEnumeration).instances) {
            (<VisualObjectInstanceEnumerationObject>instanceEnumeration)
                .instances
                .push(instance);
        } else {
            (<VisualObjectInstance[]>instanceEnumeration).push(instance);
        }
    }

    private render(colorHelper: ColorHelper): Selection<BaseType, HierarchyRectangularNode<SunburstDataPoint>, BaseType, SunburstDataPoint> {
        const root = this.partition(this.data.root).descendants().slice(1);
        const pathSelection: Selection<BaseType, HierarchyRectangularNode<SunburstDataPoint>, BaseType, SunburstDataPoint> =
            this.main
                .selectAll("path");
        const pathSelectionData = pathSelection.data(root);

        pathSelectionData
            .exit()
            .remove();

        const pathSelectionEnter: Selection<BaseType, HierarchyRectangularNode<SunburstDataPoint>, BaseType, SunburstDataPoint> =
            pathSelectionData.enter()
                .append("path");
        const pathSelectionMerged = pathSelectionEnter.merge(pathSelection);
        pathSelectionMerged
            .classed(this.appCssConstants.slice.className, true)
            .style("fill", slice => colorHelper.isHighContrast ? null : slice.data.color)
            .style("stroke", slice => colorHelper.isHighContrast ? slice.data.color : null)
            .style("stroke-width", () => colorHelper.isHighContrast ? PixelConverter.toString(2) : null)
            .attr("d", this.arc);

        if (this.settings.group.showDataLabels) {
            pathSelectionMerged.each((d: HierarchyRectangularNode<SunburstDataPoint>, i: number, groups: ArrayLike<BaseType>) => {
                const firstArcSection: RegExp = /(^.+?)L/;
                const currentSelection = d3Select(groups[i]);
                const arcRegExpArray: RegExpExecArray = firstArcSection.exec(currentSelection.attr("d"));

                // if slice is section
                if (arcRegExpArray) {
                    let newArc: string = arcRegExpArray[1];
                    newArc = newArc.replace(/,/g, " ");
                    this.main.append("path")
                        .classed(this.appCssConstants.sliceHidden.className, true)
                        .attr("id", "sliceLabel_" + i)
                        .attr("d", newArc);
                } else {
                    currentSelection
                        .attr("id", "sliceLabel_" + i);
                }
            });

            const properties: TextProperties = textMeasurementService.getSvgMeasurementProperties(<any> this.main.node());
            const ellipsesWidth: number = textMeasurementService.measureSvgTextWidth(properties, "\u2026");

            this.main
                .selectAll(this.appCssConstants.sliceLabel.selectorName)
                .data(root)
                .enter()
                .append("text")
                .style("fill", colorHelper.getHighContrastColor("foreground", null))
                .classed(this.appCssConstants.sliceLabel.className, true)
                // font size + slice padding
                .attr("dy", (d) => {
                    return Sunburst.LabelShift - d.depth * Sunburst.LabelShiftMultiplier;
                })
                .append("textPath")
                .attr("startOffset", "50%")
                .attr("xlink:href", (d, i) => "#sliceLabel_" + i)
                .text((d, i) => this.wrapPathText(d.data.name, i, properties, ellipsesWidth));
        }

        this.renderTooltip(pathSelectionMerged);
        this.setCategoryLabelPosition(this.viewport.width);
        this.setPercentageLabelPosition(this.viewport.width);

        return pathSelectionMerged;
    }

    private partition(data: SunburstDataPoint) {
        const root = d3Hierarchy<SunburstDataPoint>(data)
            .sum(d => d.value)
            .sort((a, b) => b.value - a.value);
        return d3Partition<SunburstDataPoint>()
            .size([2 * Math.PI, Sunburst.OuterRadius * Sunburst.OuterRadius])(root)
            .each(d => {
                d.data.coords = {
                    x0: d.x0,
                    y0: d.y0,
                    x1: d.y0,
                    y1: d.y1
                };
                return d;
            });
    }

    private onVisualSelection(dataPoint: SunburstDataPoint): void {
        const isSelected: boolean = !!(dataPoint && dataPoint.selected);

        this.toggleLabels(isSelected);

        if (!isSelected) {
            return;
        }

        const percentage: string = this.getFormattedValue(dataPoint.total / this.data.total, this.percentageFormatter);
        this.percentageLabel.data([percentage]);
        this.percentageLabel.style("fill", dataPoint.color);
        this.selectedCategoryLabel.data([dataPoint ? dataPoint.tooltipInfo[0].displayName : ""]);
        this.selectedCategoryLabel.style("fill", dataPoint.color);
        this.calculateLabelPosition();
    }

    private convert(
        dataView: DataView,
        colorPalette: IColorPalette,
        colorHelper: ColorHelper,
        visualHost: IVisualHost,
        formatter: IValueFormatter
    ): SunburstData {
        const data: SunburstData = {
            total: 0,
            root: null,
            dataPoints: [],
        };

        this.maxLevels = 0;

        data.root = this.covertTreeNodeToSunBurstDataPoint(
            dataView.matrix.rows.root,
            [],
            data,
            undefined,
            visualHost,
            1,
            formatter,
            dataView.matrix.rows.levels
        );

        return data;
    }

    private maxLevels: number = 0;

    public covertTreeNodeToSunBurstDataPoint(
        originParentNode: DataViewTreeNode,
        parentNodes: DataViewTreeNode[],
        data: SunburstData,
        parentColor: string,
        visualHost: IVisualHost,
        level: number,
        formatter: IValueFormatter,
        levels: DataViewHierarchyLevel[],
    ): SunburstDataPoint {

        let identityBuilder: ISelectionIdBuilder = visualHost.createSelectionIdBuilder();

        parentNodes.push(originParentNode);

        for (let i = 0; i < parentNodes.length; i++) {
            identityBuilder = identityBuilder.withMatrixNode(parentNodes[i], levels)
        }

        const identity: ISelectionId = identityBuilder.createSelectionId();

        const valueToSet: number = originParentNode.values
            ? <number>originParentNode.values[0].value
            : 0;

        const originParentNodeValue: PrimitiveValue = originParentNode.value;

        const name: string = originParentNodeValue != null
            ? `${originParentNodeValue}`
            : "";

        const newDataPointNode: SunburstDataPoint = {
            name,
            identity,
            selected: false,
            value: Math.max(valueToSet, 0),
            key: identity
                ? identity.getKey()
                : null,
            total: valueToSet,
            children: []
        };

        data.dataPoints.push(newDataPointNode);

        data.total += newDataPointNode.value;
        newDataPointNode.children = [];

        if (name && level === 2 && !originParentNode.objects) {
            const initialColor: string = this.colorPalette.getColor(name).value;
            const parsedColor: string = this.getColor(
                Sunburst.LegendPropertyIdentifier,
                initialColor,
                originParentNode.objects,
                name
            );

            newDataPointNode.color = this.colorHelper.getHighContrastColor(
                "foreground",
                parsedColor,
            );
        } else {
            newDataPointNode.color = parentColor;
        }

        if (originParentNode.children && originParentNode.children.length > 0) {
            for (const child of originParentNode.children) {
                const nodeColor: string = this.getColor(
                    Sunburst.LegendPropertyIdentifier,
                    newDataPointNode.color,
                    child.objects,
                    name
                );

                const newChild: SunburstDataPoint = this.covertTreeNodeToSunBurstDataPoint(
                    child,
                    [...parentNodes],
                    data,
                    nodeColor,
                    visualHost,
                    level + 1,
                    formatter,
                    levels,
                );

                newDataPointNode.children.push(newChild);
                newDataPointNode.total += newChild.total;
            }
        }

        newDataPointNode.tooltipInfo = this.getTooltipData(
            formatter,
            name,
            newDataPointNode.total
        );

        return newDataPointNode;
    }

    private getColor(
        properties: DataViewObjectPropertyIdentifier,
        defaultColor: string,
        objects: DataViewObjects,
        measureKey: string
    ): string {

        const colorHelper: ColorHelper = new ColorHelper(
            this.colorPalette,
            properties,
            defaultColor
        );

        return colorHelper.getColorForMeasure(objects, measureKey, "foreground");
    }

    private getTooltipData(
        formatter: IValueFormatter,
        displayName: string,
        value: number
    ): VisualTooltipDataItem[] {
        return [{
            displayName,
            value: this.getFormattedValue(value, formatter)
        }];
    }

    public getFormattedValue(value: number, formatter: IValueFormatter): string {
        return value < 0
            ? ""
            : formatter.format(value);
    }

    private parseSettings(dataView: DataView): SunburstSettings {
        const settings: SunburstSettings = SunburstSettings.parse<SunburstSettings>(dataView);

        settings.legend.labelColor = this.colorHelper.getHighContrastColor("foreground", settings.legend.labelColor);

        return settings;
    }

    private static createLegend(data: SunburstData, settings: SunburstSettings): LegendData {
        const rootCategory: SunburstDataPoint[] = data.root.children;

        const legendData: LegendData = {
            fontSize: settings.legend.fontSize,
            dataPoints: [],
            title: settings.legend.showTitle ? (settings.legend.titleText) : null,
            labelColor: settings.legend.labelColor
        };

        legendData.dataPoints = rootCategory.map((dataPoint: SunburstDataPoint) => {
            return {
                label: <string>dataPoint.name,
                color: dataPoint.color,
                icon: MarkerShape.circle,
                selected: false,
                identity: dataPoint.identity
            };
        });
        return legendData;
    }

    private calculateLabelPosition(): void {
        const innerRadius: number = Math.min(
            ...this.data.root.children.map((x: SunburstDataPoint) => Math.sqrt(x.coords.y0))
        );
        this.setPercentageLabelPosition(innerRadius);
        this.setCategoryLabelPosition(innerRadius);
    }

    private setCategoryLabelPosition(width: number): void {
        if (this.settings.group.showSelected) {
            if (this.selectedCategoryLabel) {
                const labelSize: number = this.settings.group.fontSize;
                this.selectedCategoryLabel
                    .attr(CssConstants.transformProperty, translate(0, labelSize * -Sunburst.CategoryLineInterval))
                    .style("font-size", PixelConverter.toString(labelSize))
                    .text((x: string) => x).each((d: string, i: number, groups: ArrayLike<BaseType>) => { this.wrapText(d3Select(groups[i]), Sunburst.DefaultDataLabelPadding, width); });
            }
        }
        else {
            this.selectedCategoryLabel.classed(this.appCssConstants.labelVisible.className, false);
        }
    }

    private setPercentageLabelPosition(width: number): void {
        const labelSize: number = this.settings.group.fontSize * Sunburst.PercentageFontSizeMultiplier;
        const labelTransform: number = labelSize *
            (this.settings.group.showSelected ?
                Sunburst.MultilinePercentageLineInterval :
                Sunburst.DefaultPercentageLineInterval);

        this.percentageLabel
            .attr(CssConstants.transformProperty, translate(0, labelTransform))
            .style("font-size", PixelConverter.toString(labelSize))
            .text((x: string) => x).each((d: string, i: number, groups: ArrayLike<BaseType>) => { this.wrapText(d3Select(groups[i]), Sunburst.DefaultDataLabelPadding, width); });
    }

    private renderTooltip(selection: Selection<BaseType, any, BaseType, any>): void {
        if (!this.tooltipService) {
            return;
        }

        this.tooltipService.addTooltip(
            selection,
            (data: HierarchyRectangularNode<SunburstDataPoint>) => data.data.tooltipInfo,
            (data: HierarchyRectangularNode<SunburstDataPoint>) => data.data.identity
        );
    }

    private renderContextMenu() {
        this.svg.on('contextmenu', (event) => {
            const dataPoint: any = d3Select(event.target).datum();
            this.selectionManager.showContextMenu((dataPoint && dataPoint.data && dataPoint.data.identity) ? dataPoint.data.identity : {}, {
                x: event.clientX,
                y: event.clientY
            });
            event.preventDefault();
        });
    }

    private renderLegend(): void {
        if (!this.data) {
            return;
        }

        const position: LegendPosition = this.settings.legend.show
            ? LegendPosition[this.settings.legend.position]
            : LegendPosition.None;

        this.legend.changeOrientation(position);
        this.legend.drawLegend(this.legendData, JSON.parse(JSON.stringify(this.viewport)));

        Legend.positionChartArea(this.chartWrapper, this.legend);

        switch (this.legend.getOrientation()) {
            case LegendPosition.Left:
            case LegendPosition.LeftCenter:
            case LegendPosition.Right:
            case LegendPosition.RightCenter:
                this.viewport.width -= this.legend.getMargins().width;
                break;
            case LegendPosition.Top:
            case LegendPosition.TopCenter:
            case LegendPosition.Bottom:
            case LegendPosition.BottomCenter:
                this.viewport.height -= this.legend.getMargins().height;
                break;
        }
    }

    private wrapPathText(text: string, i: number, properties: TextProperties, ellipsisWidth: number) {
        
        // let width = (<SVGPathElement>d3Select("#sliceLabel_" + i).node()).getTotalLength();

        // width = width || 0;
        const width = (<SVGPathElement>d3Select("#sliceLabel_"+i).node()).getTotalLength() || 0;
        const maxWidth = width - 2 * Sunburst.DefaultDataLabelPadding;
        let textWidth: number = textMeasurementService.measureSvgTextWidth(properties, text);
        let newText = text;

        if (maxWidth > ellipsisWidth) {
            while (textWidth > maxWidth && text.length > 0) {
                text = text.slice(0, -1);
                newText = text + "\u2026";
                textWidth = textMeasurementService.measureSvgTextWidth(properties, newText);
            }
        } else {
            newText = "";
        }

        if (textWidth > maxWidth) {
            newText = "";
        }
        return newText;
    }

    private wrapText(selection: Selection<BaseType, any, BaseType, any>, padding?: number, width?: number): void {
        const node: SVGTextElement = <SVGTextElement>selection.node();
        let textLength: number = node.getComputedTextLength(),
            text: string = selection.text();
        width = width || 0;
        padding = padding || 0;
        while (textLength > (width - 2 * padding) && text.length > 0) {
            text = text.slice(0, -1);
            selection.text(text + "\u2026");
            textLength = node.getComputedTextLength();
        }
        if (textLength > (width - 2 * padding)) {
            selection.text("");
        }
    }

    private clear(): void {
        this.main
            .selectAll("*")
            .remove();
    }
}