/**
 * LabAI Mention Handler - Collaboration AI Integration
 * 
 * Per Blueprint Phase 6: Collaboration Enhancement
 * Handles @LabAI mentions in comments and triggers AI responses
 */

import { eventBus, EventTypes } from '@/lib/events';
import { supabase } from '@/integrations/supabase/client';

// =============================================================================
// TYPES
// =============================================================================

export interface MentionContext {
    messageId: string;
    channelId?: string;
    content: string;
    mentionedUser: string;
    authorId: string;
    authorName?: string;
    timestamp: string;
    resourceId?: string;
    resourceType?: 'dataset' | 'experiment' | 'model' | 'report';
}

export interface LabAIMentionResponse {
    success: boolean;
    response?: string;
    mode: 'analyst' | 'ml' | 'learn';
    confidence?: number;
    suggestions?: string[];
}

// =============================================================================
// MENTION PATTERNS
// =============================================================================

const LABAI_MENTION_PATTERN = /@labai|@lab-ai|@lab_ai|@ai/gi;

const QUERY_PATTERNS = {
    // Data analysis queries
    analysis: /analyze|summarize|describe|explain|what (is|are|does)/i,
    // ML-related queries
    ml: /model|train|predict|accuracy|performance|regression|classification/i,
    // Learning queries
    learn: /teach|learn|understand|meaning|definition|concept|why/i,
    // Comparison queries
    compare: /compare|difference|vs|versus|better/i,
    // Recommendation queries
    recommend: /recommend|suggest|should|what (to|should)/i,
};

// =============================================================================
// MENTION HANDLER CLASS
// =============================================================================

export class LabAIMentionHandler {
    private userId: string | null = null;

    constructor() {
        this.initialize();
    }

    private async initialize(): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        this.userId = user?.id || null;

        // Subscribe to collaboration events
        this.setupEventListeners();
    }

    // =========================================================================
    // MENTION DETECTION
    // =========================================================================

    /**
     * Check if a message contains @LabAI mention
     */
    containsLabAIMention(content: string): boolean {
        return LABAI_MENTION_PATTERN.test(content);
    }

    /**
     * Extract the query from a message with @LabAI mention
     */
    extractQuery(content: string): string {
        // Remove the mention and clean up
        return content
            .replace(LABAI_MENTION_PATTERN, '')
            .replace(/^\s*,?\s*/, '')
            .trim();
    }

    /**
     * Detect the mode based on query content
     */
    detectMode(query: string): 'analyst' | 'ml' | 'learn' {
        if (QUERY_PATTERNS.ml.test(query)) return 'ml';
        if (QUERY_PATTERNS.learn.test(query)) return 'learn';
        return 'analyst';
    }

    // =========================================================================
    // MENTION PROCESSING
    // =========================================================================

    /**
     * Process an @LabAI mention
     */
    async processMention(context: MentionContext): Promise<LabAIMentionResponse> {
        const query = this.extractQuery(context.content);
        const mode = this.detectMode(query);

        console.log('[LabAIMention] Processing mention:', {
            mode,
            query: query.substring(0, 50) + '...',
            resourceType: context.resourceType,
        });

        // Emit event for AI processing
        eventBus.emit(EventTypes.AI_INSIGHT_GENERATED, {
            type: 'mention_response',
            query,
            mode,
            contextId: context.messageId,
            resourceId: context.resourceId,
            resourceType: context.resourceType,
        }, {
            source: 'labaiMentionHandler',
            userId: this.userId || undefined,
        });

        try {
            // Get AI response (this would call the actual AI service)
            const response = await this.getAIResponse(query, mode, context);

            // Post response as a reply
            await this.postResponse(context, response);

            return {
                success: true,
                response: response.content,
                mode,
                confidence: response.confidence,
                suggestions: response.suggestions,
            };
        } catch (error) {
            console.error('[LabAIMention] Error processing mention:', error);
            return {
                success: false,
                mode,
            };
        }
    }

    /**
     * Get AI response for query
     */
    private async getAIResponse(
        query: string,
        mode: 'analyst' | 'ml' | 'learn',
        context: MentionContext
    ): Promise<{
        content: string;
        confidence: number;
        suggestions?: string[];
    }> {
        // Import labAIService dynamically to avoid circular dependencies
        try {
            const { default: labAIService } = await import('@/lib/services/labAIService');

            // Build context for the query
            const aiContext = {
                resourceType: context.resourceType,
                resourceId: context.resourceId,
                query,
            };

            // Get response using the process method
            const response = await labAIService.process({
                datasetId: context.resourceId || '',
                query,
                mode: mode as 'analyst' | 'ml' | 'learn',
            });

            return {
                content: response.content || this.getDefaultResponse(mode, query),
                confidence: 0.7,
            };
        } catch (error) {
            console.warn('[LabAIMention] AI service error, using fallback:', error);
            return {
                content: this.getDefaultResponse(mode, query),
                confidence: 0.5,
            };
        }
    }

    /**
     * Get default response when AI is unavailable
     */
    private getDefaultResponse(mode: string, query: string): string {
        const responses: Record<string, string> = {
            analyst: `I'm analyzing your query: "${query.substring(0, 50)}...". The AI service is currently processing. You'll receive insights shortly.`,
            ml: `Looking at the ML aspects of your question. Model analysis is being prepared.`,
            learn: `Great question! I'm preparing educational content about this topic.`,
        };
        return responses[mode] || responses.analyst;
    }

    /**
     * Post AI response to the channel
     */
    private async postResponse(
        context: MentionContext,
        response: { content: string; suggestions?: string[] }
    ): Promise<void> {
        if (!context.channelId) return;

        // Build response message
        let message = `🤖 **LabAI Response**\n\n${response.content}`;

        if (response.suggestions && response.suggestions.length > 0) {
            message += '\n\n**Suggestions:**\n';
            response.suggestions.forEach((s, i) => {
                message += `${i + 1}. ${s}\n`;
            });
        }

        // Post to channel (this would use the collaboration service)
        try {
            // Emit event for the response
            eventBus.emit(EventTypes.AI_INSIGHT_GENERATED, {
                type: 'mention_response_posted',
                channelId: context.channelId,
                originalMessageId: context.messageId,
                responseContent: message,
            }, {
                source: 'labaiMentionHandler',
            });

            console.log('[LabAIMention] Response posted to channel:', context.channelId);
        } catch (error) {
            console.error('[LabAIMention] Failed to post response:', error);
        }
    }

    // =========================================================================
    // EVENT LISTENERS
    // =========================================================================

    private setupEventListeners(): void {
        // Listen for new messages that might contain mentions
        // Note: MESSAGE_CREATED should be added to EventTypes if not present
        eventBus.on(EventTypes.AI_INSIGHT_GENERATED, async (event) => {
            // This is a placeholder - in production, listen for actual message events
            // from the collaboration service
            const payload = event.payload as Record<string, unknown>;
            const content = payload.content as string;

            if (content && this.containsLabAIMention(content)) {
                await this.processMention({
                    messageId: payload.messageId as string,
                    channelId: payload.channelId as string,
                    content,
                    mentionedUser: 'labai',
                    authorId: payload.authorId as string,
                    authorName: payload.authorName as string,
                    timestamp: new Date().toISOString(),
                    resourceId: payload.resourceId as string,
                    resourceType: payload.resourceType as MentionContext['resourceType'],
                });
            }
        });
    }
}

// Singleton export
export const labAIMentionHandler = new LabAIMentionHandler();

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Process a message for @LabAI mentions
 * Convenience function for use in components
 */
export async function processLabAIMention(
    content: string,
    context: Omit<MentionContext, 'content' | 'mentionedUser'>
): Promise<LabAIMentionResponse | null> {
    if (!labAIMentionHandler.containsLabAIMention(content)) {
        return null;
    }

    return labAIMentionHandler.processMention({
        ...context,
        content,
        mentionedUser: 'labai',
    });
}
