/**
 * CSV Parser
 * Parses CSV files with automatic type detection and validation
 */

import Papa from 'papaparse';
import type { ParsedData, ParserOptions, ParserResult, DataType, ColumnInfo, ParseError } from './types';

export class CSVParser {
    /**
     * Parse a CSV file
     */
    async parse(file: File, options: ParserOptions = {}): Promise<ParserResult> {
        const startTime = performance.now();

        try {
            const parsedData = await this.parseFile(file, options);
            const parseTime = performance.now() - startTime;

            // Detect data types and analyze columns
            const columns = this.analyzeColumns(parsedData.data);
            const dataTypes = this.extractDataTypes(columns);

            const result: ParsedData = {
                fileName: file.name,
                fileSize: file.size,
                fileType: 'text/csv',
                headers: parsedData.meta.fields || [],
                rows: parsedData.data,
                rowCount: parsedData.data.length,
                columnCount: parsedData.meta.fields?.length || 0,
                columns,
                dataTypes,
                errors: this.convertErrors(parsedData.errors),
                warnings: [],
                parseTime
            };

            return {
                success: true,
                data: result
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown parsing error'
            };
        }
    }

    /**
     * Parse the file using PapaParse
     */
    private parseFile(file: File, options: ParserOptions): Promise<Papa.ParseResult<any>> {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                dynamicTyping: options.detectTypes !== false,
                skipEmptyLines: options.skipEmptyLines !== false ? 'greedy' : false,
                transformHeader: (header) => header.trim(),
                transform: options.trimValues ? (value) => value.trim() : undefined,
                complete: (results) => resolve(results),
                error: (error) => reject(error)
            });
        });
    }

    /**
     * Analyze each column to determine type and statistics
     */
    private analyzeColumns(rows: Record<string, any>[]): ColumnInfo[] {
        if (rows.length === 0) return [];

        const headers = Object.keys(rows[0]);
        return headers.map((header, index) => {
            const values = rows.map(row => row[header]);
            return this.analyzeColumn(header, index, values);
        });
    }

    /**
     * Analyze a single column
     */
    private analyzeColumn(name: string, index: number, values: any[]): ColumnInfo {
        const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
        const nullCount = values.length - nonNullValues.length;
        const uniqueValues = new Set(nonNullValues);

        // Detect data type
        const dataType = this.detectDataType(nonNullValues);

        // Get sample values (first 5 unique)
        const sampleValues = Array.from(uniqueValues).slice(0, 5);

        // Calculate numeric statistics if applicable
        let min, max, mean, median, stdDev;
        if (dataType === 'number') {
            const numbers = nonNullValues.filter(v => typeof v === 'number') as number[];
            if (numbers.length > 0) {
                min = Math.min(...numbers);
                max = Math.max(...numbers);
                mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
                median = this.calculateMedian(numbers);
                stdDev = this.calculateStdDev(numbers, mean);
            }
        }

        return {
            name,
            index,
            dataType,
            nullable: nullCount > 0,
            uniqueValues: uniqueValues.size,
            sampleValues,
            nullCount,
            min,
            max,
            mean,
            median,
            stdDev
        };
    }

    /**
     * Detect the data type of a column
     */
    private detectDataType(values: any[]): DataType {
        if (values.length === 0) return 'null';

        const types = new Set(values.map(v => typeof v));

        // If all values are the same type
        if (types.size === 1) {
            const type = Array.from(types)[0];
            if (type === 'number') return 'number';
            if (type === 'boolean') return 'boolean';
            if (type === 'string') {
                // Check if strings are dates
                if (this.areValuesDate(values as string[])) {
                    return 'date';
                }
                return 'string';
            }
        }

        // Mixed types
        if (types.has('number') && types.has('string')) {
            // Check if strings are actually numbers that failed to parse
            const allNumeric = values.every(v =>
                typeof v === 'number' || (typeof v === 'string' && !isNaN(Number(v)))
            );
            if (allNumeric) return 'number';
        }

        return 'mixed';
    }

    /**
     * Check if string values are dates
     */
    private areValuesDate(values: string[]): boolean {
        if (values.length === 0) return false;

        // Sample first 10 values
        const sample = values.slice(0, 10);
        const dateCount = sample.filter(v => {
            const date = new Date(v);
            return !isNaN(date.getTime());
        }).length;

        // If more than 80% are valid dates, consider it a date column
        return dateCount / sample.length > 0.8;
    }

    /**
     * Calculate median
     */
    private calculateMedian(numbers: number[]): number {
        const sorted = [...numbers].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);

        if (sorted.length % 2 === 0) {
            return (sorted[mid - 1] + sorted[mid]) / 2;
        }
        return sorted[mid];
    }

    /**
     * Calculate standard deviation
     */
    private calculateStdDev(numbers: number[], mean: number): number {
        const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
        const variance = squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length;
        return Math.sqrt(variance);
    }

    /**
     * Extract data types as a simple map
     */
    private extractDataTypes(columns: ColumnInfo[]): Record<string, DataType> {
        const types: Record<string, DataType> = {};
        columns.forEach(col => {
            types[col.name] = col.dataType;
        });
        return types;
    }

    /**
     * Convert PapaParse errors to our format
     */
    private convertErrors(papaErrors: Papa.ParseError[]): ParseError[] {
        return papaErrors.map(error => ({
            row: error.row || 0,
            column: '',
            message: error.message,
            severity: error.type === 'Quotes' || error.type === 'Delimiter' ? 'error' : 'warning'
        }));
    }
}

// Export a singleton instance
export const csvParser = new CSVParser();
