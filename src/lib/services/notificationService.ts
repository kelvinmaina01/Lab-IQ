/**
 * NotificationService - Multi-Channel Notification System
 * 
 * Per Blueprint Phase 6: Collaboration & Notifications
 * Supports in-app, email, and webhook notifications
 */

import { supabase } from '@/integrations/supabase/client';
import { eventBus, EventTypes } from '@/lib/events';

// =============================================================================
// TYPES
// =============================================================================

export type NotificationChannel = 'in_app' | 'email' | 'webhook' | 'all';
export type NotificationUrgency = 'low' | 'medium' | 'high' | 'critical';

export interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    urgency: NotificationUrgency;
    channel: NotificationChannel;
    userId: string;
    metadata?: Record<string, unknown>;
    read: boolean;
    createdAt: string;
}

export interface NotificationPreferences {
    userId: string;
    channels: {
        email: boolean;
        inApp: boolean;
        webhook: boolean;
    };
    filters: {
        urgencyThreshold: NotificationUrgency;
        mutedTypes: string[];
    };
}

export interface SendNotificationInput {
    type: string;
    title: string;
    message: string;
    urgency?: NotificationUrgency;
    channel?: NotificationChannel;
    userId?: string;
    metadata?: Record<string, unknown>;
}

// =============================================================================
// NOTIFICATION SERVICE CLASS
// =============================================================================

export class NotificationService {
    private userId: string | null = null;
    private preferences: NotificationPreferences | null = null;
    private webhookUrl: string | null = null;

    constructor() {
        this.initialize();
    }

    private async initialize(): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        this.userId = user?.id || null;

        // Subscribe to notification-triggering events
        this.setupEventListeners();
    }

    // =========================================================================
    // CORE NOTIFICATION METHODS
    // =========================================================================

    /**
     * Send a notification through specified channel(s)
     */
    async send(input: SendNotificationInput): Promise<Notification> {
        const notification: Notification = {
            id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            type: input.type,
            title: input.title,
            message: input.message,
            urgency: input.urgency || 'medium',
            channel: input.channel || 'in_app',
            userId: input.userId || this.userId || '',
            metadata: input.metadata,
            read: false,
            createdAt: new Date().toISOString(),
        };

        console.log('[NotificationService] Sending notification:', {
            type: notification.type,
            title: notification.title,
            channel: notification.channel,
            urgency: notification.urgency,
        });

        // Store in-app notification
        if (notification.channel === 'in_app' || notification.channel === 'all') {
            await this.storeInAppNotification(notification);
        }

        // Send email if configured
        if (notification.channel === 'email' || notification.channel === 'all') {
            await this.sendEmailNotification(notification);
        }

        // Trigger webhook if configured
        if (notification.channel === 'webhook' || notification.channel === 'all') {
            await this.triggerWebhook(notification);
        }

        return notification;
    }

    /**
     * Notify about an anomaly (convenience method)
     */
    async notifyAnomaly(params: {
        datasetId: string;
        description: string;
        severity: NotificationUrgency;
        affectedRows?: number;
    }): Promise<Notification> {
        return this.send({
            type: 'anomaly_detected',
            title: 'Anomaly Detected',
            message: params.description,
            urgency: params.severity,
            channel: params.severity === 'critical' ? 'all' : 'in_app',
            metadata: {
                datasetId: params.datasetId,
                affectedRows: params.affectedRows,
            },
        });
    }

    /**
     * Notify about experiment completion
     */
    async notifyExperimentComplete(params: {
        experimentId: string;
        experimentName: string;
        status: 'completed' | 'failed';
        summary?: string;
    }): Promise<Notification> {
        return this.send({
            type: 'experiment_complete',
            title: `Experiment ${params.status === 'completed' ? 'Completed' : 'Failed'}`,
            message: params.summary || `${params.experimentName} has ${params.status}`,
            urgency: params.status === 'failed' ? 'high' : 'low',
            metadata: {
                experimentId: params.experimentId,
                experimentName: params.experimentName,
            },
        });
    }

    /**
     * Notify about model training
     */
    async notifyModelTraining(params: {
        modelId: string;
        modelName?: string;
        status: 'started' | 'completed' | 'failed';
        metrics?: Record<string, number>;
    }): Promise<Notification> {
        const statusMessages = {
            started: 'Model training has begun',
            completed: 'Model training completed successfully',
            failed: 'Model training failed',
        };

        return this.send({
            type: 'model_training',
            title: 'Model Training Update',
            message: statusMessages[params.status],
            urgency: params.status === 'failed' ? 'high' : 'low',
            metadata: {
                modelId: params.modelId,
                modelName: params.modelName,
                metrics: params.metrics,
            },
        });
    }

    /**
     * Notify about report generation
     */
    async notifyReportReady(params: {
        reportId: string;
        reportName: string;
        downloadUrl?: string;
    }): Promise<Notification> {
        return this.send({
            type: 'report_ready',
            title: 'Report Ready',
            message: `${params.reportName} is ready for download`,
            urgency: 'low',
            metadata: {
                reportId: params.reportId,
                downloadUrl: params.downloadUrl,
            },
        });
    }

    // =========================================================================
    // NOTIFICATION MANAGEMENT
    // =========================================================================

    /**
     * Get all notifications for current user
     */
    async getNotifications(limit: number = 50): Promise<Notification[]> {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', this.userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('[NotificationService] Failed to get notifications:', error);
            return [];
        }

        return (data || []).map(this.mapToNotification);
    }

    /**
     * Get unread notification count
     */
    async getUnreadCount(): Promise<number> {
        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', this.userId)
            .eq('read', false);

        if (error) {
            console.error('[NotificationService] Failed to get unread count:', error);
            return 0;
        }

        return count || 0;
    }

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId: string): Promise<void> {
        await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', notificationId);
    }

    /**
     * Mark all notifications as read
     */
    async markAllAsRead(): Promise<void> {
        await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', this.userId)
            .eq('read', false);
    }

    /**
     * Delete a notification
     */
    async delete(notificationId: string): Promise<void> {
        await supabase
            .from('notifications')
            .delete()
            .eq('id', notificationId);
    }

    // =========================================================================
    // PREFERENCES
    // =========================================================================

    /**
     * Get notification preferences
     */
    async getPreferences(): Promise<NotificationPreferences | null> {
        if (this.preferences) return this.preferences;

        const { data, error } = await supabase
            .from('notification_preferences')
            .select('*')
            .eq('user_id', this.userId)
            .single();

        if (error || !data) {
            return null;
        }

        this.preferences = {
            userId: data.user_id,
            channels: data.channels || { email: true, inApp: true, webhook: false },
            filters: data.filters || { urgencyThreshold: 'low', mutedTypes: [] },
        };

        return this.preferences;
    }

    /**
     * Update notification preferences
     */
    async updatePreferences(updates: Partial<NotificationPreferences>): Promise<void> {
        await supabase
            .from('notification_preferences')
            .upsert({
                user_id: this.userId,
                channels: updates.channels,
                filters: updates.filters,
            });

        this.preferences = null; // Clear cache
    }

    /**
     * Set webhook URL
     */
    setWebhookUrl(url: string): void {
        this.webhookUrl = url;
    }

    // =========================================================================
    // INTERNAL METHODS
    // =========================================================================

    private async storeInAppNotification(notification: Notification): Promise<void> {
        try {
            await supabase.from('notifications').insert({
                id: notification.id,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                urgency: notification.urgency,
                user_id: notification.userId,
                metadata: notification.metadata,
                read: false,
            });
        } catch (error) {
            console.warn('[NotificationService] Could not store notification:', error);
        }
    }

    private async sendEmailNotification(notification: Notification): Promise<void> {
        // TODO: Integrate with Resend or Supabase email
        console.log('[NotificationService] Email notification queued:', notification.title);
    }

    private async triggerWebhook(notification: Notification): Promise<void> {
        if (!this.webhookUrl) {
            console.log('[NotificationService] No webhook URL configured');
            return;
        }

        try {
            await fetch(this.webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(notification),
            });
        } catch (error) {
            console.error('[NotificationService] Webhook failed:', error);
        }
    }

    private setupEventListeners(): void {
        // Listen for events that should trigger notifications
        eventBus.on(EventTypes.ANOMALY_DETECTED, async (event) => {
            const payload = event.payload as Record<string, unknown>;
            if (payload.severity === 'high' || payload.severity === 'critical') {
                await this.notifyAnomaly({
                    datasetId: payload.datasetId as string,
                    description: payload.description as string || 'Anomaly detected in dataset',
                    severity: payload.severity as NotificationUrgency,
                });
            }
        });

        eventBus.on(EventTypes.EXPERIMENT_COMPLETED, async (event) => {
            const payload = event.payload as Record<string, unknown>;
            await this.notifyExperimentComplete({
                experimentId: payload.experimentId as string,
                experimentName: payload.title as string || 'Experiment',
                status: 'completed',
            });
        });

        eventBus.on(EventTypes.MODEL_TRAINING_COMPLETED, async (event) => {
            const payload = event.payload as Record<string, unknown>;
            await this.notifyModelTraining({
                modelId: payload.modelId as string,
                modelName: payload.modelName as string,
                status: 'completed',
                metrics: payload.metrics as Record<string, number>,
            });
        });
    }

    private mapToNotification(data: Record<string, unknown>): Notification {
        return {
            id: data.id as string,
            type: data.type as string,
            title: data.title as string,
            message: data.message as string,
            urgency: (data.urgency as NotificationUrgency) || 'medium',
            channel: 'in_app',
            userId: data.user_id as string,
            metadata: data.metadata as Record<string, unknown>,
            read: !!data.read,
            createdAt: data.created_at as string,
        };
    }
}

// Singleton export
export const notificationService = new NotificationService();
