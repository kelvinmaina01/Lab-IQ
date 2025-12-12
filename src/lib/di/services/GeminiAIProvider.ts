/**
 * Gemini AI Provider Implementation
 * Abstracted AI service for Google's Gemini API
 */

import { IAIProvider, AIGenerationOptions, ILogger } from '../types';

export class GeminiAIProvider implements IAIProvider {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
  private defaultModel = 'gemini-pro';
  private logger: ILogger;

  constructor(apiKey: string, logger: ILogger) {
    this.apiKey = apiKey;
    this.logger = logger;

    if (!this.apiKey) {
      this.logger.warn('Gemini API key not configured - AI features will be limited');
    }
  }

  /**
   * Generate text content
   */
  async generateContent(prompt: string, options: AIGenerationOptions = {}): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const model = options.model || this.defaultModel;
    const url = `${this.baseUrl}/${model}:generateContent?key=${this.apiKey}`;

    try {
      this.logger.debug('Generating AI content', { model, promptLength: prompt.length });

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: options.temperature ?? 0.7,
            maxOutputTokens: options.maxTokens ?? 2048,
            stopSequences: options.stopSequences,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error('Gemini API error', new Error(errorText));
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      this.logger.debug('AI content generated', { responseLength: text.length });

      return text;
    } catch (error) {
      this.logger.error('Failed to generate AI content', error as Error);
      throw error;
    }
  }

  /**
   * Generate and parse JSON content
   */
  async generateJSON<T>(prompt: string, options: AIGenerationOptions = {}): Promise<T> {
    const jsonPrompt = `${prompt}\n\nIMPORTANT: Return ONLY valid JSON. No markdown, no code blocks, no explanation.`;

    const response = await this.generateContent(jsonPrompt, {
      ...options,
      temperature: options.temperature ?? 0.3, // Lower temperature for JSON
    });

    try {
      return JSON.parse(this.cleanJSONResponse(response));
    } catch (error) {
      this.logger.error('Failed to parse AI JSON response', error as Error, { response });
      throw new Error('AI returned invalid JSON');
    }
  }

  /**
   * Stream content generation
   */
  async *streamContent(prompt: string, options: AIGenerationOptions = {}): AsyncIterable<string> {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const model = options.model || this.defaultModel;
    const url = `${this.baseUrl}/${model}:streamGenerateContent?key=${this.apiKey}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: options.temperature ?? 0.7,
            maxOutputTokens: options.maxTokens ?? 2048,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete JSON objects
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const json = JSON.parse(line);
              const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                yield text;
              }
            } catch {
              // Skip invalid JSON lines
            }
          }
        }
      }
    } catch (error) {
      this.logger.error('Streaming generation failed', error as Error);
      throw error;
    }
  }

  /**
   * Check if API is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Clean JSON response from markdown code blocks
   */
  private cleanJSONResponse(response: string): string {
    let cleaned = response.trim();

    // Remove markdown code blocks
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.slice(3);
    }

    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3);
    }

    return cleaned.trim();
  }
}

/**
 * Factory function to create GeminiAIProvider
 */
export function createGeminiProvider(logger: ILogger): GeminiAIProvider {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  return new GeminiAIProvider(apiKey, logger);
}
