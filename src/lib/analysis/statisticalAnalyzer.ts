/**
 * Statistical Analyzer
 * Calculates detailed statistics for dataset columns including central tendency,
 * dispersion, and distribution.
 */

import type { ColumnStatistics, DataType } from '../parsers/types';

export class StatisticalAnalyzer {
    /**
     * Analyze a single column to generate statistics
     */
    analyzeColumn(
        name: string,
        values: any[],
        dataType: DataType
    ): ColumnStatistics {
        const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
        const nullCount = values.length - nonNullValues.length;
        const uniqueValues = new Set(nonNullValues);

        const baseStats: ColumnStatistics = {
            column: name,
            dataType,
            count: values.length,
            nullCount,
            uniqueCount: uniqueValues.size,
            completeness: (nonNullValues.length / values.length) * 100
        };

        if (dataType === 'number') {
            return { ...baseStats, ...this.analyzeNumeric(nonNullValues as number[]) };
        } else {
            return { ...baseStats, ...this.analyzeCategorical(nonNullValues) };
        }
    }

    /**
     * Analyze numeric data
     */
    private analyzeNumeric(values: number[]): Partial<ColumnStatistics> {
        if (values.length === 0) return {};

        const sorted = [...values].sort((a, b) => a - b);
        const sum = values.reduce((a, b) => a + b, 0);
        const mean = sum / values.length;

        // Median
        const mid = Math.floor(sorted.length / 2);
        const median = sorted.length % 2 === 0
            ? (sorted[mid - 1] + sorted[mid]) / 2
            : sorted[mid];

        // Mode
        const counts = new Map<number, number>();
        let maxCount = 0;
        let mode = sorted[0];
        for (const v of values) {
            const count = (counts.get(v) || 0) + 1;
            counts.set(v, count);
            if (count > maxCount) {
                maxCount = count;
                mode = v;
            }
        }

        // Variance & Std Dev
        const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
        const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
        const stdDev = Math.sqrt(variance);

        // Quartiles & IQR
        const q1 = this.getPercentile(sorted, 25);
        const q3 = this.getPercentile(sorted, 75);
        const iqr = q3 - q1;

        // Distribution (Histogram) - 10 bins
        const min = sorted[0];
        const max = sorted[sorted.length - 1];
        const range = max - min;
        const binSize = range / 10;
        const distribution: { value: any; count: number }[] = [];

        if (binSize > 0) {
            for (let i = 0; i < 10; i++) {
                const binStart = min + (i * binSize);
                const binEnd = min + ((i + 1) * binSize);
                const count = values.filter(v => v >= binStart && (i === 9 ? v <= binEnd : v < binEnd)).length;
                distribution.push({ value: `${binStart.toFixed(2)}-${binEnd.toFixed(2)}`, count });
            }
        }

        return {
            min,
            max,
            mean,
            median,
            mode,
            stdDev,
            variance,
            q1,
            q3,
            iqr,
            distribution
        };
    }

    /**
     * Analyze categorical data
     */
    private analyzeCategorical(values: any[]): Partial<ColumnStatistics> {
        if (values.length === 0) return {};

        const counts = new Map<any, number>();
        values.forEach(v => counts.set(v, (counts.get(v) || 0) + 1));

        // Convert to array and sort by count desc
        const sortedCounts = Array.from(counts.entries())
            .map(([value, count]) => ({ value, count, percentage: (count / values.length) * 100 }))
            .sort((a, b) => b.count - a.count);

        return {
            topValues: sortedCounts.slice(0, 5),
            distribution: sortedCounts.slice(0, 10).map(item => ({ value: String(item.value), count: item.count }))
        };
    }

    private getPercentile(sorted: number[], percentile: number): number {
        const index = (percentile / 100) * (sorted.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        const weight = index - lower;
        return sorted[lower] * (1 - weight) + sorted[upper] * weight;
    }
}

export const statisticalAnalyzer = new StatisticalAnalyzer();
