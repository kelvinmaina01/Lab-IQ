import { supabase } from '@/integrations/supabase/client';
import { enhancedNotificationService } from './enhancedNotificationService';

export interface ClinicalSignals {
    diagnosticConfidence: number;
    dataIntegrity: number;
    analysisTurnaround: number;
    teamVelocity: number;
    operationalEfficiency: number;
}

export class HealthMonitorService {
    private static instance: HealthMonitorService;
    private readonly CHECK_INTERVAL_KEY = 'last_health_check';
    private readonly CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

    public static getInstance(): HealthMonitorService {
        if (!HealthMonitorService.instance) {
            HealthMonitorService.instance = new HealthMonitorService();
        }
        return HealthMonitorService.instance;
    }

    /**
     * Check if we should run health monitoring (once per day)
     */
    private shouldCheckHealth(): boolean {
        const lastCheck = localStorage.getItem(this.CHECK_INTERVAL_KEY);
        if (!lastCheck) return true;

        const timeSinceLastCheck = Date.now() - parseInt(lastCheck);
        return timeSinceLastCheck >= this.CHECK_INTERVAL_MS;
    }

    /**
     * Main entry point: Check health and create notifications if needed
     */
    async checkHealthAndNotify(userId: string, stats: ClinicalSignals): Promise<void> {
        // Only check once per day
        if (!this.shouldCheckHealth()) {
            return;
        }

        const notifications: any[] = [];

        // 1. Check Diagnostic Confidence (Model Accuracy)
        if (stats.diagnosticConfidence > 0 && stats.diagnosticConfidence < 70) {
            notifications.push({
                user_id: userId,
                type: 'warning',
                title: 'Low Model Accuracy Detected',
                message: `Diagnostic confidence is at ${stats.diagnosticConfidence}%. Review model performance to improve accuracy.`,
                action_url: '/models',
                priority: 'high',
                read: false,
                category: 'system_health'
            });
        }

        // 2. Check Data Integrity
        if (stats.dataIntegrity > 0 && stats.dataIntegrity < 80) {
            notifications.push({
                user_id: userId,
                type: 'warning',
                title: 'Data Quality Issues',
                message: `Data integrity score is ${stats.dataIntegrity}%. Check dataset quality to ensure reliable analysis.`,
                action_url: '/datasets',
                priority: 'medium',
                read: false,
                category: 'system_health'
            });
        }

        // 3. Check Team Activity
        if (stats.teamVelocity === 0) {
            notifications.push({
                user_id: userId,
                type: 'info',
                title: 'No Recent Team Activity',
                message: 'No team members have been active in the past 7 days. Consider reviewing your projects.',
                action_url: '/collaboration',
                priority: 'low',
                read: false,
                category: 'system_health'
            });
        }

        // 4. Check Overall Efficiency
        if (stats.operationalEfficiency > 0 && stats.operationalEfficiency < 50) {
            notifications.push({
                user_id: userId,
                type: 'warning',
                title: 'Low Operational Efficiency',
                message: `System efficiency is at ${stats.operationalEfficiency}%. Multiple factors may be affecting performance.`,
                action_url: '/dashboard',
                priority: 'high',
                read: false,
                category: 'system_health'
            });
        }


        // Save all notifications to database
        if (notifications.length > 0) {
            await this.createNotifications(notifications);
        }

        // Update last check timestamp
        localStorage.setItem(this.CHECK_INTERVAL_KEY, Date.now().toString());
    }

    /**
     * Create notifications using enhanced service (with email/Slack)
     */
    private async createNotifications(notifications: any[]): Promise<void> {
        try {
            // Use enhanced notification service for each notification
            for (const notif of notifications) {
                await enhancedNotificationService.send({
                    user_id: notif.user_id,
                    type: notif.type,
                    title: notif.title,
                    message: notif.message,
                    action_url: notif.action_url,
                    priority: notif.priority,
                    category: notif.category
                });
            }
        } catch (error) {
            console.error('Error creating notifications:', error);
        }
    }

    /**
     * Force a health check (bypass time check)
     */
    async forceHealthCheck(userId: string, stats: ClinicalSignals): Promise<void> {
        localStorage.removeItem(this.CHECK_INTERVAL_KEY);
        await this.checkHealthAndNotify(userId, stats);
    }

    /**
     * Clear the last check timestamp (for testing)
     */
    clearLastCheck(): void {
        localStorage.removeItem(this.CHECK_INTERVAL_KEY);
    }
}

export const healthMonitorService = HealthMonitorService.getInstance();
