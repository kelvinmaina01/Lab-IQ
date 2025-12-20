import { ChatMessage } from "@/core/interfaces";

export interface IAIService {
    generateChatSummary(messages: ChatMessage[]): Promise<string>;
    suggestChannelTags(channelName: string, description: string): Promise<string[]>;
    generateSmartReply(message: ChatMessage, context: ChatMessage[]): Promise<string>;
}

export class AICollaborationService implements IAIService {
    private groqApiKey: string;
    private geminiApiKey: string;
    private useGroq: boolean;

    constructor() {
        this.groqApiKey = import.meta.env.VITE_GROQ_API_KEY || '';
        this.geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
        // Prefer Groq for better performance and free tier
        this.useGroq = !!this.groqApiKey;
    }

    /**
     * Generate AI response for @LabAI mentions
     * Uses Groq (preferred) or Gemini as fallback
     */
    async generateLabAIResponse(question: string, channelContext: ChatMessage[]): Promise<string> {
        if (this.useGroq && this.groqApiKey) {
            return this.generateGroqResponse(question, channelContext);
        } else if (this.geminiApiKey) {
            return this.generateGeminiResponse(question, channelContext);
        }
        return "I'm currently unavailable. Please configure an AI API key.";
    }

    private async generateGroqResponse(question: string, context: ChatMessage[]): Promise<string> {
        try {
            const contextText = context
                .slice(-10)
                .map(m => `${m.user?.display_name}: ${m.content}`)
                .join('\n');

            const systemPrompt = `You are LabAI, an expert scientific research assistant integrated into Lab IQ collaboration platform.
You help researchers with:
- Data analysis and statistical insights
- Experimental design and hypothesis generation
- Protocol recommendations
- Result interpretation
- Report generation
- Research best practices

Respond concisely but scientifically accurate. Use markdown formatting.`;

            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.groqApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'mixtral-8x7b-32768', // or 'llama3-70b-8192'
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: `Channel context:\n${contextText}\n\nQuestion: ${question}` }
                    ],
                    temperature: 0.7,
                    max_tokens: 500
                })
            });

            if (!response.ok) {
                console.error('Groq API error:', await response.text());
                return "I encountered an error processing your request. Please try again.";
            }

            const data = await response.json();
            return data.choices[0]?.message?.content || "No response generated.";
        } catch (error) {
            console.error('Groq API failed:', error);
            // Fallback to Gemini if Groq fails
            if (this.geminiApiKey) {
                return this.generateGeminiResponse(question, context);
            }
            return "Error processing request.";
        }
    }

    private async generateGeminiResponse(question: string, context: ChatMessage[]): Promise<string> {
        try {
            const contextText = context
                .slice(-10)
                .map(m => `${m.user?.display_name}: ${m.content}`)
                .join('\n');

            const prompt = `You are LabAI, a scientific research assistant.
Context from channel:
${contextText}

Question: ${question}

Provide a concise, scientifically accurate response. Use markdown formatting.`;

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.geminiApiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            maxOutputTokens: 500,
                            temperature: 0.7
                        }
                    })
                }
            );

            const data = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
        } catch (error) {
            console.error('Gemini API failed:', error);
            return "Error processing request.";
        }
    }

    async generateChatSummary(messages: ChatMessage[]): Promise<string> {
        if (!this.apiKey || messages.length === 0) return '';

        try {
            const messageText = messages
                .slice(-20)
                .map(m => `${m.user?.display_name}: ${m.content}`)
                .join('\n');

            const prompt = `Summarize this chat conversation in 2-3 bullet points. Focus on key decisions, action items, and important findings:\n\n${messageText}`;

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            maxOutputTokens: 200,
                            temperature: 0.3,
                        },
                    }),
                }
            );

            const data = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        } catch (error) {
            console.error('AI summary generation failed:', error);
            return '';
        }
    }

    async suggestChannelTags(channelName: string, description: string): Promise<string[]> {
        if (!this.apiKey) return [];

        try {
            const prompt = `Given a lab collaboration channel named "${channelName}" with description: "${description}", suggest 3-5 relevant tags/keywords (lowercase, single words). Respond with comma-separated tags only.`;

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            maxOutputTokens: 50,
                            temperature: 0.5,
                        },
                    }),
                }
            );

            const data = await response.json();
            const tagsText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            return tagsText
                .split(',')
                .map(t => t.trim().toLowerCase())
                .filter(t => t.length > 0)
                .slice(0, 5);
        } catch (error) {
            console.error('AI tag suggestion failed:', error);
            return [];
        }
    }

    async generateSmartReply(message: ChatMessage, context: ChatMessage[]): Promise<string> {
        if (!this.apiKey) return '';

        try {
            const contextText = context
                .slice(-5)
                .map(m => `${m.user?.display_name}: ${m.content}`)
                .join('\n');

            const prompt = `As a lab assistant, suggest a helpful reply to this message in a scientific collaboration context. Keep it brief (1-2 sentences).
Context:
${contextText}
Latest message:
${message.user?.display_name}: ${message.content}`;

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            maxOutputTokens: 100,
                            temperature: 0.7,
                        },
                    }),
                }
            );

            const data = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
        } catch (error) {
            console.error('AI smart reply failed:', error);
            return '';
        }
    }
}
