import { supabase } from '@/integrations/supabase/client';

export interface NotificationPayload {
    user_id: string;
    type: 'info' | 'warning' | 'error' | 'success';
    title: string;
    message: string;
    action_url?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    category?: string;
}

export interface NotificationPreferences {
    email_enabled: boolean;
    slack_enabled: boolean;
    email_on_action_assignment: boolean;
    email_on_bottleneck_detection: boolean;
    email_on_experiment_complete: boolean;
    email_on_data_quality_issues: boolean;
    email_on_system_health: boolean;
    slack_webhook_url?: string;
    snooze_until?: string;
}

export class EnhancedNotificationService {
    private static instance: EnhancedNotificationService;

    public static getInstance(): EnhancedNotificationService {
        if (!EnhancedNotificationService.instance) {
            EnhancedNotificationService.instance = new EnhancedNotificationService();
        }
        return EnhancedNotificationService.instance;
    }

    /**
     * Send notification with email and Slack integration
     */
    async send(payload: NotificationPayload): Promise<void> {
        try {
            // 1. Create in-app notification
            const notificationId = await this.createNotification(payload);

            // 2. Check user preferences
            const preferences = await this.getUserPreferences(payload.user_id);

            // 3. Check if snoozed
            if (preferences?.snooze_until) {
                const snoozeUntil = new Date(preferences.snooze_until);
                if (snoozeUntil > new Date()) {
                    console.log('Notifications snoozed until:', snoozeUntil);
                    return;
                }
            }

            // 4. Send email if enabled
            if (preferences?.email_enabled && this.shouldSendEmail(payload.category, preferences)) {
                await this.sendEmail(payload);
            }

            // 5. Send Slack if enabled
            if (preferences?.slack_enabled && preferences?.slack_webhook_url) {
                await this.sendSlack(payload, preferences.slack_webhook_url);
            }

        } catch (error) {
            console.error('Error sending notification:', error);
        }
    }

    /**
     * Create notification in database
     */
    private async createNotification(payload: NotificationPayload): Promise<string> {
        const { data, error } = await supabase
            .from('notifications')
            .insert({
                user_id: payload.user_id,
                type: payload.type,
                title: payload.title,
                message: payload.message,
                action_url: payload.action_url,
                priority: payload.priority || 'medium',
                category: payload.category || 'general',
                read: false
            })
            .select('id')
            .single();

        if (error) throw error;
        return data.id;
    }

    /**
     * Get user notification preferences
     */
    private async getUserPreferences(userId: string): Promise<NotificationPreferences | null> {
        const { data } = await supabase
            .from('notification_preferences')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        return data;
    }

    /**
     * Check if email should be sent based on category
     */
    private shouldSendEmail(category: string | undefined, prefs: NotificationPreferences): boolean {
        if (!category) return false;

        switch (category) {
            case 'system_health':
                return prefs.email_on_system_health ?? true;
            case 'action_assignment':
                return prefs.email_on_action_assignment ?? true;
            case 'bottleneck':
                return prefs.email_on_bottleneck_detection ?? true;
            case 'experiment':
                return prefs.email_on_experiment_complete ?? true;
            case 'data_quality':
                return prefs.email_on_data_quality_issues ?? true;
            default:
                return true;
        }
    }

    /**
     * Send email using Resend (via Supabase Edge Function)
     */
    private async sendEmail(payload: NotificationPayload): Promise<void> {
        try {
            // Get user email
            const { data: userData } = await supabase.auth.getUser();
            if (!userData?.user?.email) return;

            // Call Resend API via Supabase Edge Function
            const { data, error } = await supabase.functions.invoke('send-notification-email', {
                body: {
                    to: userData.user.email,
                    subject: `[LabIQ] ${payload.title}`,
                    html: this.generateEmailHTML(payload),
                    text: payload.message
                }
            });

            if (error) {
                console.error('Email send error:', error);
            }
        } catch (error) {
            console.error('Failed to send email:', error);
        }
    }

    /**
     * Generate HTML email template
     */
    private generateEmailHTML(payload: NotificationPayload): string {
        const priorityColor = {
            low: '#10b981',
            medium: '#f59e0b',
            high: '#ef4444',
            critical: '#dc2626'
        }[payload.priority || 'medium'];

        return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6; padding: 20px; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">LabIQ Health</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 5px 0 0 0; font-size: 14px;">Lab Intelligence Platform</p>
          </div>
          
          <!-- Priority Badge -->
          <div style="padding: 20px 30px; border-bottom: 1px solid #e5e7eb;">
            <span style="display: inline-block; background-color: ${priorityColor}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
              ${payload.priority || 'medium'} priority
            </span>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px;">
            <h2 style="color: #111827; margin: 0 0 15px 0; font-size: 20px;">${payload.title}</h2>
            <p style="color: #6b7280; line-height: 1.6; margin: 0;">${payload.message}</p>
            
            ${payload.action_url ? `
              <div style="margin-top: 30px;">
                <a href="${process.env.VITE_APP_URL || 'http://localhost:8080'}${payload.action_url}" 
                   style="display: inline-block; background-color: #667eea; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  Take Action
                </a>
              </div>
            ` : ''}
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 20px 30px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              You're receiving this because you have email notifications enabled.
              <a href="${process.env.VITE_APP_URL || 'http://localhost:8080'}/notifications" style="color: #667eea; text-decoration: none;">Manage preferences</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
    }

    /**
     * Send Slack notification
     */
    private async sendSlack(payload: NotificationPayload, webhookUrl: string): Promise<void> {
        try {
            const slackPayload = {
                text: `*${payload.title}*`,
                blocks: [
                    {
                        type: 'header',
                        text: {
                            type: 'plain_text',
                            text: payload.title,
                            emoji: true
                        }
                    },
                    {
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: payload.message
                        }
                    },
                    {
                        type: 'context',
                        elements: [
                            {
                                type: 'mrkdwn',
                                text: `*Priority:* ${payload.priority || 'medium'} | *Category:* ${payload.category || 'general'}`
                            }
                        ]
                    }
                ]
            };

            if (payload.action_url) {
                slackPayload.blocks.push({
                    type: 'actions',
                    elements: [
                        {
                            type: 'button',
                            text: {
                                type: 'plain_text',
                                text: 'View in LabIQ',
                                emoji: true
                            },
                            url: `${process.env.VITE_APP_URL || 'http://localhost:8080'}${payload.action_url}`,
                            style: 'primary'
                        }
                    ]
                } as any);
            }

            await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(slackPayload)
            });

        } catch (error) {
            console.error('Failed to send Slack notification:', error);
        }
    }

    /**
     * Mark all notifications as read
     */
    async markAllAsRead(userId: string): Promise<void> {
        await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', userId)
            .eq('read', false);
    }

    /**
     * Snooze notifications for X hours
     */
    async snoozeNotifications(userId: string, hours: number): Promise<void> {
        const snoozeUntil = new Date();
        snoozeUntil.setHours(snoozeUntil.getHours() + hours);

        await supabase
            .from('notification_preferences')
            .upsert({
                user_id: userId,
                snooze_until: snoozeUntil.toISOString()
            });
    }

    /**
     * Un-snooze notifications
     */
    async unsnoozeNotifications(userId: string): Promise<void> {
        await supabase
            .from('notification_preferences')
            .update({ snooze_until: null })
            .eq('user_id', userId);
    }
}

export const enhancedNotificationService = EnhancedNotificationService.getInstance();
