import { supabase } from '@/integrations/supabase/client';
import type { ParsedData, ColumnInfo, QualityMetrics } from '@/lib/parsers/types';
import { qualityAnalyzer } from '@/lib/analysis/qualityAnalyzer';

export class DatasetService {
    /**
     * Save a new dataset to Supabase
     */
    async saveDataset(
        userId: string,
        parsedData: ParsedData,
        onProgress?: (progress: number, message: string) => void
    ): Promise<string> {
        try {
            // 1. Create dataset record
            onProgress?.(10, 'Creating dataset record...');
            const { data: dataset, error: datasetError } = await supabase
                .from('datasets')
                .insert({
                    user_id: userId,
                    name: parsedData.fileName.split('.')[0], // Default name from filename
                    file_name: parsedData.fileName,
                    file_size: parsedData.fileSize,
                    file_type: parsedData.fileType,
                    row_count: parsedData.rowCount,
                    column_count: parsedData.columnCount,
                    status: 'processing'
                })
                .select()
                .single();

            if (datasetError) throw new Error(`Failed to create dataset: ${datasetError.message}`);
            const datasetId = dataset.id;

            // 2. Save columns (Schema)
            onProgress?.(20, 'Saving schema information...');
            await this.saveColumns(datasetId, parsedData.columns, parsedData.rows);

            // 3. Analyze Quality
            onProgress?.(25, 'Analyzing data quality...');
            const qualityMetrics = qualityAnalyzer.analyze(parsedData.rows, parsedData.columns);
            await this.saveQualityMetrics(datasetId, qualityMetrics);

            // 4. Save rows (Data)
            // Batch insert rows to avoid hitting payload limits and for better performance
            onProgress?.(30, 'Uploading data rows...');
            await this.saveRows(datasetId, parsedData.rows, (progress) => {
                // Map row progress (0-100) to overall progress (30-90)
                const overallProgress = 30 + (progress * 0.6);
                onProgress?.(overallProgress, `Uploading data rows (${Math.round(progress)}%)...`);
            });

            // 5. Update status to ready and save preview data
            onProgress?.(95, 'Finalizing...');

            // Save first 100 rows as preview_data
            const previewRows = parsedData.rows.slice(0, 100);

            // Build schema object for easy access
            const schemaObject = {
                columns: parsedData.columns.map(col => ({
                    id: `col_${col.index}`,
                    column_name: col.name,
                    name: col.name,
                    data_type: col.dataType,
                    type: col.dataType,
                    nullable: col.nullable,
                    unique_values_count: col.uniqueValues
                }))
            };

            const { error: updateError } = await supabase
                .from('datasets')
                .update({
                    status: 'ready',
                    preview_data: previewRows,
                    schema: schemaObject
                })
                .eq('id', datasetId);

            if (updateError) throw new Error(`Failed to update status: ${updateError.message}`);

            // 6. Log activity
            await supabase.from('activities').insert({
                user_id: userId,
                action: 'Dataset uploaded',
                item: parsedData.fileName,
                icon: 'Database'
            });

            // 7. Update usage stats
            await this.updateUsageStats(userId, 1, parsedData.fileSize);

            onProgress?.(100, 'Upload complete!');
            return datasetId;

        } catch (error) {
            console.error('Dataset save error:', error);
            throw error;
        }
    }

    /**
     * Save column definitions
     */
    private async saveColumns(datasetId: string, columns: ColumnInfo[], rows: Record<string, any>[]) {
        // Import dynamically to avoid circular dependencies if any, or just use the imported one
        const { statisticalAnalyzer } = await import('@/lib/analysis/statisticalAnalyzer');

        const columnRecords = columns.map(col => {
            // Calculate full statistics including distribution
            const values = rows.map(r => r[col.name]);
            const fullStats = statisticalAnalyzer.analyzeColumn(col.name, values, col.dataType);

            return {
                dataset_id: datasetId,
                column_name: col.name,
                column_index: col.index,
                data_type: col.dataType,
                nullable: col.nullable,
                unique_values_count: col.uniqueValues,
                sample_values: JSON.stringify(col.sampleValues),
                stats: JSON.stringify(fullStats) // Save the full stats object
            };
        });

        const { error } = await supabase
            .from('dataset_columns')
            .insert(columnRecords);

        if (error) throw new Error(`Failed to save columns: ${error.message}`);
    }

    /**
     * Save quality metrics
     */
    private async saveQualityMetrics(datasetId: string, metrics: QualityMetrics) {
        const { error } = await supabase
            .from('dataset_quality')
            .insert({
                dataset_id: datasetId,
                completeness_score: metrics.completenessScore,
                consistency_score: metrics.consistencyScore,
                accuracy_score: metrics.accuracyScore,
                overall_score: metrics.overallScore,
                missing_values_count: metrics.missingValuesCount,
                duplicate_rows_count: metrics.duplicateRowsCount,
                outliers_count: metrics.outliersCount,
                issues: JSON.stringify(metrics.issues)
            });

        if (error) throw new Error(`Failed to save quality metrics: ${error.message}`);
    }

    /**
     * Save rows in batches
     */
    private async saveRows(
        datasetId: string,
        rows: Record<string, any>[],
        onProgress?: (progress: number) => void
    ) {
        const BATCH_SIZE = 1000; // Supabase can handle reasonably large batches
        const totalRows = rows.length;

        for (let i = 0; i < totalRows; i += BATCH_SIZE) {
            const batch = rows.slice(i, i + BATCH_SIZE);
            const rowRecords = batch.map((row, index) => ({
                dataset_id: datasetId,
                row_index: i + index,
                data: row // Supabase automatically handles JSONB conversion
            }));

            const { error } = await supabase
                .from('dataset_rows')
                .insert(rowRecords);

            if (error) throw new Error(`Failed to save rows batch ${i}: ${error.message}`);

            if (onProgress) {
                const progress = Math.min(100, ((i + BATCH_SIZE) / totalRows) * 100);
                onProgress(progress);
            }
        }
    }
    /**
     * Delete a dataset and all associated data
     */
    async deleteDataset(datasetId: string): Promise<void> {
        // Get dataset info first to update stats
        const { data: dataset } = await supabase
            .from('datasets')
            .select('user_id, file_size')
            .eq('id', datasetId)
            .single();

        const { error } = await supabase
            .from('datasets')
            .delete()
            .eq('id', datasetId);

        if (error) throw new Error(`Failed to delete dataset: ${error.message}`);

        if (dataset) {
            await this.updateUsageStats(dataset.user_id, -1, -dataset.file_size);
        }
    }

    /**
     * Update usage statistics
     */
    private async updateUsageStats(userId: string, deltaCount: number, deltaSizeBytes: number) {
        const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
        const deltaMB = deltaSizeBytes / (1024 * 1024);

        // First try to get existing stats
        const { data: existingStats } = await supabase
            .from('usage_stats')
            .select('*')
            .eq('user_id', userId)
            .eq('month', currentMonth)
            .single();

        if (existingStats) {
            await supabase
                .from('usage_stats')
                .update({
                    datasets_count: (existingStats.datasets_count || 0) + deltaCount,
                    storage_used_mb: (existingStats.storage_used_mb || 0) + deltaMB
                })
                .eq('id', existingStats.id);
        } else {
            // Create new record if not exists
            await supabase
                .from('usage_stats')
                .insert({
                    user_id: userId,
                    month: currentMonth,
                    datasets_count: deltaCount > 0 ? deltaCount : 0,
                    storage_used_mb: deltaMB > 0 ? deltaMB : 0
                });
        }
    }
}

export const datasetService = new DatasetService();
