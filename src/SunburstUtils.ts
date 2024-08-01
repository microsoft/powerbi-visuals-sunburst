export class SunburstUtils {
    static DimmedOpacity: number = 0.3;
    static DefaultOpacity: number = 1.0;
    static DimmedColor: string = "#A6A6A6";

    static getOpacity(selected: boolean, highlight: boolean, hasSelection: boolean, isHCM: boolean): number {
        if (!highlight && hasSelection && !selected && isHCM) {
            return SunburstUtils.DimmedOpacity;
        }
        return SunburstUtils.DefaultOpacity;
    }

    static getFillOpacity(
        selected: boolean,
        hasSelection: boolean
        ): number {
        if ((hasSelection && !selected)) {
            return SunburstUtils.DimmedOpacity;
        }
    
        return SunburstUtils.DefaultOpacity;
    }

    static getLegendFillOpacity(
        selected: boolean,
        hasSelection: boolean,
        isHCM: boolean): number {
    
        if ((hasSelection && !selected) && isHCM) {
            return SunburstUtils.DimmedOpacity;
        }
    
        return SunburstUtils.DefaultOpacity;
    }
    
    static getLegendFill(
        selected: boolean,
        hasSelection: boolean,
        defaultColor: string,
        isHCM: boolean): string {
    
        if ((hasSelection && !selected) && !isHCM) {
            return SunburstUtils.DimmedColor;
        }
    
        return defaultColor;
    }
}