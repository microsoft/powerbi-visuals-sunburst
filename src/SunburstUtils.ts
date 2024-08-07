export class SunburstUtils {
    static DimmedOpacity: number = 0.3;
    static DefaultOpacity: number = 1.0;
    static DimmedColor: string = "#A6A6A6";

    static getOpacity(selected: boolean, highlight: boolean, hasSelection: boolean, isHighContrast: boolean): number {
        if (!highlight && hasSelection && !selected && isHighContrast) {
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
        isHighContrast: boolean): number {
    
        if ((hasSelection && !selected) && isHighContrast) {
            return SunburstUtils.DimmedOpacity;
        }
    
        return SunburstUtils.DefaultOpacity;
    }
    
    static getLegendFill(
        selected: boolean,
        hasSelection: boolean,
        defaultColor: string,
        isHighContrast: boolean): string {
    
        if ((hasSelection && !selected) && !isHighContrast) {
            return SunburstUtils.DimmedColor;
        }
    
        return defaultColor;
    }
}