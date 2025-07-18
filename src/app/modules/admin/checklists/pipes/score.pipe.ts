import { Pipe, PipeTransform } from '@angular/core';

export interface ScoreFormatOptions {
    showPercentage?: boolean;
    showLabel?: boolean;
    precision?: number;
    colorCode?: boolean;
}

@Pipe({
    name: 'score'
})
export class ScorePipe implements PipeTransform {

    transform(
        value: number | null | undefined,
        options: ScoreFormatOptions = {}
    ): string {
        if (value === null || value === undefined || isNaN(value)) {
            return '--';
        }

        const {
            showPercentage = true,
            showLabel = false,
            precision = 1,
            colorCode = false
        } = options;

        // Ensure value is between 0 and 1
        const normalizedValue = Math.max(0, Math.min(1, value));

        let formattedScore: string;

        if (showPercentage) {
            const percentage = normalizedValue * 100;
            formattedScore = `${ percentage.toFixed(precision) }%`;
        } else {
            formattedScore = normalizedValue.toFixed(precision + 2);
        }

        if (showLabel) {
            const label = this.getScoreLabel(normalizedValue);
            formattedScore += ` (${ label })`;
        }

        if (colorCode) {
            const colorClass = this.getScoreColorClass(normalizedValue);
            formattedScore = `<span class="${ colorClass }">${ formattedScore }</span>`;
        }

        return formattedScore;
    }

    private getScoreLabel(score: number): string {
        if (score >= 0.9) return 'Excellent';
        if (score >= 0.8) return 'Good';
        if (score >= 0.7) return 'Satisfactory';
        if (score >= 0.6) return 'Needs Improvement';
        return 'Poor';
    }

    private getScoreColorClass(score: number): string {
        if (score >= 0.8) return 'text-green-600';
        if (score >= 0.6) return 'text-yellow-600';
        return 'text-red-600';
    }
}

@Pipe({
    name: 'scoreClass'
})
export class ScoreClassPipe implements PipeTransform {

    transform(value: number | null | undefined, type: 'text' | 'background' | 'chip' = 'text'): string {
        if (value === null || value === undefined || isNaN(value)) {
            return '';
        }

        const normalizedValue = Math.max(0, Math.min(1, value));

        switch (type) {
            case 'text':
                return this.getTextClass(normalizedValue);
            case 'background':
                return this.getBackgroundClass(normalizedValue);
            case 'chip':
                return this.getChipClass(normalizedValue);
            default:
                return '';
        }
    }

    private getTextClass(score: number): string {
        if (score >= 0.8) return 'text-green-600';
        if (score >= 0.6) return 'text-yellow-600';
        return 'text-red-600';
    }

    private getBackgroundClass(score: number): string {
        if (score >= 0.8) return 'bg-green-100';
        if (score >= 0.6) return 'bg-yellow-100';
        return 'bg-red-100';
    }

    private getChipClass(score: number): string {
        if (score >= 0.8) return 'bg-green-100 text-green-800';
        if (score >= 0.6) return 'bg-yellow-100 text-yellow-800';
        return 'bg-red-100 text-red-800';
    }
}

@Pipe({
    name: 'scoreProgress'
})
export class ScoreProgressPipe implements PipeTransform {

    transform(value: number | null | undefined): { value: number; color: string } {
        if (value === null || value === undefined || isNaN(value)) {
            return {value: 0, color: 'warn'};
        }

        const normalizedValue = Math.max(0, Math.min(1, value)) * 100;

        let color: string;
        if (normalizedValue >= 80) color = 'primary';
        else if (normalizedValue >= 60) color = 'accent';
        else color = 'warn';

        return {value: normalizedValue, color};
    }
}
