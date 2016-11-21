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
    export class Helpers {
        public static setAttrThroughTransitionIfNotResized(
            element: d3.Selection<any>,
            setTransision: (t: d3.Transition<any>) => d3.Transition<any>,
            attrName: string,
            attrValue: (data: any, index: number) => any,
            attrTransitionValue: (data: any, index: number) => any,
            viewportChanged: boolean) {
            if (viewportChanged) {
                element.attr(attrName, attrValue);
            } else {
                setTransision(element.transition()).attrTween(attrName, attrTransitionValue);
            }
        }

        public static interpolateArc(arc: any) {
            return function (data) {
                if (!this.oldData) {
                    this.oldData = data;
                    return () => arc(data);
                }

                let interpolation = d3.interpolate(this.oldData, data);
                this.oldData = interpolation(0);
                return (x) => arc(interpolation(x));
            };
        }

        public static addContext(context: any, fn: Function): any {
            return <any>function () {
                return fn.apply(context, [this].concat(_.toArray(arguments)));
            };
        }
    }
}
