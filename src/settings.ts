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
    // powerbi.visuals
    import LegendPosition = powerbi.visuals.LegendPosition;

    // powerbi.extensibility.visual
    import SettingsParser = powerbi.extensibility.visual.settingsParser.SettingsParser;

    export class SunburstSettings extends SettingsParser {
        public labels: LabelsSettings = new LabelsSettings();
        public legend: LegendSettings = new LegendSettings();
        public outerLine: OuterLineSettings = new OuterLineSettings();
    }

    export class LabelsSettings {
        public show: boolean = false;
        public color: string = "#777777";
        public displayUnits: number = 0;
        public precision: number = undefined;
        public fontSize: number = 9;
    }

    export class LegendSettings {
        public show: boolean = false;
        public position: string = LegendPosition[LegendPosition.Top];
        public showTitle: boolean = true;
        public titleText: string = "";
        public labelColor: string = '#666666';
        public fontSize: number = 8;
    }

    export class OuterLineSettings {
        public show: boolean = false;
        public thickness: number = 1;
    }
}
