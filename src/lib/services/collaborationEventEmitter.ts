/**
 * Collaboration Event Integration
 * 
 * Per Blueprint Phase 6: Collaboration Enhancement
 * Connects collaboration features to the EventBus for automation triggers
 */

import { eventBus, EventTypes } from '@/lib/events';
import { supabase } from '@/integrations/supabase/client';

// =============================================================================
// EVENT TYPES FOR COLLABORATION
// =============================================================================

// These would be added to eventTypes.ts if not already present
const CollaborationEventTypes = {
    MESSAGE_CREATED: 'COLLABORATION.MESSAGE_CREATED',
    MESSAGE_UPDATED: 'COLLABORATION.MESSAGE_UPDATED',
    MESSAGE_DELETED: 'COLLABORATION.MESSAGE_DELETED',
    CHANNEL_CREATED: 'COLLABORATION.CHANNEL_CREATED',
    MEMBER_JOINED: 'COLLABORATION.MEMBER_JOINED',
    MEMBER_LEFT: 'COLLABORATION.MEMBER_LEFT',
    TASK_CREATED: 'COLLABORATION.TASK_CREATED',
    TASK_COMPLETED: 'COLLABORATION.TASK_COMPLETED',
    FILE_SHARED: 'COLLABORATION.FILE_SHARED',
    MENTION_DETECTED: 'COLLABORATION.MENTION_DETECTED',
} as const;

// =============================================================================
// COLLABORATION EVENT EMITTER
// =============================================================================

export class CollaborationEventEmitter {
    private userId: string | null = null;
    private labId: string | null = null;

    constructor() {
        this.initialize();
    }

    private async initialize(): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        this.userId = user?.id || null;
    }

    /**
     * Set the current lab context
     */
    setLabContext(labId: string): void {
        this.labId = labId;
    }

    // =========================================================================
    // MESSAGE EVENTS
    // =========================================================================

    /**
     * Emit when a message is created
     */
    emitMessageCreated(params: {
        messageId: string;
        channelId: string;
        content: string;
        authorName?: string;
        mentions?: string[];
    }): void {
        eventBus.emit(CollaborationEventTypes.MESSAGE_CREATED, {
            ...params,
            authorId: this.userId,
            labId: this.labId,
            timestamp: new Date().toISOString(),
        }, {
            source: 'collaborationService',
            userId: this.userId || undefined,
        });

        // Check for @LabAI mentions
        if (params.content.toLowerCase().includes('@labai')) {
            this.emitMentionDetected({
                messageId: params.messageId,
                channelId: params.channelId,
                content: params.content,
                mentionedUser: 'labai',
            });
        }
    }

    /**
     * Emit when a message is updated
     */
    emitMessageUpdated(params: {
        messageId: string;
        channelId: string;
        newContent: string;
    }): void {
        eventBus.emit(CollaborationEventTypes.MESSAGE_UPDATED, {
            ...params,
            authorId: this.userId,
            labId: this.labId,
            timestamp: new Date().toISOString(),
        }, {
            source: 'collaborationService',
            userId: this.userId || undefined,
        });
    }

    // =========================================================================
    // CHANNEL EVENTS
    // =========================================================================

    /**
     * Emit when a channel is created
     */
    emitChannelCreated(params: {
        channelId: string;
        channelName: string;
        channelType: 'general' | 'project' | 'experiment' | 'direct';
        linkedResourceId?: string;
        linkedResourceType?: string;
    }): void {
        eventBus.emit(CollaborationEventTypes.CHANNEL_CREATED, {
            ...params,
            createdBy: this.userId,
            labId: this.labId,
            timestamp: new Date().toISOString(),
        }, {
            source: 'collaborationService',
            userId: this.userId || undefined,
        });
    }

    // =========================================================================
    // MEMBER EVENTS
    // =========================================================================

    /**
     * Emit when a member joins
     */
    emitMemberJoined(params: {
        memberId: string;
        memberName: string;
        role: string;
    }): void {
        eventBus.emit(CollaborationEventTypes.MEMBER_JOINED, {
            ...params,
            labId: this.labId,
            invitedBy: this.userId,
            timestamp: new Date().toISOString(),
        }, {
            source: 'collaborationService',
            userId: this.userId || undefined,
        });
    }

    /**
     * Emit when a member leaves
     */
    emitMemberLeft(params: {
        memberId: string;
        memberName: string;
        reason?: 'left' | 'removed';
    }): void {
        eventBus.emit(CollaborationEventTypes.MEMBER_LEFT, {
            ...params,
            labId: this.labId,
            timestamp: new Date().toISOString(),
        }, {
            source: 'collaborationService',
            userId: this.userId || undefined,
        });
    }

    // =========================================================================
    // TASK EVENTS
    // =========================================================================

    /**
     * Emit when a task is created
     */
    emitTaskCreated(params: {
        taskId: string;
        title: string;
        description?: string;
        assigneeId?: string;
        priority: 'low' | 'medium' | 'high' | 'critical';
        linkedEventId?: string;
    }): void {
        eventBus.emit(CollaborationEventTypes.TASK_CREATED, {
            ...params,
            createdBy: this.userId,
            labId: this.labId,
            timestamp: new Date().toISOString(),
        }, {
            source: 'collaborationService',
            userId: this.userId || undefined,
        });
    }

    /**
     * Emit when a task is completed
     */
    emitTaskCompleted(params: {
        taskId: string;
        title: string;
        completedBy: string;
    }): void {
        eventBus.emit(CollaborationEventTypes.TASK_COMPLETED, {
            ...params,
            labId: this.labId,
            timestamp: new Date().toISOString(),
        }, {
            source: 'collaborationService',
            userId: this.userId || undefined,
        });
    }

    // =========================================================================
    // FILE EVENTS
    // =========================================================================

    /**
     * Emit when a file is shared
     */
    emitFileShared(params: {
        fileId: string;
        fileName: string;
        fileType: string;
        channelId?: string;
        sharedWith?: string[];
    }): void {
        eventBus.emit(CollaborationEventTypes.FILE_SHARED, {
            ...params,
            sharedBy: this.userId,
            labId: this.labId,
            timestamp: new Date().toISOString(),
        }, {
            source: 'collaborationService',
            userId: this.userId || undefined,
        });
    }

    // =========================================================================
    // MENTION EVENTS
    // =========================================================================

    /**
     * Emit when an @mention is detected
     */
    emitMentionDetected(params: {
        messageId: string;
        channelId: string;
        content: string;
        mentionedUser: string;
    }): void {
        eventBus.emit(CollaborationEventTypes.MENTION_DETECTED, {
            ...params,
            authorId: this.userId,
            labId: this.labId,
            timestamp: new Date().toISOString(),
        }, {
            source: 'collaborationService',
            userId: this.userId || undefined,
        });
    }
}

// Singleton export
export const collaborationEventEmitter = new CollaborationEventEmitter();

// =============================================================================
// HELPER TO INTEGRATE WITH EXISTING COLLABORATION SERVICE
// =============================================================================

/**
 * Hook to add event emission to existing collaboration functions
 * Call this after any collaboration operation
 */
export function emitCollaborationEvent(
    eventType: keyof typeof CollaborationEventTypes,
    params: Record<string, unknown>
): void {
    const emitter = collaborationEventEmitter;

    switch (eventType) {
        case 'MESSAGE_CREATED':
            emitter.emitMessageCreated(params as Parameters<typeof emitter.emitMessageCreated>[0]);
            break;
        case 'CHANNEL_CREATED':
            emitter.emitChannelCreated(params as Parameters<typeof emitter.emitChannelCreated>[0]);
            break;
        case 'MEMBER_JOINED':
            emitter.emitMemberJoined(params as Parameters<typeof emitter.emitMemberJoined>[0]);
            break;
        case 'TASK_CREATED':
            emitter.emitTaskCreated(params as Parameters<typeof emitter.emitTaskCreated>[0]);
            break;
        case 'TASK_COMPLETED':
            emitter.emitTaskCompleted(params as Parameters<typeof emitter.emitTaskCompleted>[0]);
            break;
        case 'FILE_SHARED':
            emitter.emitFileShared(params as Parameters<typeof emitter.emitFileShared>[0]);
            break;
        default:
            console.warn(`[CollaborationEvents] Unknown event type: ${eventType}`);
    }
}
