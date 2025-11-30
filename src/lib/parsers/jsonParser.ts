/**
 * JSON Parser
 * Parses JSON files with automatic flattening of nested structures
 */

import type { ParsedData, ParserOptions, ParserResult, ColumnInfo, DataType } from './types';

export class JSONParser {
    /**
     * Parse a JSON file
     */
    async parse(file: File, options: ParserOptions = {}): Promise<ParserResult> {
        const startTime = performance.now();

        try {
            const text = await file.text();
            let data = JSON.parse(text);

            // Handle different JSON structures
            let rows: Record<string, any>[] = [];

            if (Array.isArray(data)) {
                // Case 1: Array of objects [{...}, {...}]
                rows = data;
            } else if (typeof data === 'object' && data !== null) {
                // Case 2: Object with a data property { data: [...] }
                const possibleArrays = Object.values(data).filter(val => Array.isArray(val));
                if (possibleArrays.length > 0) {
                    // Pick the largest array found
                    rows = possibleArrays.reduce((a: any[], b: any[]) => a.length > b.length ? a : b) as Record<string, any>[];
                } else {
                    // Case 3: Single object, treat as one row
                    rows = [data];
                }
            }

            if (rows.length === 0) {
                return { success: false, error: 'No data found in JSON' };
            }

            // Flatten nested objects if needed (simple version)
            rows = rows.map(row => this.flattenObject(row));

            // Extract headers (union of all keys)
            const headers = Array.from(new Set(rows.flatMap(row => Object.keys(row))));

            // Analyze columns
            const columns = this.analyzeColumns(headers, rows);
            const dataTypes = this.extractDataTypes(columns);
            const parseTime = performance.now() - startTime;

            const result: ParsedData = {
                fileName: file.name,
                fileSize: file.size,
                fileType: 'application/json',
                headers,
                rows,
                rowCount: rows.length,
                columnCount: headers.length,
                columns,
                dataTypes,
                errors: [],
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
                error: error instanceof Error ? error.message : 'Invalid JSON format'
            };
        }
    }

    /**
     * Flatten nested objects: { a: { b: 1 } } -> { "a.b": 1 }
     */
    private flattenObject(obj: any, prefix = ''): Record<string, any> {
        return Object.keys(obj).reduce((acc: any, k: string) => {
            const pre = prefix.length ? prefix + '.' : '';
            if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k]) && !(obj[k] instanceof Date)) {
                Object.assign(acc, this.flattenObject(obj[k], pre + k));
            } else {
                acc[pre + k] = obj[k];
            }
            return acc;
        }, {});
    }

    private analyzeColumns(headers: string[], rows: Record<string, any>[]): ColumnInfo[] {
        return headers.map((header, index) => {
            const values = rows.map(row => row[header]);
            return this.analyzeColumn(header, index, values);
        });
    }

    private analyzeColumn(name: string, index: number, values: any[]): ColumnInfo {
        const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
        const nullCount = values.length - nonNullValues.length;
        const uniqueValues = new Set(nonNullValues);
        const dataType = this.detectDataType(nonNullValues);
        const sampleValues = Array.from(uniqueValues).slice(0, 5);

        return {
            name,
            index,
            dataType,
            nullable: nullCount > 0,
            uniqueValues: uniqueValues.size,
            sampleValues,
            nullCount,
            min: 0, // Simplified
            max: 0
        };
    }

    private detectDataType(values: any[]): DataType {
        if (values.length === 0) return 'null';
        const type = typeof values[0];
        if (type === 'number') return 'number';
        if (type === 'boolean') return 'boolean';
        return 'string';
    }

    private extractDataTypes(columns: ColumnInfo[]): Record<string, DataType> {
        const types: Record<string, DataType> = {};
        columns.forEach(col => {
            types[col.name] = col.dataType;
        });
        return types;
    }
}

export const jsonParser = new JSONParser();
