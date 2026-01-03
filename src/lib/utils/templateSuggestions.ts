/**
 * AI-Powered Template Suggestion System
 * 
 * This service analyzes processed dataset content using LabIQ's AI to recommend
 * relevant experiment templates based on:
 * - Column names and data types
 * - Sample data values and distributions
 * - Statistical patterns
 * - File name context
 */

import { labIQAI } from '@/lib/ai/LabIQAI';
import { TEMPLATE_METADATA, TemplateRecommendation, TemplateSuggestionContext } from '@/lib/types/templates';

// Cache for recommendations to avoid redundant AI calls
const recommendationCache = new Map<string, { recommendations: TemplateRecommendation[], timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Generate a cache key from dataset context
 */
function generateCacheKey(context: TemplateSuggestionContext): string {
    const columnNames = context.columns.map(c => c.name).sort().join(',');
    return `${context.fileName}:${columnNames}:${context.rowCount}`;
}

/**
 * AI-powered template suggestion with processed dataset analysis
 */
export async function suggestTemplatesWithAI(
    context: TemplateSuggestionContext
): Promise<TemplateRecommendation[]> {
    // Check cache first
    const cacheKey = generateCacheKey(context);
    const cached = recommendationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.recommendations;
    }

    // Check if AI is available
    if (!labIQAI.isAvailable()) {
        console.warn('AI not available, falling back to pattern matching');
        return fallbackPatternMatching(context);
    }

    try {
        // Build comprehensive context for AI analysis
        const dataContext = buildDataContextForAI(context);

        // Call AI with structured prompt
        const prompt = `Analyze this dataset and recommend the most suitable experiment templates from the available options.

DATASET ANALYSIS:
${dataContext}

AVAILABLE TEMPLATES:
${Object.values(TEMPLATE_METADATA).map(t => `- ${t.id}: ${t.name} (${t.discipline}) - ${t.description}`).join('\n')}

INSTRUCTIONS:
1. Analyze the column names, data types, and sample values carefully
2. Consider the statistical patterns and data distributions
3. Recommend up to 3 most suitable templates
4. Provide confidence score (0-1) for each recommendation
5. Explain your reasoning for each recommendation

Respond with ONLY a JSON array in this exact format:
[
  {
    "id": "template-id",
    "confidence": 0.95,
    "reasoning": "This dataset contains pH, volume, and concentration measurements which are characteristic of titration experiments..."
  }
]`;

        const response = await labIQAI.quickInsight.process(
            `Based on this dataset context, recommend up to 3 health research templates.
      
${dataContext}

Available templates: ${Object.values(TEMPLATE_METADATA).map(t => `${t.id}: ${t.name}`).join(', ')}

Respond with ONLY valid JSON array: [{"id": "template-id", "confidence": 0.95, "reasoning": "explanation"}]`,
            'recommendation'
        );

        // Parse AI response
        const recommendations = parseAIRecommendations(response);

        // Enrich with template metadata
        const enrichedRecommendations = recommendations.map(rec => ({
            ...rec,
            templateName: TEMPLATE_METADATA[rec.id]?.name,
            discipline: TEMPLATE_METADATA[rec.id]?.discipline
        }));

        // Cache the results
        recommendationCache.set(cacheKey, {
            recommendations: enrichedRecommendations,
            timestamp: Date.now()
        });

        return enrichedRecommendations;
    } catch (error) {
        console.error('AI template suggestion failed:', error);
        // Fallback to pattern matching on error
        return fallbackPatternMatching(context);
    }
}

/**
 * Build detailed data context for AI analysis
 */
function buildDataContextForAI(context: TemplateSuggestionContext): string {
    let analysis = `File Name: ${context.fileName}\n`;
    analysis += `Dataset Size: ${context.rowCount || 0} rows × ${context.columnCount || 0} columns\n\n`;

    analysis += `COLUMN ANALYSIS:\n`;
    context.columns.forEach((col, idx) => {
        analysis += `${idx + 1}. "${col.name}" (${col.type || 'unknown'})\n`;
        if (col.uniqueCount !== undefined) {
            analysis += `   - Unique values: ${col.uniqueCount}\n`;
        }
        if (col.nullCount !== undefined && col.nullCount > 0) {
            analysis += `   - Missing values: ${col.nullCount}\n`;
        }
        if (col.sampleValues && col.sampleValues.length > 0) {
            const samples = col.sampleValues.slice(0, 3).map(v => JSON.stringify(v)).join(', ');
            analysis += `   - Sample values: ${samples}\n`;
        }
    });

    if (context.sampleRows && context.sampleRows.length > 0) {
        analysis += `\nSAMPLE DATA (first 3 rows):\n`;
        context.sampleRows.slice(0, 3).forEach((row, idx) => {
            analysis += `Row ${idx + 1}: ${JSON.stringify(row)}\n`;
        });
    }

    if (context.dataQuality !== undefined) {
        analysis += `\nData Quality Score: ${Math.round(context.dataQuality)}%\n`;
    }

    return analysis;
}

/**
 * Parse AI response into structured recommendations
 */
function parseAIRecommendations(aiResponse: string): TemplateRecommendation[] {
    try {
        // Try to extract JSON array from response
        let jsonStr = aiResponse.trim();

        // Remove markdown code blocks if present
        const codeBlockMatch = jsonStr.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
        if (codeBlockMatch) {
            jsonStr = codeBlockMatch[1];
        }

        // Find array bounds
        const arrayStart = jsonStr.indexOf('[');
        const arrayEnd = jsonStr.lastIndexOf(']');
        if (arrayStart !== -1 && arrayEnd !== -1) {
            jsonStr = jsonStr.substring(arrayStart, arrayEnd + 1);
        }

        const recommendations = JSON.parse(jsonStr) as TemplateRecommendation[];

        // Validate and filter recommendations
        return recommendations
            .filter(rec =>
                rec.id &&
                TEMPLATE_METADATA[rec.id] &&
                rec.confidence >= 0.3 &&
                rec.reasoning
            )
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 3); // Max 3 recommendations
    } catch (error) {
        console.error('Failed to parse AI recommendations:', error);
        return [];
    }
}

/**
 * Fallback pattern matching (simplified version of old logic)
 */
function fallbackPatternMatching(context: TemplateSuggestionContext): TemplateRecommendation[] {
    const fileName = context.fileName.toLowerCase();
    const columnNames = context.columns.map(c => c.name.toLowerCase());

    const patterns: Record<string, { keywords: string[], columns: string[] }> = {
        "clinical-trial": {
            keywords: ["trial", "treatment", "arm", "placebo", "efficacy"],
            columns: ["patient", "treatment", "outcome", "adverse", "dose", "group"]
        },
        "lab-results": {
            keywords: ["lab", "test", "result", "panel"],
            columns: ["test_name", "value", "result", "unit", "reference", "range"]
        },
        "vitals-monitoring": {
            keywords: ["vital", "monitor", "continuous"],
            columns: ["blood_pressure", "heart_rate", "temperature", "spo2", "pulse"]
        }
    };

    const scores: Record<string, number> = {};

    Object.entries(patterns).forEach(([id, pattern]) => {
        let score = 0;
        pattern.keywords.forEach(kw => {
            if (fileName.includes(kw)) score += 5;
        });
        pattern.columns.forEach(col => {
            if (columnNames.some(c => c.includes(col))) score += 2;
        });
        if (score > 0) scores[id] = score;
    });

    return Object.entries(scores)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([id, score]) => ({
            id,
            confidence: Math.min(score / 15, 1), // Normalize to 0-1
            reasoning: "Matched based on health data patterns in filename and columns",
            templateName: TEMPLATE_METADATA[id]?.name,
            discipline: TEMPLATE_METADATA[id]?.discipline
        }));
}

/**
 * Legacy function for backward compatibility (synchronous)
 * Returns just template IDs without confidence/reasoning
 */
export function suggestTemplates(fileName: string, columns: string[]): string[] {
    const context: TemplateSuggestionContext = {
        fileName,
        columns: columns.map(name => ({ name }))
    };

    const recommendations = fallbackPatternMatching(context);
    return recommendations.map(r => r.id);
}
