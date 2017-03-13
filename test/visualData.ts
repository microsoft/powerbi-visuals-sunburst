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

/// <reference path="_references.ts"/>

module powerbi.extensibility.visual.test {
    // powerbi.extensibility.utils.test
    import getRandomNumber = powerbi.extensibility.utils.test.helpers.getRandomNumber;
    import testData = powerbi.extensibility.visual.test.data;
    import TestDataViewBuilder = powerbi.extensibility.utils.test.dataViewBuilder.TestDataViewBuilder;
    import TestDataViewBuilderCategoryColumnOptions = powerbi.extensibility.utils.test.dataViewBuilder.TestDataViewBuilderCategoryColumnOptions;

    interface INamed {
        name: string;
    }

    export class SunburstData extends TestDataViewBuilder {
        public readonly RegionsDataSet = "Regions";
        public readonly CountriesDataSet = "Countries";
        public readonly StatesDataSet = "States";
        public readonly visualName: string = "Sunburst";
        private readonly measure: DataViewMetadataColumn = {
            displayName: "Value",
            index: 3,
            isMeasure: true,
            queryName: `Sum(${this.visualName}.Value)`,
            roles: { Values: true }
        };

        private countElements: number = 3;
        public set countGeneratedElements(count: number) {
            this.countElements = count;
        }
        getDataView(columnNames?: string[]): DataView {
            if (!columnNames) {
                return;
            }
            let testData: INamed[][] = [];
            let columns: DataViewMetadataColumn[] = [];
            columnNames.forEach((columnName: string, index: number) => {
                columns.push(this.generateColumn(columnName, index, this.visualName));
                testData.push(this.getRandomArrayElements(this.allData[columnName], this.countElements));
            });

            let dataView: DataView = {
                matrix: this.buildMatrix(testData, columns, this.measure),
                metadata: { columns: [...columns, this.measure] }
            };
            return dataView;
        }

        private readonly allData: { [name: string]: INamed[] } =
        {
            "Regions": testData.Regions,
            "Countries": testData.Countries,
            "States": testData.States
        };

        private buildMatrix(data: INamed[][], columns: DataViewMetadataColumn[], measure: DataViewMetadataColumn): DataViewMatrix {
            let rootNode: DataViewMatrixNode = this.generateNode(null, data);
            let matrix: DataViewMatrix = {
                rows: {
                    root: rootNode,
                    levels: [{
                        sources: columns
                    }]
                },
                columns: {
                    root: {
                        children: [{ level: 0 }]
                    },
                    levels: [{
                        sources: [this.measure]
                    }]
                },
                valueSources: [this.measure]
            };
            return matrix;
        }

        private generateColumn(columnName: string, index: number, visualName?: string): DataViewMetadataColumn {
            visualName = visualName || "testVisual";
            return { displayName: columnName, index: index, queryName: `${visualName}.${columnName}`, roles: { Values: true } };
        }

        private generateNode(head: INamed, data: INamed[][], level: number = -1): DataViewMatrixNode {
            let treeNode: DataViewMatrixNode;
            let nextLevel: number = level + 1;
            if (level === -1) {
                treeNode = {
                    children: []
                };
            } else {
                let isLastLevel: boolean = !data[nextLevel];
                treeNode = {
                    name: head.name,
                    level: level,
                    value: head.name,
                    values: isLastLevel ? { "0": { value: getRandomNumber(0, 1000) } } : null,
                    children: []
                };
            }
            if (data[nextLevel]) {
                data[nextLevel].forEach((item) => {
                    treeNode.children.push(this.generateNode(item, data, nextLevel));
                });
            }
            return treeNode;
        }
        private getRandomArrayElements(arr: any[], count: number): any[] {
            if (arr.length < count) {
                return arr;
            }
            let shuffled: any[] = arr.slice(0),
                i: number = arr.length,
                min: number = i - count,
                index: number,
                temp: any;
            while (i-- > min) {
                index = Math.floor((i + 1) * Math.random());
                temp = shuffled[index];
                shuffled[index] = shuffled[i];
                shuffled[i] = temp;
            }
            return shuffled.slice(min);
        }
    }
}