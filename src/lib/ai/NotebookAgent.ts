/**
 * Notebook AI Agent
 * Generates structured notebook analyses conforming to JSON schema
 * 
 * This agent is responsible for calling the LLM with the strict system contract
 * and returning validated NotebookOutput objects.
 */

import { NotebookOutput, NotebookCell, InsightCellContent } from '@/lib/types/notebook';
import { labIQAI } from '@/lib/ai/LabIQAI';

/**
 * System prompt incorporating all contracts
 * (See: json_schema.md, ui_contract.xml, notebook_requirements.md)
 */
const NOTEBOOK_SYSTEM_PROMPT = `You are Antigravity, an AI analysis engine that outputs structured notebook content for a medical-grade data analysis dashboard.

THIS IS A STRICT CONTRACT. DO NOT DEVIATE.

────────────────────────────────────────
CORE UI MODEL
────────────────────────────────────────

The user interface is a NOTEBOOK, not a chat.
- Your output is rendered as notebook cells
- Each cell is a first-class UI object
- Cells are readable independently and in sequence
- No sandbox execution is assumed
- No auto-pinning of insights is allowed

────────────────────────────────────────
OUTPUT FORMAT (MANDATORY)
────────────────────────────────────────

You MUST output a single JSON object with this structure:

{
  "notebook_id": "nb_uuid",
  "analysis_metadata": {
    "domain": "health | medical | life_sciences",
    "analysis_type": "descriptive | diagnostic | exploratory | comparative",
    "generated_at": "ISO-8601",
    "confidence_level": "high | medium | exploratory"
  },
  "cells": [...]
}

────────────────────────────────────────
CELL TYPES & ORDERING
────────────────────────────────────────

1. PROMPT CELL - Always first, contains user's question verbatim
2. REASONING CELL - Methodology, assumptions, challenges.
3. CODE CELL - Executable Python/SQL used to derive metrics.
4. EXPLANATION CELL - Line-by-line explanation of the code.
5. METRIC CELL - Displays KPIs calculated by the code.
6. VISUALIZATION CELL (optional) - One chart per cell, includes plain-language explanation
7. TABLE CELL (optional) - Structured data with clear headers and units
8. INSIGHT CELL - Pin-eligible findings with evidence, examples, implications
9. SUGGESTION CELL - Optional follow-up questions, appears last

────────────────────────────────────────
CRITICAL RULES
────────────────────────────────────────

- Output ONLY valid JSON
- All cell_ids must be unique (e.g., "cell_1", "cell_2")
- Dependencies must reference valid cell_ids
- Reasoning cells MUST appear before metric/visualization cells
- Insights must cite source_cells
- Pin eligibility requires: derived from metrics/viz + evidence cited + stable + standalone
- Medical/health analytics tone
- No rushed charts - only create viz if it illustrates reasoning
- No speculation beyond evidence

────────────────────────────────────────
INSIGHT PIN METADATA
────────────────────────────────────────

For insight cells, include pin_metadata:
{
  "pin_eligible": true/false,
  "suggested_title": "Patient Age Shows 67% Correlation with Recovery Time",
  "suggested_description": "1-2 sentences, quantified, actionable",
  "pin_tags": ["trend", "correlation", "outlier", "risk", "quality"],
  "source_cells": ["cell_3", "cell_4"],
  "drilldown_path": {
    "type": "notebook",
    "target_cell_ids": ["cell_6", "cell_3"]
  }
}

Pin eligibility requirements:
- Must reference at least one metric or visualization cell
- Evidence must be explicit in key_evidence array
- No speculative insights
- Must stand alone outside notebook context

────────────────────────────────────────
NARRATIVE STYLE (PromptBI Inspired)
────────────────────────────────────────

Insights should include:
- summary: Overview of finding
- key_evidence: Quantified metrics (avg, median, correlation, etc.)
- notable_examples: Largest, smallest, outliers with context
- implications: What findings mean for users/business
- confidence: high | medium | low

Use professional, analytical, data-focused tone.
Emphasize the story of the data, not just charts.

────────────────────────────────────────
FAILURE POLICY
────────────────────────────────────────

Violation of this contract is a SYSTEM ERROR.`;

/**
 * Generate notebook analysis from user prompt
 */
export async function generateNotebook(
    userPrompt: string,
    datasetId: string,
    datasetSchema: any
): Promise<NotebookOutput> {
    // Build context-aware prompt
    const fullPrompt = `Dataset Context:
Dataset Name: ${datasetSchema.dataset_name}
Row Count: ${datasetSchema.row_count}
Columns: ${JSON.stringify(datasetSchema.columns, null, 2)}

User Question:
${userPrompt}

Generate a complete notebook analysis following the contract.
Output ONLY the JSON object, no additional text.`;

    // Call AI with system prompt
    const { generateNotebookAnalysis } = await import('@/lib/ai/LabIQAI');
    const combinedPrompt = `${NOTEBOOK_SYSTEM_PROMPT}\n\n${fullPrompt}`;
    const response = await generateNotebookAnalysis(combinedPrompt);

    // Parse JSON response
    let notebookOutput: NotebookOutput;
    try {
        // Extract JSON from response (handle markdown code blocks if present)
        const jsonMatch = typeof response === 'string'
            ? response.match(/```json\n([\s\S]*?)\n```/) || [null, response]
            : [null, JSON.stringify(response)];

        const jsonString = jsonMatch[1] || (typeof response === 'string' ? response : JSON.stringify(response));

        // Sanitize JSON string to handle control characters
        const cleanedJsonString = jsonString.replace(/[\u0000-\u001F]+/g, (match) => {
            // Allow tab, newline, carriage return as they are valid if escaped, but we often get unescaped ones
            // Actually, in JSON string literals, unescaped newlines are invalid.
            // We should escape them or remove them depending on context.
            // Safe bet: replace unescaped \n with \\n
            // But doing it globally is hard.
            // Better approach: use a lenient parser or just trying to strip typical issues.
            // The specific error was "Bad control character in string literal".
            // This usually means a literal newline inside a string " key ": " value \n value ".
            // We can replace literal \n with \\n
            return ""; // Stripping them for now might be safer unless they are needed for formatting.
        });

        // Better Sanitizer: Escape unescaped control characters
        const safeJsonString = jsonString.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t");

        // Wait, if I replace ALL \n with \\n, then existing \\n becomes \\\\n.
        // We need to only replace unescaped ones.
        // A simple heuristic solution for common LLM JSON errors:
        const sanitized = jsonString
            .replace(/[\x00-\x1F\x7F-\x9F]/g, c => {
                switch (c) {
                    case '\b': return '\\b';
                    case '\f': return '\\f';
                    case '\n': return '\\n';
                    case '\r': return '\\r';
                    case '\t': return '\\t';
                    default: return ''; // Remove other control chars
                }
            });

        notebookOutput = JSON.parse(sanitized);
    } catch (error) {
        console.error('Failed to parse notebook JSON:', error);
        throw new Error('AI returned invalid JSON format');
    }

    // Set critical fields BEFORE validation
    // Always generate a new UUID for the database to ensure validity
    notebookOutput.notebook_id = crypto.randomUUID();

    if (!notebookOutput.analysis_metadata) {
        notebookOutput.analysis_metadata = {
            domain: 'health',
            analysis_type: 'exploratory',
            generated_at: new Date().toISOString(),
            confidence_level: 'medium'
        };
    } else if (!notebookOutput.analysis_metadata.generated_at) {
        notebookOutput.analysis_metadata.generated_at = new Date().toISOString();
    }

    // Ensure cells array exists
    if (!notebookOutput.cells || !Array.isArray(notebookOutput.cells)) {
        console.warn('AI did not return valid cells array, creating fallback');
        notebookOutput.cells = [];
    }

    // Now validate structure
    validateNotebookStructure(notebookOutput);

    return notebookOutput;
}

/**
 * Validate notebook structure
 */
function validateNotebookStructure(notebook: NotebookOutput): void {
    if (!notebook.notebook_id) {
        throw new Error('Missing notebook_id');
    }

    if (!notebook.analysis_metadata) {
        throw new Error('Missing analysis_metadata');
    }

    if (!notebook.cells || !Array.isArray(notebook.cells)) {
        throw new Error('Missing or invalid cells array');
    }

    // Only validate if cells exist
    if (notebook.cells.length === 0) {
        console.warn('Notebook has no cells');
        return;
    }

    // Check cell dependencies
    const cellIds = new Set(notebook.cells.map(c => c.cell_id));
    notebook.cells.forEach(cell => {
        if (!cell.cell_id) {
            throw new Error(`Cell missing cell_id: ${cell.title}`);
        }

        // Only check dependencies if they exist
        if (cell.dependencies && Array.isArray(cell.dependencies)) {
            cell.dependencies.forEach(depId => {
                if (!cellIds.has(depId)) {
                    throw new Error(`Invalid dependency: ${depId} in cell ${cell.cell_id}`);
                }
            });
        }
    });

    // Validate pin-eligible insights
    notebook.cells
        .filter(c => c.cell_type === 'insight')
        .forEach(cell => {
            const content = cell.content as InsightCellContent;
            if (content.pin_metadata?.pin_eligible) {
                if (!content.pin_metadata.source_cells || content.pin_metadata.source_cells.length === 0) {
                    throw new Error(`Pin-eligible insight ${cell.cell_id} has no source cells`);
                }
            }
        });
}
