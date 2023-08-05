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

import { getRandomNumber, testDataViewBuilder as TDVB } from "powerbi-visuals-utils-testutils";
import powerbiVisualsApi from "powerbi-visuals-api";
import DataView = powerbiVisualsApi.DataView;
import TestDataViewBuilder = TDVB.TestDataViewBuilder;
import DataViewMetadataColumn = powerbiVisualsApi.DataViewMetadataColumn;
import { DataTable } from "powerbi-visuals-utils-testutils/lib/dataViewBuilder/matrixBuilder";

interface INamed {
    name: string;
}

interface IData extends INamed {
    code: string;
}

export const Countries: IData[] = [
    { name: "Afghanistan", code: "AF" },
    { name: "Åland Islands", code: "AX" },
    { name: "Albania", code: "AL" },
    { name: "Algeria", code: "DZ" },
    { name: "American Samoa", code: "AS" },
    { name: "AndorrA", code: "AD" },
    { name: "Angola", code: "AO" },
    { name: "Anguilla", code: "AI" },
    { name: "Antarctica", code: "AQ" },
    { name: "Antigua and Barbuda", code: "AG" },
    { name: "Argentina", code: "AR" },
    { name: "Armenia", code: "AM" },
    { name: "Aruba", code: "AW" },
    { name: "Australia", code: "AU" },
    { name: "Austria", code: "AT" },
    { name: "Azerbaijan", code: "AZ" },
    { name: "Bahamas", code: "BS" },
    { name: "Bahrain", code: "BH" },
    { name: "Bangladesh", code: "BD" },
    { name: "Barbados", code: "BB" },
    { name: "Belarus", code: "BY" },
    { name: "Belgium", code: "BE" },
    { name: "Belize", code: "BZ" },
    { name: "Benin", code: "BJ" },
    { name: "Bermuda", code: "BM" },
    { name: "Bhutan", code: "BT" },
    { name: "Bolivia", code: "BO" },
    { name: "Bosnia and Herzegovina", code: "BA" },
    { name: "Botswana", code: "BW" },
    { name: "Bouvet Island", code: "BV" },
    { name: "Brazil", code: "BR" },
    { name: "British Indian Ocean Territory", code: "IO" },
    { name: "Brunei Darussalam", code: "BN" },
    { name: "Bulgaria", code: "BG" },
    { name: "Burkina Faso", code: "BF" },
    { name: "Burundi", code: "BI" },
    { name: "Cambodia", code: "KH" },
    { name: "Cameroon", code: "CM" },
    { name: "Canada", code: "CA" },
    { name: "Cape Verde", code: "CV" },
    { name: "Cayman Islands", code: "KY" },
    { name: "Central African Republic", code: "CF" },
    { name: "Chad", code: "TD" },
    { name: "Chile", code: "CL" },
    { name: "China", code: "CN" },
    { name: "Christmas Island", code: "CX" },
    { name: "Cocos (Keeling) Islands", code: "CC" },
    { name: "Colombia", code: "CO" },
    { name: "Comoros", code: "KM" },
    { name: "Congo", code: "CG" },
    { name: "Congo, The Democratic Republic of the", code: "CD" },
    { name: "Cook Islands", code: "CK" },
    { name: "Costa Rica", code: "CR" },
    { name: "Cote D\"Ivoire", code: "CI" },
    { name: "Croatia", code: "HR" },
    { name: "Cuba", code: "CU" },
    { name: "Cyprus", code: "CY" },
    { name: "Czech Republic", code: "CZ" }
];
export const States: IData[] = [
    {
        name: "ALABAMA",
        code: "AL"
    },
    {
        name: "ALASKA",
        code: "AK"
    },
    {
        name: "ARIZONA",
        code: "AZ"
    },
    {
        name: "ARKANSAS",
        code: "AR"
    },
    {
        name: "CALIFORNIA",
        code: "CA"
    },
    {
        name: "COLORADO",
        code: "CO"
    },
    {
        name: "CONNECTICUT",
        code: "CT"
    },
    {
        name: "DELAWARE",
        code: "DE"
    },
    {
        name: "FLORIDA",
        code: "FL"
    },
    {
        name: "GEORGIA",
        code: "GA"
    },
    {
        name: "HAWAII",
        code: "HI"
    },
    {
        name: "IDAHO",
        code: "ID"
    },
    {
        name: "ILLINOIS",
        code: "IL"
    },
    {
        name: "INDIANA",
        code: "IN"
    },
    {
        name: "IOWA",
        code: "IA"
    },
    {
        name: "KANSAS",
        code: "KS"
    },
    {
        name: "KENTUCKY",
        code: "KY"
    },
    {
        name: "LOUISIANA",
        code: "LA"
    },
    {
        name: "MAINE",
        code: "ME"
    },
    {
        name: "MARYLAND",
        code: "MD"
    },
    {
        name: "MASSACHUSETTS",
        code: "MA"
    },
    {
        name: "MICHIGAN",
        code: "MI"
    },
    {
        name: "MINNESOTA",
        code: "MN"
    },
    {
        name: "MISSISSIPPI",
        code: "MS"
    },
    {
        name: "MISSOURI",
        code: "MO"
    },
    {
        name: "MONTANA",
        code: "MT"
    },
    {
        name: "NEBRASKA",
        code: "NE"
    },
    {
        name: "NEVADA",
        code: "NV"
    },
    {
        name: "NEW HAMPSHIRE",
        code: "NH"
    },
    {
        name: "NEW JERSEY",
        code: "NJ"
    },
    {
        name: "NEW MEXICO",
        code: "NM"
    },
    {
        name: "NEW YORK",
        code: "NY"
    },
    {
        name: "NORTH CAROLINA",
        code: "NC"
    },
    {
        name: "NORTH DAKOTA",
        code: "ND"
    },
    {
        name: "OHIO",
        code: "OH"
    },
    {
        name: "OKLAHOMA",
        code: "OK"
    },
    {
        name: "OREGON",
        code: "OR"
    },
    {
        name: "PENNSYLVANIA",
        code: "PA"
    },
    {
        name: "RHODE ISLAND",
        code: "RI"
    },
    {
        name: "SOUTH CAROLINA",
        code: "SC"
    },
    {
        name: "SOUTH DAKOTA",
        code: "SD"
    },
    {
        name: "TENNESSEE",
        code: "TN"
    },
    {
        name: "TEXAS",
        code: "TX"
    },
    {
        name: "UTAH",
        code: "UT"
    },
    {
        name: "VERMONT",
        code: "VT"
    },
    {
        name: "VIRGINIA",
        code: "VA"
    },
    {
        name: "WASHINGTON",
        code: "WA"
    },
    {
        name: "WEST VIRGINIA",
        code: "WV"
    },
    {
        name: "WISCONSIN",
        code: "WI"
    },
    {
        name: "WYOMING",
        code: "WY"
    }
];
export const Regions: INamed[] = [
    { name: "Asia" },
    { name: "Europe" },
    { name: "Africa" },
    { name: "Oceania" },
    { name: "North America" },
    { name: "Antarctica" },
    { name: "South America" }
];

export class VisualData extends TestDataViewBuilder {
    public readonly RegionsDataSet: string = "Regions";
    public readonly CountriesDataSet: string = "Countries";
    public readonly StatesDataSet: string = "States";
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

    public getMatrixDataTable(testData: INamed[][], useValues: boolean = true): DataTable {
        let result: (string | number)[][] = [];


        // hardcoded to have max 3 depth, but loop below will work for any
        result[0] = [this.RegionsDataSet, this.CountriesDataSet, this.StatesDataSet].slice(0, testData.length);
        let finished: boolean = false;

        let counters: number[] = Array.from({ length: testData.length }, () => 0);
        while (!finished) {
            result.push(counters.map((val, i) => testData[i][val].name));
            counters[counters.length - 1]++;

            // update counters' values
            let currentIndex = counters.length;
            while (currentIndex > 0) {
                currentIndex--;
                if (counters[currentIndex] >= testData[currentIndex].length) {
                    if (currentIndex === 0) {
                        finished = true;
                        break;
                    }
                    counters[currentIndex] %= testData[currentIndex].length;
                    counters[currentIndex - 1]++;
                }
            }
        }
        if (useValues) {
            result[0].push("Values");
            for (let i = 1; i < result.length; i++) {
                result[i].push(getRandomNumber(0, 1000));
            }
        }
        return new DataTable(result);
    }

    public getDataView(columnNames?: string[]): DataView {
        if (!columnNames) {
            return;
        }
        const testData: INamed[][] = [];
        columnNames.forEach((columnName: string, index: number) => {
            testData.push(this.getRandomArrayElements<INamed>(this.allData[columnName], this.countElements));
        });

        const data: DataTable = this.getMatrixDataTable(testData);
        let matrixBuilder = VisualData.createMatrixDataViewBuilder(data);

        columnNames.forEach((col, i) => {
            matrixBuilder = matrixBuilder.withRowGroup({
                columns: [{
                    metadata: {
                        name: col,
                        displayName: col,
                        type: { text: true },
                    },
                    role: col,
                    index: i,
                }]
            })
        })
        return matrixBuilder.withValues([{
            metadata: {
                name: "Values",
                displayName: "Values",
                type: { numeric: true },
            },
            role: "Values",
            index: columnNames.length,
        }]).build()

    }

    private readonly allData: { [name: string]: INamed[] } =
        {
            Regions: Regions,
            Countries: Countries,
            States: States
        };

    private getRandomArrayElements<T>(arr: T[], count: number): T[] {
        if (arr.length < count) {
            return arr;
        }
        const shuffled: T[] = arr.slice(0);
        let i: number = arr.length;
        const min: number = i - count;
        let index: number;
        let temp: T;
        i = i - 1;
        while (i > min) {
            // tslint:disable-next-line:insecure-random
            index = Math.floor((i + 1) * Math.random());
            temp = shuffled[index];
            shuffled[index] = shuffled[i];
            shuffled[i] = temp;
            i = i - 1;
        }
        return shuffled.slice(min);
    }
}
