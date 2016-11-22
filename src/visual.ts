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
    //import SelectionManager = utility.SelectionManager;
    import ISelectionHandler = powerbi.visuals.ISelectionHandler;
    import IVisual = powerbi.extensibility.IVisual;
    import IDataColorPalette = powerbi.extensibility.IColorPalette;
    import ISelectionId = powerbi.visuals.ISelectionId;
    import VisualInitOptions = powerbi.extensibility.VisualConstructorOptions;


    export interface SunburstGroupSettings {
        showSelected?: boolean;
    }

    export interface SunburstSlice extends d3.layout.partition.Node{
        Children?: SunburstSlice[];
        value?: any;
        color?: string;
        name?: PrimitiveValue;
        parent?: SunburstSlice;
        selector: ISelectionId;
        total: number;
        key: string;
       // tooltipInfo?: TooltipDataItem[];
    }

    export interface SunburstViewModel {
        root: SunburstSlice;
    }

    export var sunburstRoleNames = {
        nodes: 'Nodes',
        values: 'Values',
    };

    export class Sunburst implements IVisual {
        private static MinOpacity = 0.2;
        private visualHost: IVisualHost;
        private static RoleNames = {
            nodes: 'Nodes',
            values: 'Values',
        };

        private get settings(): SunburstSettings {
            return this.data && this.data.settings;
        }

        private static covertTreeNodeToSunBurstNode(
            dataView: DataView,
            originParentNode: DataViewTreeNode,
            sunburstParentNode: SunburstSlice,
            colors: IDataColorPalette,
            pathIdentity: DataViewScopeIdentity[],
            data: SunburstData,
            color, visualHost: IVisualHost): SunburstSlice {
                
            var selector: powerbi.data.Selector;
            if (originParentNode.identity) {
                pathIdentity = pathIdentity.concat([originParentNode.identity]);
                selector = { data: pathIdentity, };
            }

            let categorical = SunburstColumns.getCategoricalColumns(dataView);
            let selectionId: ISelectionId = pathIdentity.length === 0 ? null : visualHost.createSelectionIdBuilder()
                .withCategory(categorical.Category, i)
                .withMeasure(categorical.Category.source.queryName)
                .createSelectionId();


           // var selectionId = pathIdentity.length === 0 ? null : new ISelectionId(selector, false);
            let valueToSet:number = originParentNode.values ? originParentNode.values[0].value : 0;
            
            let newSunNode: SunburstSlice = {
                name: originParentNode.name,
                value: Math.max(valueToSet, 0),
                selector: selectionId,
                key: selectionId ? (selectionId as ISelectionId).getKey() : null,
                total: valueToSet
            };
            if (originParentNode.value) {
                newSunNode.color = color ? color : colors.getColor(originParentNode.value).value;
            }
            
            data.total += newSunNode.value;
            if (originParentNode.children && originParentNode.children.length > 0) {

               // newSunNode.tooltipInfo = Sunburst.getTooltipData(originParentNode.value, -1);

                newSunNode.Children = [];
                for (var i = 0; i < originParentNode.children.length; i++) {
                    var newChild = Sunburst.covertTreeNodeToSunBurstNode(
                        dataView,
                        originParentNode.children[i],
                        newSunNode,
                        colors,
                        pathIdentity,
                        data,
                        newSunNode.color,
                        visualHost);
                        
                    newSunNode.Children.push(newChild);
                    newSunNode.total += newChild.total;
                }
            }
            //else {
            //    newSunNode.tooltipInfo = Sunburst.getTooltipData(originParentNode.value, valueToSet);
            //}
            if (sunburstParentNode) {
                newSunNode.parent = sunburstParentNode;
            }

            return newSunNode;
        }

        public static converter(dataView: DataView, colors: IDataColorPalette, visualHost: IVisualHost): SunburstData {
            let categorical = SunburstColumns.getCategoricalColumns(dataView);
            let catValues = SunburstColumns.getCategoricalValues(dataView);
            if (!categorical
                || !categorical.Category
                || _.isEmpty(categorical.Category.values)
                || _.isEmpty(categorical.Y)
                || _.isEmpty(categorical.Y[0].values)) {
                return;
            }
            let settings: SunburstSettings = Sunburst.parseSettings(dataView, categorical.Category.source);

            var data: SunburstData = {
                total: 0,
                settings: settings,
                root: null
            };
            
            data.root = Sunburst.covertTreeNodeToSunBurstNode(dataView, dataView.matrix.rows.root, null, colors, [], data, undefined, visualHost );
            return data;
        }
        
        public static parseSettings(dataView: DataView, categorySource: DataViewMetadataColumn): SunburstSettings {
            let settings: SunburstSettings = powerbi.extensibility.visual.settingsParser.SettingsParser.parse<SunburstSettings>(dataView);

            settings.labels.precision = Math.min(17, Math.max(0, settings.labels.precision));
            settings.outerLine.thickness = Math.min(25, Math.max(1, settings.outerLine.thickness));

            if (_.isEmpty(settings.legend.titleText)) {
                settings.legend.titleText = categorySource.displayName;
            }

            return settings;
        }
        
        private static setAllUnhide(selection): void {
            selection.attr("setUnHide", "true");
        }
        
        private svg: d3.Selection<any>;
        private percentageLabel: d3.Selection<any>;
        private selectedCategoryLabel: d3.Selection<any>;
        private data: SunburstData;
        private g: d3.Selection<SunburstSlice>;
        private arc: d3.svg.Arc<any>;
        private viewport: IViewport;
        private colors: IDataColorPalette;
        private selectionManager: ISelectionHandler;
        
        constructor(options: VisualConstructorOptions) {
            this.visualHost = options.host;
            this.arc = d3.svg.arc();
                //.startAngle(function (d) { return d.startAngle; })
                //.endAngle(function (d) { return d.endAngle; })
                //.innerRadius(function (d) { return Math.sqrt(d.y); })
                //.outerRadius(function (d) { return Math.sqrt(d.y + d.dy); });

            this.colors = options.host.colorPalette;
            //this.selectionManager = new SelectionManager({ hostServices: options.host });
            //this.svg = d3.select(options.element.get(0)).append('svg');

            let svg: d3.Selection<any> = this.svg = d3.select(options.element)
                .append("svg")
                .classed('mainDrawArea', true);
                //.style("position", "absolute");
            
            this.g = this.svg.append('g');
            this.g.classed("container", true);
            this.selectedCategoryLabel = this.svg.append("text")
                .classed("sunBurstSelectedCategory", true);
            this.percentageLabel = this.svg.append("text")
                .classed("sunBurstPercentageFixed", true);

            this.svg.on('mousedown', (d) => {
                this.svg.selectAll("path").style("opacity", 1);
                this.percentageLabel.style("opacity", 0);
                this.selectedCategoryLabel.style("opacity", 0);
                //this.selectionManager.clear();
            });
        }

        public update(options: VisualUpdateOptions): void {
            if (options.dataViews.length > 0) {
                this.data = Sunburst.converter(options.dataViews[0], this.colors, this.visualHost);
                this.viewport = options.viewport;
                this.updateInternal();
            }
        }
        
        private updateInternal(): void {
            this.svg.attr({
                'height': this.viewport.height,
                'width': this.viewport.width
            });
            this.g.attr('transform', visuals.SVGUtil.translate(this.viewport.width / 2, this.viewport.height / 2));
            var radius = Math.min(this.viewport.width, this.viewport.height) / 2;
            var partition = d3.layout.partition<SunburstSlice>()
                .size([2 * Math.PI, radius * radius])
                .value((d) => { return d.value; });
            var path = this.g.datum(this.data.root).selectAll("path")
                .data<SunburstSlice>(partition.nodes);
            path.enter().append("path");
            path.attr("display", (d) => { return d.depth ? null : "none"; })
                .attr("d", this.arc)
                .style("stroke", "#fff")
                .style("fill", (d) => { return d.color; })
                .style("fill-rule", "evenodd")
                .on("mousedown", (d) => {
                    if (d.selector) {
                        this.selectionManager.select(d.selector);
                    }
                    
                    d3.selectAll("path").call(Sunburst.setAllUnhide).attr('setUnHide', null);
                    this.highlightPath(d, this, true);
                    var percentage = this.data.total === 0 ? 0 : (100 * d.total / this.data.total).toPrecision(3);
                    this.percentageLabel.data([d ? percentage + "%" : ""]);
                    this.percentageLabel.style("fill", d.color);
                    
                    //this.selectedCategoryLabel.data([d ? d.tooltipInfo[0].displayName : ""])
                    this.selectedCategoryLabel.style("fill", d.color);
                    
                    this.onResize();
                    event.stopPropagation();
                });
            //this.renderTooltip(path);
            path.exit().remove();
            
            this.onResize();
        }

        // Get all parents of the node
        private static getTreePath(node) {
            var path = [];
            var current = node;
            while (current.parent) {
                path.unshift(current);
                current = current.parent;
            }
            return path;
        }

        private onResize(): void {
            var innerRadius = _.min(this.data.root.Children.map(x => this.arc.innerRadius));
            var minRadiusToShowLabels = this.data.settings.labels.show ? 20 : 10;
            var startHeight:any = (this.viewport.height - innerRadius * 2) / 2;
            
            var getCenterY = (multipler: number) => startHeight
                + innerRadius * 2 * multipler;
            var getChord = (height: number) => {
                var heightInChord = height - startHeight;
                return innerRadius < minRadiusToShowLabels ? 0 : (heightInChord < innerRadius
                    ? heightInChord
                    : innerRadius * 2 - heightInChord) * 2;
            };
                
            this.setPercentageLabelPosition(getCenterY, getChord);
            this.setSelectedCategoryLabelPosition(getCenterY, getChord);
        }
        
        private setPercentageLabelPosition(getCenterY: (height: number) => number, getChord: (height: number) => number): void {
            this.percentageLabel.text(x => x);

            var height = this.data.settings.labels.show
                ? getCenterY(0.6) + 4
                : getCenterY(0.5) + 4;
            
            TextMeasurementService.svgEllipsis(this.percentageLabel[0][0], getChord(height) + 5);
            var textWidth = TextMeasurementService.measureSvgTextElementWidth(this.percentageLabel[0][0]);
            var textHeight = TextMeasurementService.measureSvgTextHeight(this.percentageLabel[0][0]);
            
            this.percentageLabel.style("opacity", 1);
            this.percentageLabel.attr("y", height);
            this.percentageLabel.attr("x", ((this.viewport.width / 2) - (textWidth / 2)));
        }
        
        private setSelectedCategoryLabelPosition(getCenterY: (height: number) => number, getChord: (height: number) => number): void {
            this.selectedCategoryLabel.text(x => x);
            
            var height = getCenterY(0.4) - 4;
            TextMeasurementService.svgEllipsis(this.selectedCategoryLabel[0][0], getChord(height) + 5);
            var textWidth = TextMeasurementService.measureSvgTextElementWidth(this.selectedCategoryLabel[0][0]);
            var textHeight = TextMeasurementService.measureSvgTextHeight(this.selectedCategoryLabel[0][0]);

            this.selectedCategoryLabel.style("opacity", this.data.settings.labels.show ? 1 : 0);
            this.selectedCategoryLabel.attr("y", height);
            this.selectedCategoryLabel.attr("x", ((this.viewport.width / 2) - (textWidth / 2)));
        }

        private highlightPath(d, sunBurst, setUnhide): void {
            var parentsArray = d ? Sunburst.getTreePath(d) : [];
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

        //private renderTooltip(selection: d3.UpdateSelection): void {
        //    TooltipManager.addTooltip(selection, (tooltipEvent: TooltipEvent) => {
        //        return (<SunburstSlice>tooltipEvent.data).tooltipInfo;
        //    });
        //}
        
        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
            return SunburstSettings.enumerateObjectInstances(
                this.settings || SunburstSettings.getDefault(),
                options);
        }

        //public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions)
        //    : VisualObjectInstance[] {
        //    var instances: VisualObjectInstance[] = [];
        //    var settings = this.data && this.data.settings;
            
        //    switch (settings && options.objectName) {
        //        case "group":
        //            instances.push({
        //                objectName: options.objectName,
        //                selector: null,
        //                properties:  <any>settings.group
        //            });
        //            break;
        //    }
            
        //    return  instances;
        //}
    }
}
