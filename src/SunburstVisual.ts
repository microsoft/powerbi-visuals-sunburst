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

    // powerbi.visuals
    import ISelectionId = powerbi.visuals.ISelectionId;

    // powerbi.extensibility.utils.tooltip
    import TooltipEventArgs = powerbi.extensibility.utils.tooltip.TooltipEventArgs;
    import ITooltipServiceWrapper = powerbi.extensibility.utils.tooltip.ITooltipServiceWrapper;
    import TooltipEnabledDataPoint = powerbi.extensibility.utils.tooltip.TooltipEnabledDataPoint;
    import createTooltipServiceWrapper = powerbi.extensibility.utils.tooltip.createTooltipServiceWrapper;

    // powerbi.extensibility.utils.svg
    import translate = powerbi.extensibility.utils.svg.translate;
    import CssConstants = powerbi.extensibility.utils.svg.CssConstants;
    import ClassAndSelector = powerbi.extensibility.utils.svg.CssConstants.ClassAndSelector;
    import createClassAndSelector = powerbi.extensibility.utils.svg.CssConstants.createClassAndSelector;

    interface IAppCssConstants {
        main: ClassAndSelector;
        mainInteractive: ClassAndSelector;
        slice: ClassAndSelector;
        sliceSelected: ClassAndSelector;
        label: ClassAndSelector;
        labelVisible: ClassAndSelector;
        categoryLabel: ClassAndSelector;
        percentageLabel: ClassAndSelector;
    }

    export class Sunburst implements IVisual {
        private static ViewBoxSize: number = 500;
        private static CentralPoint: number = Sunburst.ViewBoxSize / 2;
        private static OuterRadius: number = Sunburst.ViewBoxSize / 2;
        private static PercentageFontSizeMultiplier: number = 2;
        private static CategoryLineInterval: number = 0.6;
        private static DefaultPercentageLineInterval: number = 0.25;
        private static MultilinePercentageLineInterval: number = 0.6;

        private static ChangeDataType: number = 2;
        private static ChangeAllType: number = 62;

        private _labelsHidden: boolean = true;
        private set labelsHidden(hidden: boolean) {
            this._labelsHidden = hidden;
            this.percentageLabel.classed(this.appCssConstants.labelVisible.class, !hidden);
            this.selectedCategoryLabel.classed(this.appCssConstants.labelVisible.class, !hidden && this.settings.group.showSelected);
        }
        private _settings: SunburstSettings;
        private get settings(): SunburstSettings {
            return this._settings;
        }
        private set settings(settings: SunburstSettings) {
            if (!this._settings
                || this.settings.group.fontSize !== settings.group.fontSize
                || this.settings.group.showSelected !== settings.group.showSelected) {
                this._settings = settings;
                if (this.labelsHidden) {
                    return;
                }
                this.svg.style(CssConstants.fontSizeProperty, `${settings.group.fontSize}px`);
                this.selectedCategoryLabel.classed(this.appCssConstants.labelVisible.class, this.settings.group.showSelected);
                this.calculateLabelPosition();
            }
        }
        private visualHost: IVisualHost;
        private rawData: DataViewMatrix;
        private data: SunburstData;
        private arc: d3.svg.Arc<SunburstSlice>;
        private svg: d3.Selection<{}>;
        private main: d3.Selection<{}>;
        private percentageLabel: d3.Selection<string>;
        private selectedCategoryLabel: d3.Selection<string>;

        private appCssConstants: IAppCssConstants = {
            main: createClassAndSelector("sunburst"),
            mainInteractive: createClassAndSelector("sunburst--interactive"),
            slice: createClassAndSelector("sunburst__slice"),
            sliceSelected: createClassAndSelector("sunburst__slice--selected"),
            label: createClassAndSelector("sunburst__label"),
            labelVisible: createClassAndSelector("sunburst__label--visible"),
            categoryLabel: createClassAndSelector("sunburst__category-label"),
            percentageLabel: createClassAndSelector("sunburst__percentage-label")
        };
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
                .attr("viewBox", `0 0 ${Sunburst.ViewBoxSize}  ${Sunburst.ViewBoxSize}`)
                .attr("width", "100%")
                .attr("height", "100%")
                .attr("preserveAspectRatio", "xMidYMid meet")
                .classed(this.appCssConstants.main.class, true);

            this.main = this.svg.append("g");
            this.main.attr(CssConstants.transformProperty, translate(Sunburst.CentralPoint, Sunburst.CentralPoint));

            this.selectedCategoryLabel = <d3.Selection<string>>this.svg
                .append("text")
                .classed(this.appCssConstants.label.class, true)
                .classed(this.appCssConstants.categoryLabel.class, true);
            this.selectedCategoryLabel.attr("x", Sunburst.CentralPoint);
            this.selectedCategoryLabel.attr("y", Sunburst.CentralPoint);

            this.percentageLabel = <d3.Selection<string>>this.svg
                .append("text")
                .classed(this.appCssConstants.label.class, true)
                .classed(this.appCssConstants.percentageLabel.class, true);
            this.percentageLabel.attr("x", Sunburst.CentralPoint);
            this.percentageLabel.attr("y", Sunburst.CentralPoint);

            this.svg.on("click", () => {
                this.svg
                    .classed(this.appCssConstants.mainInteractive.class, false);
                this.labelsHidden = true;
                this.selectionManager.clear();
            });
        }

        public update(options: VisualUpdateOptions): void {
            if (options.type !== Sunburst.ChangeDataType && options.type !== Sunburst.ChangeAllType) {
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
            if (!_.isEqual(this.rawData, options.dataViews[0].matrix)) {
                this.rawData = options.dataViews[0].matrix;
                this.data = this.convert(options.dataViews[0], this.colors, this.visualHost);
                this.updateInternal();
            }
            this.settings = this.parseSettings(options.dataViews[0]);
        }

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
            return SunburstSettings.enumerateObjectInstances(
                this.settings || SunburstSettings.getDefault(),
                options);
        }

        private updateInternal(): void {
            const partition: d3.layout.Partition<d3.layout.partition.Node> = d3.layout.partition()
                .size([2 * Math.PI, Sunburst.OuterRadius * Sunburst.OuterRadius])
                .value((d: d3.layout.partition.Node) => {
                    return d.value;
                });
            const pathSelection: d3.selection.Update<TooltipEnabledDataPoint> = this.main.datum<SunburstSlice>(this.data.root)
                .selectAll("path")
                // tslint:disable-next-line:no-any
                .data<SunburstSlice>(<any>partition.nodes);
            pathSelection
                .enter()
                .append("path")
                .classed(this.appCssConstants.slice.class, true);

            pathSelection
                .style("display", (slice: SunburstSlice) => {
                    return slice.depth ? null : "none";
                })
                .attr("d", this.arc)
                .style("fill", (d: SunburstSlice) => { return d.color; })
                .on("click", (d: SunburstSlice) => {
                    if (d.selector) {
                        this.selectionManager.select(d.selector);
                    }

                    this.highlightPath(d, this, true);
                    const percentage: string = this.data.total === 0 ? "" : `${(100 * d.total / this.data.total).toPrecision(3)}%`;
                    this.percentageLabel.data([percentage]);
                    this.percentageLabel.style("fill", d.color);

                    this.selectedCategoryLabel.data([d ? d.tooltipInfo[0].displayName : ""]);
                    this.selectedCategoryLabel.style("fill", d.color);

                    this.calculateLabelPosition();
                    this.labelsHidden = false;

                    (<MouseEvent>(d3.event)).stopPropagation();
                });
            this.renderTooltip(pathSelection);

            pathSelection
                .exit()
                .remove();
        }

        private convert(dataView: DataView, colors: IColorPalette, visualHost: IVisualHost): SunburstData {
            const data: SunburstData = {
                total: 0,
                root: null
            };

            data.root = this.covertTreeNodeToSunBurstNode(
                dataView.matrix.rows.root, null,
                colors, [], data,
                undefined, visualHost, 1);
            return data;
        }

        private covertTreeNodeToSunBurstNode(
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

            const selectionIdBuilder: visuals.ISelectionIdBuilder = visualHost.createSelectionIdBuilder();

            pathIdentity.forEach((identity: DataViewScopeIdentity) => {
                const categoryColumn: DataViewCategoryColumn = {
                    source: {
                        displayName: null,
                        queryName: identity.key
                    },
                    values: null,
                    identity: [identity]
                };

                selectionIdBuilder.withCategory(categoryColumn, 0);
            });

            const selectionId: ISelectionId = selectionIdBuilder.createSelectionId();
            const valueToSet: number = originParentNode.values
                ? <number>originParentNode.values[0].value
                : 0;

            const newSunNode: SunburstSlice = {
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
                newSunNode.tooltipInfo = this.getTooltipData(<string>originParentNode.value, -1);
                for (const child of originParentNode.children) {
                    const newChild: SunburstSlice = this.covertTreeNodeToSunBurstNode(
                        child,
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
                newSunNode.tooltipInfo = this.getTooltipData(
                    <string>originParentNode.value,
                    valueToSet);
            }

            if (sunburstParentNode) {
                newSunNode.parent = sunburstParentNode;
            }

            return newSunNode;
        }

        private getTooltipData(displayName: string, value: number): VisualTooltipDataItem[] {
            return [{
                displayName,
                value: value < 0
                    ? ""
                    : value.toString()
            }];
        }

        private parseSettings(dataView: DataView): SunburstSettings {
            return SunburstSettings.parse<SunburstSettings>(dataView);
        }

        // Get all parents of the node
        private static getTreePath(node: SunburstSlice): SunburstSlice[] {
            const path: SunburstSlice[] = [];
            let current: SunburstSlice = node;

            while (current.parent) {
                path.unshift(current);
                current = current.parent;
            }

            return path;
        }

        private calculateLabelPosition(): void {
            const innerRadius: number = Math.min.apply(
                null,
                this.data.root.children.map((x: SunburstSlice) => this.arc.innerRadius()(x, undefined))
            );
            const commonLineHeight: number = 1 + Sunburst.PercentageFontSizeMultiplier +
                Sunburst.CategoryLineInterval +
                (this.settings.group.showSelected ? Sunburst.MultilinePercentageLineInterval : Sunburst.DefaultPercentageLineInterval);
            const maxSymbolHeight: number = Math.round(innerRadius / commonLineHeight);

            const ellipsedText: (text: string, fontSize: number) => string =
                (text: string, fontSize: number): string => {
                    if (!text) {
                        return "";
                    }
                    const textWidth: number = text.length * fontSize / 2;
                    if (textWidth < innerRadius) {
                        return text;
                    }
                    if (maxSymbolHeight < this.settings.group.fontSize) {
                        this.settings.group.fontSize = maxSymbolHeight;
                        return "...";
                    }
                    return `${text.substr(0, Math.round(innerRadius / fontSize) - 3)}...`;
                };

            this.setPercentageLabelPosition(ellipsedText);
            this.setCategoryLabelPosition(ellipsedText);
        }

        private setCategoryLabelPosition(ellipsedText: (text: string, fontSize: number) => string): void {
            if (this.selectedCategoryLabel) {
                this.selectedCategoryLabel.text((x: string) => ellipsedText(x, this.settings.group.fontSize));
                this.selectedCategoryLabel.attr(
                    CssConstants.transformProperty,
                    translate(0, this.settings.group.fontSize * -Sunburst.CategoryLineInterval)
                );
            }
        }

        private setPercentageLabelPosition(ellipsedText: (text: string, fontSize: number) => string): void {
            const labelSize: number = this.settings.group.fontSize * Sunburst.PercentageFontSizeMultiplier;
            const labelTransform: number = labelSize *
                (this.settings.group.showSelected ?
                    Sunburst.MultilinePercentageLineInterval :
                    Sunburst.DefaultPercentageLineInterval);
            this.percentageLabel.text((x: string) => ellipsedText(x, labelSize));
            this.percentageLabel.attr(CssConstants.transformProperty, translate(0, labelTransform));
        }

        private highlightPath(d: SunburstSlice, sunBurst: Sunburst, setUnhide: boolean): void {
            const parentsArray: SunburstSlice[] = d ? Sunburst.getTreePath(d) : [];
            // Set opacity for all the segments.
            sunBurst.svg
                .selectAll(sunBurst.appCssConstants.sliceSelected.selector)
                .classed(sunBurst.appCssConstants.sliceSelected.class, false);
            sunBurst.svg.classed(sunBurst.appCssConstants.mainInteractive.class, true);
            // Highlight only ancestors of the current segment.
            sunBurst.svg.selectAll(sunBurst.appCssConstants.slice.selector)
                .filter((path: SunburstSlice) => {
                    return parentsArray.indexOf(path) >= 0;
                })
                .classed(sunBurst.appCssConstants.sliceSelected.class, true);
        }

        private renderTooltip(selection: d3.selection.Update<TooltipEnabledDataPoint>): void {
            if (!this.tooltipService) {
                return;
            }

            this.tooltipService.addTooltip(selection, (tooltipEvent: TooltipEventArgs<SunburstSlice>) => {
                return tooltipEvent.data.tooltipInfo;
            });
        }

        private clear(): void {
            this.main
                .select(this.appCssConstants.main.selector)
                .remove();
        }
    }
}
