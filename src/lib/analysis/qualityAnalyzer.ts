/**
 * Data Quality Analyzer
 * Analyzes datasets for quality issues including missing values, duplicates, outliers, and inconsistencies.
 */

import type { QualityMetrics, QualityIssue, DataType } from '../parsers/types';

export class QualityAnalyzer {
    /**
     * Analyze a dataset for quality metrics
     */
    analyze(rows: Record<string, any>[], columns: { name: string; dataType: DataType }[]): QualityMetrics {
        const completeness = this.calculateCompleteness(rows, columns);
        const consistency = this.checkConsistency(rows, columns);
        const duplicates = this.findDuplicates(rows);
        const outliers = this.detectOutliers(rows, columns);

        // Calculate overall score (weighted average)
        // Completeness: 40%, Consistency: 30%, Uniqueness: 20%, Outliers: 10%
        const uniquenessScore = Math.max(0, 100 - (duplicates.length / rows.length * 100));
        const outlierScore = Math.max(0, 100 - (outliers.length / (rows.length * columns.length) * 100)); // normalized by total cells roughly

        const overallScore = (
            (completeness.score * 0.4) +
            (consistency.score * 0.3) +
            (uniquenessScore * 0.2) +
            (outlierScore * 0.1)
        );

        return {
            overallScore: Math.round(overallScore),
            completenessScore: Math.round(completeness.score),
            consistencyScore: Math.round(consistency.score),
            accuracyScore: Math.round(uniquenessScore), // Using uniqueness as a proxy for accuracy for now

            missingValuesCount: completeness.missingCount,
            duplicateRowsCount: duplicates.length,
            outliersCount: outliers.length,

            issues: [
                ...completeness.issues,
                ...consistency.issues,
                ...duplicates,
                ...outliers
            ]
        };
    }

    /**
     * Calculate completeness score (percentage of non-missing values)
     */
    private calculateCompleteness(rows: Record<string, any>[], columns: { name: string }[]) {
        let totalCells = rows.length * columns.length;
        let missingCells = 0;
        const issues: QualityIssue[] = [];
        const missingByColumn: Record<string, number> = {};

        rows.forEach((row, rowIndex) => {
            columns.forEach(col => {
                const val = row[col.name];
                if (this.isMissing(val)) {
                    missingCells++;
                    missingByColumn[col.name] = (missingByColumn[col.name] || 0) + 1;

                    // Only add first 10 missing value issues per column to avoid flooding
                    if ((missingByColumn[col.name] || 0) <= 10) {
                        issues.push({
                            type: 'missing',
                            severity: 'medium',
                            column: col.name,
                            row: rowIndex,
                            description: `Missing value in column "${col.name}"`
                        });
                    }
                }
            });
        });

        // Add summary issues for columns with many missing values
        Object.entries(missingByColumn).forEach(([colName, count]) => {
            if (count > 10) {
                issues.push({
                    type: 'missing',
                    severity: 'high',
                    column: colName,
                    description: `Column "${colName}" has ${count} missing values (${Math.round(count / rows.length * 100)}%)`
                });
            }
        });

        const score = totalCells === 0 ? 100 : ((totalCells - missingCells) / totalCells) * 100;
        return { score, missingCount: missingCells, issues };
    }

    private isMissing(val: any): boolean {
        return val === null || val === undefined || val === '';
    }

    /**
     * Check for data type consistency
     */
    private checkConsistency(rows: Record<string, any>[], columns: { name: string; dataType: DataType }[]) {
        let inconsistentCells = 0;
        const issues: QualityIssue[] = [];
        const totalCells = rows.length * columns.length;

        columns.forEach(col => {
            if (col.dataType === 'mixed' || col.dataType === 'null') return;

            let colIssues = 0;
            rows.forEach((row, rowIndex) => {
                const val = row[col.name];
                if (this.isMissing(val)) return;

                let isValid = true;
                if (col.dataType === 'number' && typeof val !== 'number') isValid = false;
                if (col.dataType === 'boolean' && typeof val !== 'boolean') isValid = false;
                if (col.dataType === 'date' && !(val instanceof Date) && isNaN(Date.parse(val))) isValid = false;

                if (!isValid) {
                    inconsistentCells++;
                    colIssues++;
                    if (colIssues <= 5) {
                        issues.push({
                            type: 'inconsistent',
                            severity: 'medium',
                            column: col.name,
                            row: rowIndex,
                            value: val,
                            description: `Expected ${col.dataType} but got ${typeof val}`
                        });
                    }
                }
            });
        });

        const score = totalCells === 0 ? 100 : ((totalCells - inconsistentCells) / totalCells) * 100;
        return { score, issues };
    }

    /**
     * Find duplicate rows
     */
    private findDuplicates(rows: Record<string, any>[]): QualityIssue[] {
        const seen = new Set<string>();
        const duplicates: QualityIssue[] = [];

        // For large datasets, we might want to hash the row content
        // For now, JSON.stringify is acceptable for < 100k rows usually, but can be slow
        // Optimization: Only check first 1000 rows for duplicates if dataset is huge?
        // Or use a sampling approach. Let's stick to full check but be mindful.

        const limit = Math.min(rows.length, 10000); // Limit duplicate check to first 10k rows for perf

        for (let i = 0; i < limit; i++) {
            const rowStr = JSON.stringify(rows[i]);
            if (seen.has(rowStr)) {
                if (duplicates.length < 50) { // Cap reported duplicates
                    duplicates.push({
                        type: 'duplicate',
                        severity: 'low',
                        row: i,
                        description: 'Duplicate row detected'
                    });
                }
            } else {
                seen.add(rowStr);
            }
        }

        return duplicates;
    }

    /**
     * Detect outliers using IQR method for numeric columns
     */
    private detectOutliers(rows: Record<string, any>[], columns: { name: string; dataType: DataType }[]): QualityIssue[] {
        const outliers: QualityIssue[] = [];

        columns.filter(c => c.dataType === 'number').forEach(col => {
            const values = rows
                .map(r => r[col.name])
                .filter(v => typeof v === 'number')
                .sort((a, b) => a - b);

            if (values.length < 4) return;

            const q1 = values[Math.floor(values.length * 0.25)];
            const q3 = values[Math.floor(values.length * 0.75)];
            const iqr = q3 - q1;
            const lowerBound = q1 - 1.5 * iqr;
            const upperBound = q3 + 1.5 * iqr;

            let colOutliers = 0;
            rows.forEach((row, rowIndex) => {
                const val = row[col.name];
                if (typeof val === 'number' && (val < lowerBound || val > upperBound)) {
                    colOutliers++;
                    if (colOutliers <= 5) {
                        outliers.push({
                            type: 'outlier',
                            severity: 'low',
                            column: col.name,
                            row: rowIndex,
                            value: val,
                            description: `Value ${val} is a statistical outlier (Range: ${lowerBound.toFixed(2)} - ${upperBound.toFixed(2)})`
                        });
                    }
                }
            });
        });

        return outliers;
    }
}

export const qualityAnalyzer = new QualityAnalyzer();
