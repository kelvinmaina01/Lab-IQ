/**
 * Notebook Data Service
 * Fetches and transforms data for notebook visualizations
 */

import { supabase } from '@/integrations/supabase/client';

export interface DatasetData {
    rows: any[];
    schema: {
        [key: string]: {
            type: string;
            nullable: boolean;
        };
    };
}

export class NotebookDataService {
    /**
     * Fetch data from a dataset for visualization
     */
    async fetchDatasetData(datasetId: string, limit?: number): Promise<DatasetData> {
        // Get dataset info
        const { data: dataset, error: datasetError } = await supabase
            .from('datasets')
            .select('table_name, schema')
            .eq('id', datasetId)
            .single();

        if (datasetError) throw new Error(`Dataset not found: ${datasetError.message}`);

        // Query the actual data table
        let query = supabase
            .from(dataset.table_name)
            .select('*');

        if (limit) {
            query = query.limit(limit);
        }

        const { data: rows, error: rowsError } = await query;

        if (rowsError) throw new Error(`Failed to fetch data: ${rowsError.message}`);

        // Parse schema
        const schema = typeof dataset.schema === 'string'
            ? JSON.parse(dataset.schema)
            : dataset.schema;

        return {
            rows: rows || [],
            schema
        };
    }

    /**
     * Fetch specific columns for chart rendering
     */
    async fetchColumns(
        datasetId: string,
        columnNames: string[],
        filters?: { column: string; operator: string; value: any }[]
    ): Promise<any[]> {
        // Get dataset table name
        const { data: dataset, error } = await supabase
            .from('datasets')
            .select('table_name')
            .eq('id', datasetId)
            .single();

        if (error) throw new Error(`Dataset not found: ${error.message}`);

        // Build query
        let query = supabase
            .from(dataset.table_name)
            .select(columnNames.join(', '));

        // Apply filters if provided
        if (filters) {
            filters.forEach(filter => {
                switch (filter.operator) {
                    case '=':
                        query = query.eq(filter.column, filter.value);
                        break;
                    case '>':
                        query = query.gt(filter.column, filter.value);
                        break;
                    case '<':
                        query = query.lt(filter.column, filter.value);
                        break;
                    case '>=':
                        query = query.gte(filter.column, filter.value);
                        break;
                    case '<=':
                        query = query.lte(filter.column, filter.value);
                        break;
                    case 'in':
                        query = query.in(filter.column, filter.value);
                        break;
                }
            });
        }

        const { data, error: queryError } = await query;

        if (queryError) throw new Error(`Query failed: ${queryError.message}`);

        return data || [];
    }

    /**
     * Calculate metrics for a dataset column
     */
    async calculateMetrics(datasetId: string, columnName: string): Promise<{
        count: number;
        sum?: number;
        avg?: number;
        min?: number;
        max?: number;
        median?: number;
    }> {
        const data = await this.fetchColumns(datasetId, [columnName]);

        const values = data.map(row => row[columnName]).filter(v => v != null);
        const numericValues = values.filter(v => typeof v === 'number').sort((a, b) => a - b);

        const metrics: any = {
            count: values.length
        };

        if (numericValues.length > 0) {
            metrics.sum = numericValues.reduce((a, b) => a + b, 0);
            metrics.avg = metrics.sum / numericValues.length;
            metrics.min = numericValues[0];
            metrics.max = numericValues[numericValues.length - 1];

            // Calculate median
            const mid = Math.floor(numericValues.length / 2);
            metrics.median = numericValues.length % 2 === 0
                ? (numericValues[mid - 1] + numericValues[mid]) / 2
                : numericValues[mid];
        }

        return metrics;
    }

    /**
     * Group data by column for bar/line charts
     */
    async groupBy(
        datasetId: string,
        groupColumn: string,
        valueColumn: string,
        aggregation: 'count' | 'sum' | 'avg' = 'count'
    ): Promise<{ [key: string]: number }> {
        const data = await this.fetchColumns(datasetId, [groupColumn, valueColumn]);

        const groups: { [key: string]: number[] } = {};

        data.forEach(row => {
            const key = row[groupColumn];
            if (!groups[key]) groups[key] = [];
            if (aggregation !== 'count') {
                groups[key].push(row[valueColumn]);
            }
        });

        const result: { [key: string]: number } = {};

        Object.keys(groups).forEach(key => {
            switch (aggregation) {
                case 'count':
                    result[key] = data.filter(row => row[groupColumn] === key).length;
                    break;
                case 'sum':
                    result[key] = groups[key].reduce((a, b) => a + b, 0);
                    break;
                case 'avg':
                    result[key] = groups[key].reduce((a, b) => a + b, 0) / groups[key].length;
                    break;
            }
        });

        return result;
    }

    /**
     * Get scatter plot data for two numeric columns
     */
    async getScatterData(
        datasetId: string,
        xColumn: string,
        yColumn: string,
        groupColumn?: string
    ): Promise<any[]> {
        const columns = groupColumn
            ? [xColumn, yColumn, groupColumn]
            : [xColumn, yColumn];

        const data = await this.fetchColumns(datasetId, columns);

        return data.map(row => ({
            x: row[xColumn],
            y: row[yColumn],
            group: groupColumn ? row[groupColumn] : undefined
        }));
    }

    /**
     * Calculate histogram bins
     */
    async getHistogramData(
        datasetId: string,
        columnName: string,
        bins: number = 10
    ): Promise<{ bin: string; count: number; range: [number, number] }[]> {
        const data = await this.fetchColumns(datasetId, [columnName]);
        const values = data.map(row => row[columnName]).filter(v => typeof v === 'number');

        if (values.length === 0) return [];

        const min = Math.min(...values);
        const max = Math.max(...values);
        const binSize = (max - min) / bins;

        const histogram: { bin: string; count: number; range: [number, number] }[] = [];

        for (let i = 0; i < bins; i++) {
            const rangeStart = min + i * binSize;
            const rangeEnd = min + (i + 1) * binSize;
            const count = values.filter(v => v >= rangeStart && v < rangeEnd).length;

            histogram.push({
                bin: `${rangeStart.toFixed(1)}-${rangeEnd.toFixed(1)}`,
                count,
                range: [rangeStart, rangeEnd]
            });
        }

        return histogram;
    }

    /**
     * Get correlation between two numeric columns
     */
    async getCorrelation(
        datasetId: string,
        column1: string,
        column2: string
    ): Promise<number> {
        const data = await this.fetchColumns(datasetId, [column1, column2]);

        const pairs = data
            .filter(row => typeof row[column1] === 'number' && typeof row[column2] === 'number')
            .map(row => [row[column1], row[column2]]);

        if (pairs.length === 0) return 0;

        const n = pairs.length;
        const sum1 = pairs.reduce((sum, pair) => sum + pair[0], 0);
        const sum2 = pairs.reduce((sum, pair) => sum + pair[1], 0);
        const sum1Sq = pairs.reduce((sum, pair) => sum + pair[0] * pair[0], 0);
        const sum2Sq = pairs.reduce((sum, pair) => sum + pair[1] * pair[1], 0);
        const pSum = pairs.reduce((sum, pair) => sum + pair[0] * pair[1], 0);

        const num = pSum - (sum1 * sum2 / n);
        const den = Math.sqrt((sum1Sq - sum1 * sum1 / n) * (sum2Sq - sum2 * sum2 / n));

        return den === 0 ? 0 : num / den;
    }
}

// Singleton instance
export const notebookDataService = new NotebookDataService();
