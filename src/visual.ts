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
module powerbi.extensibility.visual {
    // powerbi.extensibility
    import IVisual = powerbi.extensibility.IVisual;
    import IColorPalette = powerbi.extensibility.IColorPalette;
    import ISelectionManager = powerbi.extensibility.ISelectionManager;
    import VisualInitOptions = powerbi.extensibility.VisualConstructorOptions;

    // powerbi.visuals
    import ISelectionId = powerbi.visuals.ISelectionId;

    // powerbi.extensibility.utils.tooltip
    import TooltipEventArgs = powerbi.extensibility.utils.tooltip.TooltipEventArgs;
    import ITooltipServiceWrapper = powerbi.extensibility.utils.tooltip.ITooltipServiceWrapper;
    import TooltipEnabledDataPoint = powerbi.extensibility.utils.tooltip.TooltipEnabledDataPoint;
    import createTooltipServiceWrapper = powerbi.extensibility.utils.tooltip.createTooltipServiceWrapper;

    // powerbi.extensibility.utils.svg
    import translate = powerbi.extensibility.utils.svg.translate;
    import ClassAndSelector = powerbi.extensibility.utils.svg.CssConstants.ClassAndSelector;
    import createClassAndSelector = powerbi.extensibility.utils.svg.CssConstants.createClassAndSelector;

    // powerbi.extensibility.utils.formatting
    import textMeasurementService = powerbi.extensibility.utils.formatting.textMeasurementService;

    export class Sunburst implements IVisual {
        private static MinOpacity: number = 0.2;
        private static VIEWBOX_SIZE: number = 100;
        private static CENTER_POINT: number = Sunburst.VIEWBOX_SIZE / 2;
        private static OUTER_RADUIS: number = Sunburst.VIEWBOX_SIZE / 2;
        private static MIN_RADIUS: number = 10;
        private static MAX_RADIUS: number = 20;

        private visualHost: IVisualHost;

        private data: SunburstData;
        private arc: d3.svg.Arc<SunburstSlice>;

        private svg: d3.Selection<any>;
        private main: d3.Selection<SunburstSlice>;
        private percentageLabel: d3.Selection<any>;
        private selectedCategoryLabel: d3.Selection<any>;

        public static mainDrawArea: ClassAndSelector = createClassAndSelector("sunBurstDrawArea");
        public static sunBurstSelectedCategory: ClassAndSelector = createClassAndSelector("sunBurstSelectedCategory");
        public static sunBurstPercentageFixed: ClassAndSelector = createClassAndSelector("sunBurstPercentageFixed");
        public static setUnHide: ClassAndSelector = createClassAndSelector("setUnHide");

        private colors: IColorPalette;
        private selectionManager: ISelectionManager;
        private tooltipService: ITooltipServiceWrapper;

        constructor(options: VisualConstructorOptions) {
            this.visualHost = options.host;

            this.tooltipService = createTooltipServiceWrapper(
                options.host.tooltipService,
                options.element);

            this.arc = d3.svg.arc<SunburstSlice>()
                .startAngle((slice: SunburstSlice) => slice.x)
                .endAngle((slice: SunburstSlice) => slice.x + slice.dx)
                .innerRadius((slice: SunburstSlice) => Math.sqrt(slice.y))
                .outerRadius((slice: SunburstSlice) => Math.sqrt(slice.y + slice.dy));

            this.colors = options.host.colorPalette;
            this.selectionManager = options.host.createSelectionManager();

            this.svg = d3.select(options.element)
                .append("svg")
                .attr("viewBox", "0 0 " + Sunburst.VIEWBOX_SIZE + " " + Sunburst.VIEWBOX_SIZE)
                .attr("width", "100%")
                .attr("height", "100%")
                .attr("preserveAspectRatio", "xMidYMid meet")
                .classed(Sunburst.mainDrawArea.class, true);

            this.main = this.svg.append("g");
            this.main.attr("transform", translate(Sunburst.CENTER_POINT, Sunburst.CENTER_POINT));
            this.main.classed("container", true);

            this.selectedCategoryLabel = this.svg
                .append("text")
                .classed(Sunburst.sunBurstSelectedCategory.class, true);

            this.percentageLabel = this.svg.append("text")
                .classed(Sunburst.sunBurstPercentageFixed.class, true);

            this.svg.on("mousedown", (d) => {
                this.svg
                    .selectAll("path")
                    .style("opacity", 1);

                this.percentageLabel.style("opacity", 0);
                this.selectedCategoryLabel.style("opacity", 0);

                this.selectionManager.clear();
            });
        }

        private get settings(): SunburstSettings {
            return this.data && this.data.settings;
        }

        private static covertTreeNodeToSunBurstNode(
            dataView: DataView,
            originParentNode: DataViewTreeNode,
            sunburstParentNode: SunburstSlice,
            colors: IColorPalette,
            pathIdentity: DataViewScopeIdentity[],
            data: SunburstData,
            color: string,
            visualHost: IVisualHost,
            level: number): SunburstSlice {

            if (originParentNode.identity) {
                pathIdentity = pathIdentity.concat([originParentNode.identity]);
            }

            let selectionIdBuilder: visuals.ISelectionIdBuilder = visualHost.createSelectionIdBuilder();

            pathIdentity.forEach((identity: DataViewScopeIdentity) => {
                let categoryColumn: DataViewCategoryColumn = {
                    source: {
                        displayName: null,
                        queryName: identity.key
                    },
                    values: null,
                    identity: [identity]
                };

                selectionIdBuilder.withCategory(categoryColumn, 0);
            });

            let selectionId: ISelectionId = selectionIdBuilder.createSelectionId(),
                valueToSet: number = originParentNode.values
                    ? originParentNode.values[0].value as number
                    : 0;

            let newSunNode: SunburstSlice = {
                name: originParentNode.name,
                value: Math.max(valueToSet, 0),
                selector: selectionId,
                key: selectionId
                    ? selectionId.getKey()
                    : null,
                total: valueToSet,
                children: []
            };

            if (originParentNode.value) {
                newSunNode.color = color
                    ? color
                    : colors.getColor(originParentNode.value.toString()).value;
            }

            data.total += newSunNode.value;
            newSunNode.children = [];

            if (originParentNode.children && originParentNode.children.length > 0) {
                newSunNode.tooltipInfo = Sunburst.getTooltipData(originParentNode.value, -1);
                for (let i: number = 0, iLen: number = originParentNode.children.length; i < iLen; i++) {
                    let newChild = Sunburst.covertTreeNodeToSunBurstNode(
                        dataView,
                        originParentNode.children[i],
                        newSunNode,
                        colors,
                        pathIdentity,
                        data,
                        newSunNode.color,
                        visualHost,
                        level + 1);

                    newSunNode.children.push(newChild);
                    newSunNode.total += newChild.total;
                }
            }
            else {
                newSunNode.tooltipInfo = Sunburst.getTooltipData(
                    originParentNode.value,
                    valueToSet);
            }

            if (sunburstParentNode) {
                newSunNode.parent = sunburstParentNode;
            }

            return newSunNode;
        }

        private static getTooltipData(displayName: any, value: number): VisualTooltipDataItem[] {
            return [{
                displayName,
                value: value < 0
                    ? ""
                    : value.toString()
            }];
        }

        public static converter(dataView: DataView, colors: IColorPalette, visualHost: IVisualHost): SunburstData {
            let settings: SunburstSettings = Sunburst.parseSettings(dataView);

            let data: SunburstData = {
                total: 0,
                settings: settings,
                root: null
            };

            data.root = Sunburst.covertTreeNodeToSunBurstNode(dataView, dataView.matrix.rows.root, null, colors, [], data, undefined, visualHost, 1);
            return data;
        }

        public static parseSettings(dataView: DataView): SunburstSettings {
            return SunburstSettings.parse<SunburstSettings>(dataView);
        }

        private static setAllUnhide(selection): void {
            selection.attr("setUnHide", "true");
        }

        public update(options: VisualUpdateOptions): void {
            if (options.type !== VisualUpdateType.Data) {
                return;
            }

            if (!options
                || !options.dataViews
                || !options.dataViews[0]
                || !options.dataViews[0].matrix
                || !options.dataViews[0].matrix.rows
                || !options.dataViews[0].matrix.rows.root
                || !options.dataViews[0].matrix.rows.root.children
                || !options.dataViews[0].matrix.rows.root.children.length) {
                this.clear();
                return;
            }

            this.data = Sunburst.converter(options.dataViews[0], this.colors, this.visualHost);
            this.updateInternal();
        }

        private updateInternal(): void {

            let partition: d3.layout.Partition<d3.layout.partition.Node> = d3.layout.partition()
                .size([2 * Math.PI, Sunburst.OUTER_RADUIS * Sunburst.OUTER_RADUIS])
                .value((d) => {
                    return d.value;
                });

            let pathSelection: d3.selection.Update<TooltipEnabledDataPoint> = this.main.datum<SunburstSlice>(this.data.root)
                .selectAll("path")
                .data<SunburstSlice>(partition.nodes as any);

            pathSelection
                .enter()
                .append("path");

            pathSelection
                .style("display", (slice: SunburstSlice) => {
                    return slice.depth ? null : "none";
                })
                .attr("d", this.arc)
                .style("stroke", "#fff")
                .style("fill", (d: SunburstSlice) => { return d.color; })
                .style("fill-rule", "evenodd")
                .on("mousedown", (d: SunburstSlice) => {
                    if (d.selector) {
                        this.selectionManager.select(d.selector);
                    }

                    // TODO: why do we need to do this lie below?
                    d3.selectAll("path") // TODO: we shouldn't find all paths in the DOM.
                        .call(Sunburst.setAllUnhide)
                        .attr(Sunburst.setUnHide.class, null);

                    this.highlightPath(d, this, true);
                    let percentage: number | string = this.data.total === 0 ? 0 : (100 * d.total / this.data.total).toPrecision(3);
                    this.percentageLabel.data([d ? percentage + "%" : ""]);
                    this.percentageLabel.style("fill", d.color);

                    this.selectedCategoryLabel.data([d ? d.tooltipInfo[0].displayName : ""]);
                    this.selectedCategoryLabel.style("fill", d.color);

                    this.onResize();

                    (d3.event as MouseEvent).stopPropagation();
                });

            this.renderTooltip(pathSelection);

            pathSelection
                .exit()
                .remove();

            this.onResize();
        }

        // Get all parents of the node
        private static getTreePath(node): Array<any> {
            let path: any = [],
                current = node;

            while (current.parent) {
                path.unshift(current);
                current = current.parent;
            }

            return path;
        }

        private onResize(): void {
            let innerRadius: number = _.min(this.data.root.children.map(x => this.arc.innerRadius()(x, undefined))),
                minRadiusToShowLabels = this.data.settings.group.showSelected ? Sunburst.MAX_RADIUS : Sunburst.MIN_RADIUS,
                startHeight: number = Sunburst.CENTER_POINT - innerRadius;

            let getChord = (height: number, fontSize: number) => {
                return innerRadius < minRadiusToShowLabels ? 0 : (innerRadius - fontSize / 2) * 2;
            };

            this.setPercentageLabelPosition(getChord);
            this.setSelectedCategoryLabelPosition(getChord);
        }

        private setPercentageLabelPosition(getChord: (height: number, fontSize: number) => number): void {
            this.percentageLabel.text(x => x);

            let height = Sunburst.CENTER_POINT + (this.data.settings.group.showSelected ? this.data.settings.group.labelSize : 0);

            let percentageLabelElement: SVGTextElement = this.percentageLabel[0][0] as SVGTextElement;

            textMeasurementService.svgEllipsis(percentageLabelElement, getChord(height, this.data.settings.group.labelSize * 2));
            let textWidth: number = textMeasurementService.measureSvgTextElementWidth(percentageLabelElement);

            this.percentageLabel.style("opacity", 1);
            this.percentageLabel.attr("x", Sunburst.CENTER_POINT);
            this.percentageLabel.attr("y", height);
            this.percentageLabel.attr("text-anchor", "middle");
            this.percentageLabel.attr("font-size", this.data.settings.group.labelSize * 2);
        }

        private setSelectedCategoryLabelPosition(getChord: (height: number, fontSize: number) => number): void {

            if (this.selectedCategoryLabel) {

                this.selectedCategoryLabel.text(x => x);

                let height: number = Sunburst.CENTER_POINT - this.data.settings.group.labelSize,
                    selectedCategoryLabelElement: SVGTextElement = this.selectedCategoryLabel[0][0] as SVGTextElement;

                textMeasurementService.svgEllipsis(selectedCategoryLabelElement, getChord(height, this.data.settings.group.labelSize));
                let textWidth: number = textMeasurementService.measureSvgTextElementWidth(selectedCategoryLabelElement);


                this.selectedCategoryLabel.style("opacity", this.data.settings.group.showSelected ? 1 : 0);
                this.selectedCategoryLabel.attr("x", Sunburst.CENTER_POINT);
                this.selectedCategoryLabel.attr("y", height);
                this.selectedCategoryLabel.attr("text-anchor", "middle");
                this.selectedCategoryLabel.attr("font-size", this.data.settings.group.labelSize);

            }
        }

        private highlightPath(d, sunBurst, setUnhide): void {
            let parentsArray: any = d ? Sunburst.getTreePath(d) : [];

            // Set opacity for all the segments.
            sunBurst.svg.selectAll("path").each(function () {
                if (d3.select(this).attr("setUnHide") !== "true") {
                    d3.select(this).style("opacity", Sunburst.MinOpacity);
                }
            });

            // Highlight only ancestors of the current segment.
            sunBurst.svg.selectAll("path")
                .filter(function (node) {
                    return (parentsArray.indexOf(node) >= 0);
                }).each(function () {
                    d3.select(this).style("opacity", 1);
                    if (setUnhide === true) {
                        d3.select(this).attr("setUnHide", "true");
                    }
                });
        }

        private renderTooltip(selection: d3.selection.Update<TooltipEnabledDataPoint>): void {
            if (!this.tooltipService) {
                return;
            }

            this.tooltipService.addTooltip(selection, (tooltipEvent: TooltipEventArgs<SunburstSlice>) => {
                return tooltipEvent.data.tooltipInfo;
            });
        }

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
            return SunburstSettings.enumerateObjectInstances(
                this.settings || SunburstSettings.getDefault(),
                options);
        }

        private clear(): void {
            this.main
                .select(Sunburst.mainDrawArea.selector)
                .selectAll(Sunburst.mainDrawArea.selector)
                .remove();
        }

    }
}
