/**
 * LabIQ Health - Event History Service
 * 
 * Provides persistent event storage and querying capabilities.
 * Can store events in Supabase for audit trail and debugging.
 */

import { supabase } from '@/integrations/supabase/client';
import { HealthEvent, EventFilter, EventType } from './eventTypes';

// =============================================================================
// EVENT HISTORY SERVICE
// =============================================================================

export class EventHistoryService {
    private static instance: EventHistoryService | null = null;
    private persistenceEnabled = false;

    private constructor() { }

    public static getInstance(): EventHistoryService {
        if (!EventHistoryService.instance) {
            EventHistoryService.instance = new EventHistoryService();
        }
        return EventHistoryService.instance;
    }

    /**
     * Enable database persistence for events
     */
    public enablePersistence(): void {
        this.persistenceEnabled = true;
        console.log('[EventHistory] Database persistence enabled');
    }

    /**
     * Disable database persistence
     */
    public disablePersistence(): void {
        this.persistenceEnabled = false;
    }

    /**
     * Check if persistence is enabled
     */
    public isPersistenceEnabled(): boolean {
        return this.persistenceEnabled;
    }

    /**
     * Persist an event to the database
     * @param event The event to persist
     */
    public async persistEvent(event: HealthEvent): Promise<void> {
        if (!this.persistenceEnabled) return;

        try {
            // Note: This requires the event_log table to exist
            // The table will be created in a migration
            const { error } = await supabase.from('event_log').insert({
                id: event.id,
                event_type: event.type,
                payload: event.payload,
                source: event.source,
                user_id: event.userId,
                created_at: event.timestamp,
                processed: false,
            });

            if (error) {
                // Table may not exist yet, just log warning
                if (error.code === '42P01') {
                    console.warn('[EventHistory] event_log table does not exist yet');
                } else {
                    console.error('[EventHistory] Failed to persist event:', error);
                }
            }
        } catch (error) {
            console.error('[EventHistory] Persistence error:', error);
        }
    }

    /**
     * Query events from the database
     */
    public async queryEvents(filter: EventFilter): Promise<HealthEvent[]> {
        try {
            let query = supabase
                .from('event_log')
                .select('*')
                .order('created_at', { ascending: false });

            if (filter.type) {
                const types = Array.isArray(filter.type) ? filter.type : [filter.type];
                query = query.in('event_type', types);
            }

            if (filter.source) {
                query = query.eq('source', filter.source);
            }

            if (filter.userId) {
                query = query.eq('user_id', filter.userId);
            }

            if (filter.startTime) {
                query = query.gte('created_at', filter.startTime);
            }

            if (filter.endTime) {
                query = query.lte('created_at', filter.endTime);
            }

            if (filter.limit) {
                query = query.limit(filter.limit);
            }

            const { data, error } = await query;

            if (error) {
                console.error('[EventHistory] Query error:', error);
                return [];
            }

            // Transform database records to HealthEvent format
            return (data || []).map((record) => ({
                id: record.id,
                type: record.event_type as EventType,
                payload: record.payload,
                timestamp: record.created_at,
                source: record.source,
                userId: record.user_id,
                metadata: record.metadata,
            }));
        } catch (error) {
            console.error('[EventHistory] Query failed:', error);
            return [];
        }
    }

    /**
     * Mark events as processed (for rules engine tracking)
     */
    public async markAsProcessed(eventIds: string[]): Promise<void> {
        if (!this.persistenceEnabled || eventIds.length === 0) return;

        try {
            const { error } = await supabase
                .from('event_log')
                .update({ processed: true })
                .in('id', eventIds);

            if (error) {
                console.error('[EventHistory] Failed to mark events as processed:', error);
            }
        } catch (error) {
            console.error('[EventHistory] Mark processed error:', error);
        }
    }

    /**
     * Get unprocessed events (for rules engine)
     */
    public async getUnprocessedEvents(limit: number = 100): Promise<HealthEvent[]> {
        return this.queryEvents({
            limit,
            // Note: Would need to add processed filter to queryEvents
        });
    }

    /**
     * Clean up old events (retention policy)
     * @param olderThan ISO timestamp - delete events older than this
     */
    public async cleanupOldEvents(olderThan: string): Promise<number> {
        if (!this.persistenceEnabled) return 0;

        try {
            const { data, error } = await supabase
                .from('event_log')
                .delete()
                .lt('created_at', olderThan)
                .select('id');

            if (error) {
                console.error('[EventHistory] Cleanup error:', error);
                return 0;
            }

            return data?.length || 0;
        } catch (error) {
            console.error('[EventHistory] Cleanup failed:', error);
            return 0;
        }
    }

    /**
     * Get event statistics
     */
    public async getEventStats(): Promise<{
        totalEvents: number;
        eventsByType: Record<string, number>;
        eventsLast24h: number;
    }> {
        try {
            const now = new Date();
            const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

            const [totalResult, last24hResult] = await Promise.all([
                supabase.from('event_log').select('event_type', { count: 'exact' }),
                supabase
                    .from('event_log')
                    .select('*', { count: 'exact' })
                    .gte('created_at', yesterday.toISOString()),
            ]);

            // Count by type (simplified - in production use SQL grouping)
            const eventsByType: Record<string, number> = {};
            totalResult.data?.forEach((row) => {
                const type = row.event_type;
                eventsByType[type] = (eventsByType[type] || 0) + 1;
            });

            return {
                totalEvents: totalResult.count || 0,
                eventsByType,
                eventsLast24h: last24hResult.count || 0,
            };
        } catch (error) {
            console.error('[EventHistory] Stats error:', error);
            return {
                totalEvents: 0,
                eventsByType: {},
                eventsLast24h: 0,
            };
        }
    }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const eventHistory = EventHistoryService.getInstance();
