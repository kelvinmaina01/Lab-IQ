/**
 * LabIQ Health - Dataset Versioning Service
 * 
 * Handles dataset version control, lineage tracking, and quality management.
 * Supports:
 * - Version creation and history
 * - Domain classification
 * - Quality scoring
 * - Provenance tracking
 */

import { supabase } from '@/integrations/supabase/client';
import { eventBus, EventTypes, DatasetUploadedPayload } from '@/lib/events';

// =============================================================================
// TYPES
// =============================================================================

export type DatasetDomain = 'health' | 'clinical' | 'biopharma' | 'environmental' | 'population' | 'general';
export type ChangeType = 'initial' | 'update' | 'transform' | 'merge' | 'anonymize' | 'enrich';
export type QualityCheckType = 'completeness' | 'accuracy' | 'consistency' | 'validity' | 'timeliness' | 'full';

export interface DatasetVersion {
    id: string;
    datasetId: string;
    version: number;
    createdBy: string | null;
    createdAt: string;
    changeSummary: string | null;
    changeType: ChangeType;
    rowsAdded: number;
    rowsRemoved: number;
    rowsModified: number;
    columnsAdded: string[];
    columnsRemoved: string[];
    snapshotRowCount: number | null;
    snapshotColumnCount: number | null;
    snapshotSizeBytes: number | null;
    snapshotChecksum: string | null;
}

export interface DataLineage {
    id: string;
    sourceType: string;
    sourceId: string | null;
    sourceName: string | null;
    targetType: string;
    targetId: string;
    targetName: string | null;
    transformationType: string | null;
    transformationParams: Record<string, unknown>;
    transformationDescription: string | null;
    createdAt: string;
    createdBy: string | null;
    isVerified: boolean;
}

export interface QualityCheck {
    id: string;
    datasetId: string;
    checkType: QualityCheckType;
    score: number;
    threshold: number;
    passed: boolean;
    issues: Array<{
        field: string;
        issue: string;
        severity: 'low' | 'medium' | 'high';
        count: number;
    }>;
    recommendations: string[];
    checkedAt: string;
    durationMs: number | null;
}

export interface DomainClassification {
    domain: DatasetDomain;
    confidence: number;
    indicators: string[];
    modelUsed: string;
    classifiedAt: string;
    isVerified: boolean;
}

export interface QualityBreakdown {
    completeness: number;
    accuracy: number;
    consistency: number;
    validity: number;
}

// =============================================================================
// DATASET VERSIONING SERVICE
// =============================================================================

class DatasetVersioningService {
    // ===========================================================================
    // VERSION MANAGEMENT
    // ===========================================================================

    /**
     * Create a new version of a dataset
     */
    async createVersion(
        datasetId: string,
        changeSummary: string,
        changeType: ChangeType = 'update',
        changes?: {
            rowsAdded?: number;
            rowsRemoved?: number;
            rowsModified?: number;
            columnsAdded?: string[];
            columnsRemoved?: string[];
        }
    ): Promise<DatasetVersion | null> {
        try {
            const { data: user } = await supabase.auth.getUser();
            if (!user.user) return null;

            // Get current version
            const { data: dataset } = await supabase
                .from('datasets')
                .select('version')
                .eq('id', datasetId)
                .single();

            const currentVersion = (dataset?.version as number) || 0;
            const newVersion = currentVersion + 1;

            // Update dataset version
            await supabase
                .from('datasets')
                .update({
                    version: newVersion,
                    is_latest_version: true,
                    version_notes: changeSummary,
                })
                .eq('id', datasetId);

            // Get dataset stats for snapshot
            const { data: stats } = await supabase
                .from('datasets')
                .select('row_count, column_count')
                .eq('id', datasetId)
                .single();

            // Create version record
            const { data: versionData, error } = await supabase
                .from('dataset_versions' as any)
                .insert({
                    dataset_id: datasetId,
                    version: newVersion,
                    created_by: user.user.id,
                    change_summary: changeSummary,
                    change_type: changeType,
                    rows_added: changes?.rowsAdded || 0,
                    rows_removed: changes?.rowsRemoved || 0,
                    rows_modified: changes?.rowsModified || 0,
                    columns_added: changes?.columnsAdded || [],
                    columns_removed: changes?.columnsRemoved || [],
                    snapshot_row_count: stats?.row_count || 0,
                    snapshot_column_count: stats?.column_count || 0,
                })
                .select()
                .single();

            if (error) {
                console.error('Error creating version:', error);
                return null;
            }

            return this.mapVersionRecord(versionData);
        } catch (error) {
            console.error('Error creating version:', error);
            return null;
        }
    }

    /**
     * Get version history for a dataset
     */
    async getVersionHistory(datasetId: string): Promise<DatasetVersion[]> {
        try {
            const { data, error } = await supabase
                .from('dataset_versions' as any)
                .select('*')
                .eq('dataset_id', datasetId)
                .order('version', { ascending: false });

            if (error) {
                console.error('Error fetching version history:', error);
                return [];
            }

            return (data || []).map(this.mapVersionRecord);
        } catch (error) {
            console.error('Error fetching version history:', error);
            return [];
        }
    }

    /**
     * Get a specific version
     */
    async getVersion(datasetId: string, version: number): Promise<DatasetVersion | null> {
        try {
            const { data, error } = await supabase
                .from('dataset_versions' as any)
                .select('*')
                .eq('dataset_id', datasetId)
                .eq('version', version)
                .single();

            if (error) return null;
            return this.mapVersionRecord(data);
        } catch (error) {
            return null;
        }
    }

    // ===========================================================================
    // DOMAIN CLASSIFICATION
    // ===========================================================================

    /**
     * Classify a dataset's domain based on its content
     */
    async classifyDomain(datasetId: string): Promise<DomainClassification> {
        try {
            const { data: user } = await supabase.auth.getUser();

            // Get dataset columns for analysis
            const { data: columns } = await supabase
                .from('dataset_columns')
                .select('name, data_type')
                .eq('dataset_id', datasetId);

            const columnNames = (columns || []).map(c => c.name.toLowerCase());

            // Domain detection heuristics
            const healthIndicators = ['patient', 'diagnosis', 'symptom', 'treatment', 'medication', 'health', 'disease', 'clinical', 'hospital', 'medical'];
            const clinicalIndicators = ['trial', 'placebo', 'dosage', 'adverse', 'efficacy', 'protocol', 'randomized', 'blind'];
            const biopharmaIndicators = ['compound', 'molecule', 'assay', 'ic50', 'target', 'binding', 'inhibitor', 'kinase'];
            const environmentalIndicators = ['pollution', 'air_quality', 'water', 'emission', 'environmental', 'climate', 'temperature'];
            const populationIndicators = ['demographic', 'population', 'census', 'survey', 'age_group', 'income', 'education'];

            const countMatches = (indicators: string[]) =>
                columnNames.filter(col => indicators.some(ind => col.includes(ind))).length;

            const scores: Record<DatasetDomain, number> = {
                clinical: countMatches(clinicalIndicators) * 2 + countMatches(healthIndicators),
                health: countMatches(healthIndicators),
                biopharma: countMatches(biopharmaIndicators),
                environmental: countMatches(environmentalIndicators),
                population: countMatches(populationIndicators),
                general: 1, // Base score
            };

            // Find best match
            const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
            const [domain, score] = sorted[0] as [DatasetDomain, number];
            const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
            const confidence = Math.min(0.95, score / Math.max(totalScore, 1));

            // Get matched indicators
            let indicators: string[] = [];
            switch (domain) {
                case 'clinical': indicators = columnNames.filter(col => clinicalIndicators.some(ind => col.includes(ind))); break;
                case 'health': indicators = columnNames.filter(col => healthIndicators.some(ind => col.includes(ind))); break;
                case 'biopharma': indicators = columnNames.filter(col => biopharmaIndicators.some(ind => col.includes(ind))); break;
                case 'environmental': indicators = columnNames.filter(col => environmentalIndicators.some(ind => col.includes(ind))); break;
                case 'population': indicators = columnNames.filter(col => populationIndicators.some(ind => col.includes(ind))); break;
            }

            // Update dataset
            await supabase
                .from('datasets')
                .update({
                    domain,
                    domain_confidence: confidence,
                    domain_indicators: indicators,
                })
                .eq('id', datasetId);

            // Log classification
            await supabase
                .from('domain_classifications' as any)
                .insert({
                    dataset_id: datasetId,
                    domain,
                    confidence,
                    indicators,
                    model_used: 'heuristic_v1',
                    classified_by: user.user?.id ? user.user.id : 'system',
                });

            return {
                domain,
                confidence,
                indicators,
                modelUsed: 'heuristic_v1',
                classifiedAt: new Date().toISOString(),
                isVerified: false,
            };
        } catch (error) {
            console.error('Error classifying domain:', error);
            return {
                domain: 'general',
                confidence: 0.5,
                indicators: [],
                modelUsed: 'fallback',
                classifiedAt: new Date().toISOString(),
                isVerified: false,
            };
        }
    }

    // ===========================================================================
    // QUALITY CHECKS
    // ===========================================================================

    /**
     * Run a quality check on a dataset
     */
    async runQualityCheck(
        datasetId: string,
        checkType: QualityCheckType = 'full'
    ): Promise<QualityCheck | null> {
        const startTime = Date.now();

        try {
            // Get dataset data
            const { data: dataset } = await supabase
                .from('datasets')
                .select('row_count, column_count')
                .eq('id', datasetId)
                .single();

            const { data: columns } = await supabase
                .from('dataset_columns')
                .select('*')
                .eq('dataset_id', datasetId);

            const issues: QualityCheck['issues'] = [];
            const recommendations: string[] = [];
            let completeness = 100;
            let accuracy = 100;
            let consistency = 100;
            let validity = 100;

            // Check completeness (null values)
            for (const col of columns || []) {
                const nullPercentage = col.null_percentage || 0;
                if (nullPercentage > 20) {
                    issues.push({
                        field: col.name,
                        issue: `High null percentage (${nullPercentage.toFixed(1)}%)`,
                        severity: nullPercentage > 50 ? 'high' : 'medium',
                        count: Math.round((dataset?.row_count || 0) * nullPercentage / 100),
                    });
                    completeness -= nullPercentage / (columns?.length || 1);
                }
            }

            // Add recommendations based on issues
            if (completeness < 80) {
                recommendations.push('Consider imputing missing values or removing incomplete records');
            }
            if (issues.length > 3) {
                recommendations.push('Multiple quality issues detected. Consider data cleaning pipeline.');
            }

            // Calculate overall score
            completeness = Math.max(0, Math.min(100, completeness));
            const score = (completeness * 0.3) + (accuracy * 0.3) + (consistency * 0.2) + (validity * 0.2);
            const threshold = 80;
            const durationMs = Date.now() - startTime;

            // Save quality check
            const { data: checkData, error } = await supabase
                .from('quality_checks' as any)
                .insert({
                    dataset_id: datasetId,
                    check_type: checkType,
                    score,
                    threshold,
                    issues,
                    recommendations,
                    duration_ms: durationMs,
                    trigger_type: 'manual',
                })
                .select()
                .single();

            if (error) {
                console.error('Error saving quality check:', error);
                return null;
            }

            // Update dataset quality score
            await supabase
                .from('datasets')
                .update({
                    quality_score: score,
                    quality_breakdown: { completeness, accuracy, consistency, validity },
                    last_quality_check: new Date().toISOString(),
                })
                .eq('id', datasetId);

            // Emit event if quality check failed
            if (score < threshold) {
                eventBus.emit(
                    EventTypes.QUALITY_CHECK_FAILED,
                    {
                        datasetId,
                        checkType,
                        passed: false,
                        score,
                        threshold,
                        issues,
                        recommendations,
                    },
                    {
                        source: 'datasetVersioningService',
                        metadata: { durationMs },
                    }
                );
            }

            return {
                id: checkData.id,
                datasetId,
                checkType,
                score,
                threshold,
                passed: score >= threshold,
                issues,
                recommendations,
                checkedAt: checkData.checked_at,
                durationMs,
            };
        } catch (error) {
            console.error('Error running quality check:', error);
            return null;
        }
    }

    /**
     * Get quality check history
     */
    async getQualityHistory(datasetId: string): Promise<QualityCheck[]> {
        try {
            const { data, error } = await supabase
                .from('quality_checks' as any)
                .select('*')
                .eq('dataset_id', datasetId)
                .order('checked_at', { ascending: false })
                .limit(20);

            if (error) return [];

            return (data || []).map((check: any) => ({
                id: check.id,
                datasetId: check.dataset_id,
                checkType: check.check_type,
                score: check.score,
                threshold: check.threshold,
                passed: check.passed,
                issues: check.issues || [],
                recommendations: check.recommendations || [],
                checkedAt: check.checked_at,
                durationMs: check.duration_ms,
            }));
        } catch (error) {
            return [];
        }
    }

    // ===========================================================================
    // LINEAGE TRACKING
    // ===========================================================================

    /**
     * Record a data lineage entry
     */
    async recordLineage(
        source: { type: string; id?: string; name?: string; metadata?: Record<string, unknown> },
        target: { type: string; id: string; name?: string },
        transformation?: { type?: string; params?: Record<string, unknown>; description?: string }
    ): Promise<DataLineage | null> {
        try {
            const { data: user } = await supabase.auth.getUser();

            const { data, error } = await supabase
                .from('data_lineage' as any)
                .insert({
                    source_type: source.type,
                    source_id: source.id || null,
                    source_name: source.name || null,
                    source_metadata: source.metadata || {},
                    target_type: target.type,
                    target_id: target.id,
                    target_name: target.name || null,
                    transformation_type: transformation?.type || null,
                    transformation_params: transformation?.params || {},
                    transformation_description: transformation?.description || null,
                    created_by: user.user?.id || null,
                })
                .select()
                .single();

            if (error) {
                console.error('Error recording lineage:', error);
                return null;
            }

            return this.mapLineageRecord(data);
        } catch (error) {
            console.error('Error recording lineage:', error);
            return null;
        }
    }

    /**
     * Get lineage for a target
     */
    async getLineage(targetType: string, targetId: string): Promise<DataLineage[]> {
        try {
            const { data, error } = await supabase
                .from('data_lineage' as any)
                .select('*')
                .eq('target_type', targetType)
                .eq('target_id', targetId)
                .order('created_at', { ascending: false });

            if (error) return [];
            return (data || []).map(this.mapLineageRecord);
        } catch (error) {
            return [];
        }
    }

    // ===========================================================================
    // HELPER METHODS
    // ===========================================================================

    private mapVersionRecord(record: any): DatasetVersion {
        return {
            id: record.id,
            datasetId: record.dataset_id,
            version: record.version,
            createdBy: record.created_by,
            createdAt: record.created_at,
            changeSummary: record.change_summary,
            changeType: record.change_type,
            rowsAdded: record.rows_added || 0,
            rowsRemoved: record.rows_removed || 0,
            rowsModified: record.rows_modified || 0,
            columnsAdded: record.columns_added || [],
            columnsRemoved: record.columns_removed || [],
            snapshotRowCount: record.snapshot_row_count,
            snapshotColumnCount: record.snapshot_column_count,
            snapshotSizeBytes: record.snapshot_size_bytes,
            snapshotChecksum: record.snapshot_checksum,
        };
    }

    private mapLineageRecord(record: any): DataLineage {
        return {
            id: record.id,
            sourceType: record.source_type,
            sourceId: record.source_id,
            sourceName: record.source_name,
            targetType: record.target_type,
            targetId: record.target_id,
            targetName: record.target_name,
            transformationType: record.transformation_type,
            transformationParams: record.transformation_params || {},
            transformationDescription: record.transformation_description,
            createdAt: record.created_at,
            createdBy: record.created_by,
            isVerified: record.is_verified || false,
        };
    }
}

// =============================================================================
// EXPORTS
// =============================================================================

export const datasetVersioningService = new DatasetVersioningService();
export default datasetVersioningService;
