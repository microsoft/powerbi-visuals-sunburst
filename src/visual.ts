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
    import ISelectionManager = powerbi.extensibility.ISelectionManager;
    import IVisual = powerbi.extensibility.IVisual;
    import IColorPalette = powerbi.extensibility.IColorPalette;
    import VisualInitOptions = powerbi.extensibility.VisualConstructorOptions;

    // powerbi.visuals
    import ISelectionHandler = powerbi.visuals.ISelectionHandler;
    import ISelectionId = powerbi.visuals.ISelectionId;
    import ITooltipService = powerbi.visuals.ITooltipService;
    import createTooltipService = powerbi.visuals.createTooltipService;
    import TooltipEnabledDataPoint = powerbi.visuals.TooltipEnabledDataPoint;
    import TooltipDataItem = powerbi.visuals.TooltipDataItem;
    import TooltipEventArgs = powerbi.visuals.TooltipEventArgs;

    export const sunburstRoleNames = {
        nodes: 'Nodes',
        values: 'Values',
    };

    export class Sunburst implements IVisual {
        private static MinOpacity: number = 0.2;
        private visualHost: IVisualHost;
        private static RoleNames = {
            nodes: 'Nodes',
            values: 'Values',
        };

        private viewport: IViewport;

        private data: SunburstData;
        private arc: d3.svg.Arc<SunburstSlice>;

        private svg: d3.Selection<any>;
        private main: d3.Selection<SunburstSlice>;
        private percentageLabel: d3.Selection<any>;
        private selectedCategoryLabel: d3.Selection<any>;
        public static mainDrawArea: jsCommon.CssConstants.ClassAndSelector = jsCommon.CssConstants.createClassAndSelector('mainDrawArea');
        public static sunBurstSelectedCategory: jsCommon.CssConstants.ClassAndSelector = jsCommon.CssConstants.createClassAndSelector('sunBurstSelectedCategory');
        public static sunBurstPercentageFixed: jsCommon.CssConstants.ClassAndSelector = jsCommon.CssConstants.createClassAndSelector('sunBurstPercentageFixed');
        public static setUnHide: jsCommon.CssConstants.ClassAndSelector = jsCommon.CssConstants.createClassAndSelector('setUnHide');
        
        private colors: IColorPalette;
        private selectionManager: ISelectionManager;
        private tooltipService: ITooltipService;

        constructor(options: VisualConstructorOptions) {
            this.visualHost = options.host;

            this.tooltipService = createTooltipService(options.host);

            this.arc = d3.svg.arc<SunburstSlice>()
                .startAngle((slice: SunburstSlice) => slice.x)
                .endAngle((slice: SunburstSlice) => slice.x + slice.dx)
                .innerRadius((slice: SunburstSlice) => Math.sqrt(slice.y))
                .outerRadius((slice: SunburstSlice) => Math.sqrt(slice.y + slice.dy));

            this.colors = options.host.colorPalette;
            this.selectionManager = options.host.createSelectionManager();

            this.svg = d3.select(options.element)
                .append("svg")
                .classed(Sunburst.mainDrawArea.class, true);

            this.main = this.svg.append('g');
            this.main.classed("container", true);

            this.selectedCategoryLabel = this.svg
                .append("text")
                .classed(Sunburst.sunBurstSelectedCategory.class, true);

            this.percentageLabel = this.svg.append("text")
                .classed(Sunburst.sunBurstPercentageFixed.class, true);

            this.svg.on('mousedown', (d) => {
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
                }

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
                total: valueToSet
            };

            if (originParentNode.value) {
                newSunNode.color = color
                    ? color
                    : colors.getColor(originParentNode.value.toString()).value;
            }

            data.total += newSunNode.value;
            if (originParentNode.children && originParentNode.children.length > 0) {

                newSunNode.tooltipInfo = Sunburst.getTooltipData(originParentNode.value, -1);

                newSunNode.children = [];
                for (let i: number = 0, iLen: number = originParentNode.children.length; i < iLen; i++) {
                    var newChild = Sunburst.covertTreeNodeToSunBurstNode(
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

        private static getTooltipData(displayName: any, value: number): TooltipDataItem[] {
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
            if (options.dataViews === undefined || options.dataViews === null || options.dataViews.length < 1 || options.dataViews[0] === null) {
                this.clear();
                return;
            }

            this.data = Sunburst.converter(options.dataViews[0], this.colors, this.visualHost);
            this.viewport = options.viewport;
            this.updateInternal();
        }

        private updateInternal(): void {
            this.svg.attr({
                'height': this.viewport.height,
                'width': this.viewport.width
            });

            this.main.attr('transform', visuals.SVGUtil.translate(
                this.viewport.width / 2,
                this.viewport.height / 2));

            let radius:number = Math.min(this.viewport.width, this.viewport.height) / 2;

            let partition: d3.layout.Partition<d3.layout.partition.Node> = d3.layout.partition()
                .size([2 * Math.PI, radius * radius])
                .value((d) => {
                    return d.value;
                });

            let pathSelection: any = this.main.datum<SunburstSlice>(this.data.root)
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
                    let percentage:number|string = this.data.total === 0 ? 0 : (100 * d.total / this.data.total).toPrecision(3);
                    this.percentageLabel.data([d ? percentage + "%" : ""]);
                    this.percentageLabel.style("fill", d.color);

                    this.selectedCategoryLabel.data([d ? d.tooltipInfo[0].displayName : ""])
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
        private static getTreePath(node) {
            let path: any = [],
                current = node;

            while (current.parent) {
                path.unshift(current);
                current = current.parent;
            }

            return path;
        }
        private static minRadius: number = 10;
        private static maxRadius: number = 20;
        private onResize(): void {
            let innerRadius:number = _.min(this.data.root.children.map(x => this.arc.innerRadius()(x, undefined))),
                minRadiusToShowLabels = this.data.settings.group.showSelected ? Sunburst.maxRadius : Sunburst.minRadius,
                startHeight: any = (this.viewport.height - innerRadius * 2) / 2;

            let getCenterY:any = (multipler: number) => startHeight + innerRadius * 2 * multipler;

            let getChord:any = (height: number) => {
                var heightInChord = height - startHeight;
                return innerRadius < minRadiusToShowLabels ? 0 : (heightInChord < innerRadius
                    ? heightInChord
                    : innerRadius * 2 - heightInChord) * 2;
            };

            this.setPercentageLabelPosition(getCenterY, getChord);
            this.setSelectedCategoryLabelPosition(getCenterY, getChord);
        }

        private static center04: number = 0.4;
        private static center05: number = 0.5;
        private static center06: number = 0.6;
        private static number4: number = 4;
        private static number5: number = 5;
        private setPercentageLabelPosition(getCenterY: (height: number) => number, getChord: (height: number) => number): void {
            this.percentageLabel.text(x => x);

            var height = this.data.settings.group.showSelected
                ? getCenterY(Sunburst.center06) + Sunburst.number4
                : getCenterY(Sunburst.center05) + Sunburst.number4;

            let percentageLabelElement: SVGTextElement = this.percentageLabel[0][0] as SVGTextElement;

            TextMeasurementService.svgEllipsis(percentageLabelElement, getChord(height) + Sunburst.number5);
            let textWidth:number = TextMeasurementService.measureSvgTextElementWidth(percentageLabelElement);

            this.percentageLabel.style("opacity", 1);
            this.percentageLabel.attr("y", height);
            this.percentageLabel.attr("x", ((this.viewport.width / 2) - (textWidth / 2)));
        }

        private setSelectedCategoryLabelPosition(getCenterY: (height: number) => number, getChord: (height: number) => number): void {

            if (this.selectedCategoryLabel) {

                this.selectedCategoryLabel.text(x => x);

                let height: number = getCenterY(Sunburst.center04) - Sunburst.number4,
                    selectedCategoryLabelElement: SVGTextElement = this.selectedCategoryLabel[0][0] as SVGTextElement;

                TextMeasurementService.svgEllipsis(selectedCategoryLabelElement, getChord(height) + Sunburst.number5);
                let textWidth: number = TextMeasurementService.measureSvgTextElementWidth(selectedCategoryLabelElement);

                this.selectedCategoryLabel.style("opacity", this.data.settings.group.showSelected ? 1 : 0);
                this.selectedCategoryLabel.attr("y", height);
                this.selectedCategoryLabel.attr("x", ((this.viewport.width / 2) - (textWidth / 2)));
            }
        }

        private highlightPath(d, sunBurst, setUnhide): void {
            let parentsArray:any = d ? Sunburst.getTreePath(d) : [];

            // Set opacity for all the segments.
            sunBurst.svg.selectAll("path").each(function () {
                if (d3.select(this).attr('setUnHide') !== 'true') {
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
                        d3.select(this).attr('setUnHide', 'true');
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
