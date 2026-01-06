import { supabase } from '@/integrations/supabase/client';

/**
 * Utility to trigger LabAI bot response when @LabAI is mentioned
 */
export async function triggerLabAI(params: {
    message: string;
    channelId: string;
    userId?: string;
    history?: any[];
}) {
    try {
        console.log('[LabAI] Triggering bot for message:', params.message.substring(0, 50) + '...');

        const { data, error } = await supabase.functions.invoke('chat-bot-ai', {
            body: {
                message: params.message,
                channelId: params.channelId,
                userId: params.userId,
                history: params.history || []
            }
        });

        if (error) {
            console.error('[LabAI] Bot error:', error);
            return { success: false, error };
        }

        console.log('[LabAI] ✅ Bot triggered successfully');
        return { success: true, data };
    } catch (err) {
        console.error('[LabAI] Exception:', err);
        return { success: false, error: err };
    }
}

/**
 * Check if message mentions @LabAI
 */
export function mentionsLabAI(message: string): boolean {
    return message.toLowerCase().includes('@labai');
}

/**
 * Auto-trigger bot if message contains @LabAI mention
 */
export async function autoTriggerBot(message: string, channelId: string, userId?: string) {
    if (mentionsLabAI(message)) {
        // Trigger bot asynchronously without blocking
        triggerLabAI({ message, channelId, userId }).catch(err => {
            console.error('[LabAI] Auto-trigger failed:', err);
        });
    }
}
