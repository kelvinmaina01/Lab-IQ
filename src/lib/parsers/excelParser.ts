/**
 * Excel Parser
 * Parses Excel files (.xlsx, .xls) using SheetJS (xlsx)
 */

import * as XLSX from 'xlsx';
import type { ParsedData, ParserOptions, ParserResult, ColumnInfo, DataType, ParseError } from './types';
import { csvParser } from './csvParser'; // Reuse analysis logic

export class ExcelParser {
    /**
     * Parse an Excel file
     */
    async parse(file: File, options: ParserOptions = {}): Promise<ParserResult> {
        const startTime = performance.now();

        try {
            // Read file buffer
            const buffer = await file.arrayBuffer();

            // Parse workbook
            const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });

            // Get first sheet (or specified sheet)
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // Convert to JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                header: 1, // Get array of arrays first to extract headers
                defval: null,
                blankrows: false
            }) as any[][];

            if (jsonData.length === 0) {
                return { success: false, error: 'Sheet is empty' };
            }

            // Extract headers and rows
            const headers = jsonData[0] as string[];
            const rawRows = jsonData.slice(1);

            // Convert to array of objects
            const rows = rawRows.map((row) => {
                const rowObj: Record<string, any> = {};
                headers.forEach((header, index) => {
                    rowObj[header] = row[index];
                });
                return rowObj;
            });

            const parseTime = performance.now() - startTime;

            // Reuse the robust analysis logic from CSV parser
            // We need to cast to any to access the private method, or we could refactor to a shared utility
            // For now, I'll duplicate the logic slightly or use a shared helper if I had one.
            // Actually, let's just implement the analysis here to be safe and self-contained.

            const columns = this.analyzeColumns(headers, rows);
            const dataTypes = this.extractDataTypes(columns);

            const result: ParsedData = {
                fileName: file.name,
                fileSize: file.size,
                fileType: file.name.endsWith('.xlsx') ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/vnd.ms-excel',
                headers,
                rows,
                rowCount: rows.length,
                columnCount: headers.length,
                columns,
                dataTypes,
                errors: [], // Excel parsing usually doesn't generate row-level errors like CSV
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
                error: error instanceof Error ? error.message : 'Unknown Excel parsing error'
            };
        }
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

        let min, max, mean, median, stdDev;
        if (dataType === 'number') {
            const numbers = nonNullValues.filter(v => typeof v === 'number') as number[];
            if (numbers.length > 0) {
                min = Math.min(...numbers);
                max = Math.max(...numbers);
                mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
                // Simplified stats for now
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

    private detectDataType(values: any[]): DataType {
        if (values.length === 0) return 'null';

        // Check for dates specifically (Excel dates come as Date objects often)
        if (values.some(v => v instanceof Date)) return 'date';

        const types = new Set(values.map(v => typeof v));
        if (types.has('number') && types.size === 1) return 'number';
        if (types.has('boolean') && types.size === 1) return 'boolean';

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

export const excelParser = new ExcelParser();
