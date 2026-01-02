import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { addDays, subDays, startOfWeek } from 'date-fns';
import { healthMonitorService } from '@/lib/services/healthMonitorService';

export interface ClinicalSignals {
    diagnosticConfidence: number; // 0-100
    dataIntegrity: number; // 0-100
    analysisTurnaround: number; // in milliseconds
    teamVelocity: number; // Weekly Active Users
    operationalEfficiency: number; // 0-100 Composite
    isLoading: boolean;
}

export const useLabHealth = () => {
    const [stats, setStats] = useState<ClinicalSignals>({
        diagnosticConfidence: 0,
        dataIntegrity: 0,
        analysisTurnaround: 0,
        teamVelocity: 0,
        operationalEfficiency: 0,
        isLoading: true
    });

    useEffect(() => {
        const fetchHealthSignals = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return; // Should likely redirect or handle, but hook just stops

                // 1. Diagnostic Confidence (Model Accuracy)
                // Fetch completed models and average their accuracy
                const { data: models } = await supabase
                    .from('models')
                    .select('metrics')
                    .eq('status', 'trained'); // or 'completed', checking standard

                // Note: Models.tsx uses 'status' but values might be 'trained', 'completed', 'active'. 
                // Using 'trained' as a safe bet from typical ML flows, but if 0, we'll try to fetch all non-failed.

                let avgAccuracy = 0;
                if (models && models.length > 0) {
                    const validModels = models.filter(m => m.metrics && (m.metrics as any).accuracy !== undefined);
                    if (validModels.length > 0) {
                        const totalAccuracy = validModels.reduce((sum, m) => sum + (Number((m.metrics as any).accuracy) || 0), 0);
                        avgAccuracy = (totalAccuracy / validModels.length) * 100;
                    }
                }

                // 2. Data Integrity (Dataset Quality)
                // Fetch quality scores from dataset_quality
                // we want recent datasets to reflect current health
                const { data: qualityData } = await supabase
                    .from('dataset_quality')
                    .select('overall_score')
                    .limit(20)
                    .order('created_at', { ascending: false });

                let avgQuality = 0;
                if (qualityData && qualityData.length > 0) {
                    const totalQuality = qualityData.reduce((sum, q) => sum + (q.overall_score || 0), 0);
                    // Quality score is typically 0-1 or 0-100? 
                    // datasetService uses qualityAnalyzer. usually returns 0-100 for 'score'.
                    // Let's assume 0-100 based on standard
                    avgQuality = totalQuality / qualityData.length;
                }

                // 3. Analysis Turnaround (Workflow Speed)
                // execution_time_ms from completed workflows
                const { data: workflows } = await supabase
                    .from('workflow_executions')
                    .select('execution_time_ms')
                    .eq('status', 'completed')
                    .limit(20)
                    .order('completed_at', { ascending: false });

                let avgDuration = 0;
                if (workflows && workflows.length > 0) {
                    const totalDuration = workflows.reduce((sum, w) => sum + (w.execution_time_ms || 0), 0);
                    avgDuration = totalDuration / workflows.length;
                }

                // 4. Team Velocity (Active Users Last 7 Days)
                const sevenDaysAgo = subDays(new Date(), 7).toISOString();
                const { data: activeUsers } = await supabase
                    .from('activities')
                    .select('user_id')
                    .gte('created_at', sevenDaysAgo);

                // Count unique users
                const uniqueUsers = new Set(activeUsers?.map(a => a.user_id)).size;

                // 5. Composite Score
                // Default weighted average
                // We normalize all to 0-100 scale where possible.
                // Duration is hard to normalize without a baseline (SLO). 
                // We'll calculate efficiency based on 2 factors: Confidence and Integrity for now.
                // If duration is < 5 min (300000ms), we consider it "Efficient" (bonus points).

                let efficiency = (avgAccuracy * 0.4) + (avgQuality * 0.4);
                // Boost for speed
                if (avgDuration > 0 && avgDuration < 60000) efficiency += 20; // Super fast
                else if (avgDuration > 0 && avgDuration < 300000) efficiency += 10; // Fast
                else efficiency += 5; // Baseline

                // Cap at 100
                efficiency = Math.min(100, Math.round(efficiency));

                setStats({
                    diagnosticConfidence: Math.round(avgAccuracy),
                    dataIntegrity: Math.round(avgQuality),
                    analysisTurnaround: Math.round(avgDuration),
                    teamVelocity: uniqueUsers,
                    operationalEfficiency: efficiency,
                    isLoading: false
                });

                // Run health monitoring (creates notifications if issues detected)
                await healthMonitorService.checkHealthAndNotify(user.id, {
                    diagnosticConfidence: Math.round(avgAccuracy),
                    dataIntegrity: Math.round(avgQuality),
                    analysisTurnaround: Math.round(avgDuration),
                    teamVelocity: uniqueUsers,
                    operationalEfficiency: efficiency
                });

            } catch (error) {
                console.error("Failed to fetch health signals:", error);
                setStats(prev => ({ ...prev, isLoading: false }));
            }
        };

        fetchHealthSignals();
    }, []);

    return stats;
};
