/**
 * Notebook AI - Type Definitions
 * Conforms to JSON Schema Contract (see: json_schema.md)
 * 
 * This file defines the exact structure that the AI must output
 * for notebook-based analysis cells.
 */

// ============================================================================
// CORE NOTEBOOK TYPES
// ============================================================================

export interface NotebookOutput {
    notebook_id: string;
    analysis_metadata: AnalysisMetadata;
    cells: NotebookCell[];
}

export interface AnalysisMetadata {
    domain: 'health' | 'medical' | 'life_sciences';
    analysis_type: 'descriptive' | 'diagnostic' | 'exploratory' | 'comparative';
    generated_at: string; // ISO-8601
    confidence_level: 'high' | 'medium' | 'exploratory';
}

// ============================================================================
// CELL TYPES
// ============================================================================

export type CellType =
    | 'prompt'           // User's analytical question
    | 'reasoning'        // Analytical methodology (appears before metrics/viz)
    | 'code'             // Executable code (Python/SQL)
    | 'explanation'      // Line-by-line code explanation
    | 'metric'           // KPIs and quantitative values
    | 'visualization'    // Single chart with description
    | 'table'            // Structured data display
    | 'insight'          // Pin-eligible interpreted findings
    | 'suggestion';      // Follow-up questions

export interface NotebookCell {
    cell_id: string;
    cell_type: CellType;
    title: string;
    content: CellContent;
    dependencies: string[]; // cell_ids this cell depends on
    ui_hints: UIHints;
}

export interface UIHints {
    collapsible: boolean;
    emphasis: 'normal' | 'highlighted' | 'critical';
}

// ============================================================================
// CELL CONTENT TYPES (Type-specific structures)
// ============================================================================

export type CellContent =
    | PromptCellContent
    | ReasoningCellContent
    | CodeCellContent
    | ExplanationCellContent
    | MetricCellContent
    | VisualizationCellContent
    | TableCellContent
    | InsightCellContent
    | SuggestionCellContent;

// ----------------------------------------------------------------------------
// 1. Prompt Cell
// ----------------------------------------------------------------------------
export interface PromptCellContent {
    user_question: string;
}

// ----------------------------------------------------------------------------
// 2. Reasoning Cell (methodology, assumptions, challenges, observations)
// ----------------------------------------------------------------------------
export interface ReasoningCellContent {
    methodology: string;
    assumptions: string[];
    challenges: string[];
    observations: string[];
}

// ----------------------------------------------------------------------------
// 2a. Code Cell (Executable Python/SQL)
// ----------------------------------------------------------------------------
export interface CodeCellContent {
    language: 'python' | 'sql';
    code: string;
}

// ----------------------------------------------------------------------------
// 2b. Explanation Cell (Line-by-line explanation)
// ----------------------------------------------------------------------------
export interface ExplanationCellContent {
    explanation: string;
    step_by_step?: string[];
}

// ----------------------------------------------------------------------------
// 3. Metric Cell (KPIs only, no interpretation)
// ----------------------------------------------------------------------------
export interface MetricCellContent {
    metrics: Metric[];
}

export interface Metric {
    label: string;
    value: number | string;
    unit?: string;
    interpretation?: string;
}

// ----------------------------------------------------------------------------
// 4. Visualization Cell (one chart per cell)
// ----------------------------------------------------------------------------
export interface VisualizationCellContent {
    chart_type: 'bar' | 'line' | 'scatter' | 'histogram' | 'heatmap' | 'box';
    config: any; // Recharts configuration object
    description: string; // Plain language explanation
    data_source_cell_ids: string[];
}

// ----------------------------------------------------------------------------
// 5. Table Cell (structured data display)
// ----------------------------------------------------------------------------
export interface TableCellContent {
    headers: string[];
    rows: any[][];
    caption?: string;
}

// ----------------------------------------------------------------------------
// 6. Insight Cell (pin-eligible with full metadata)
// ----------------------------------------------------------------------------
export interface InsightCellContent {
    summary: string;
    key_evidence: string[];
    notable_examples: string[];
    implications: string[];
    confidence: 'high' | 'medium' | 'low';
    pin_metadata: PinMetadata;
}

export interface PinMetadata {
    pin_eligible: boolean;
    suggested_title: string;
    suggested_description: string;
    pin_tags: PinTag[];
    source_cells: string[]; // cell_ids that support this insight
    drilldown_path: DrilldownPath;
}

export type PinTag = 'trend' | 'correlation' | 'outlier' | 'risk' | 'quality';

export interface DrilldownPath {
    type: 'notebook';
    target_cell_ids: string[];
}

// ----------------------------------------------------------------------------
// 7. Suggestion Cell (next-step prompts)
// ----------------------------------------------------------------------------
export interface SuggestionCellContent {
    suggestions: Suggestion[];
}

export interface Suggestion {
    prompt: string;
    rationale: string;
}

// ============================================================================
// DATABASE MODELS (for persistence)
// ============================================================================

export interface NotebookRecord {
    id: string;
    user_id: string;
    dataset_id: string;
    title: string;
    analysis_metadata: AnalysisMetadata;
    created_at: string;
    updated_at: string;
}

export interface NotebookCellRecord {
    id: string;
    notebook_id: string;
    cell_id: string;
    cell_type: CellType;
    title: string;
    content: any; // JSON
    dependencies: string[]; // JSON array
    ui_hints: UIHints; // JSON
    execution_order: number;
    created_at: string;
}

export interface PinnedInsightRecord {
    id: string;
    user_id: string;
    notebook_id: string;
    cell_id: string;
    title: string; // User's final title (may differ from AI suggestion)
    description: string; // User's final description
    insight_data: InsightCellContent; // Full insight content
    tags: PinTag[];
    created_at: string;
}

// ============================================================================
// VALIDATION & HELPERS
// ============================================================================

/**
 * Validate that a notebook output conforms to schema
 */
export function validateNotebookOutput(notebook: NotebookOutput): {
    valid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    // Check required fields
    if (!notebook.notebook_id) errors.push('Missing notebook_id');
    if (!notebook.analysis_metadata) errors.push('Missing analysis_metadata');
    if (!notebook.cells || !Array.isArray(notebook.cells)) {
        errors.push('Missing or invalid cells array');
        return { valid: false, errors };
    }

    // Validate cell dependencies
    if (notebook.cells) {
        const cellIds = new Set(notebook.cells.map(c => c.cell_id));
        notebook.cells.forEach((cell, index) => {
            if (!cell.cell_id) errors.push(`Cell ${index} missing cell_id`);
            if (!cell.cell_type) errors.push(`Cell ${index} missing cell_type`);

            (cell.dependencies || []).forEach(depId => {
                if (!cellIds.has(depId)) {
                    errors.push(`Invalid dependency: ${depId} in cell ${cell.cell_id}`);
                }
            });
        });

        // Validate pin-eligible insights
        notebook.cells
            .filter(c => c.cell_type === 'insight')
            .forEach(cell => {
                const content = cell.content as InsightCellContent;
                if (content.pin_metadata?.pin_eligible) {
                    if (!content.pin_metadata.source_cells || content.pin_metadata.source_cells.length === 0) {
                        errors.push(`Pin-eligible insight ${cell.cell_id} has no source cells`);
                    }
                }
            });
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Type guard to check if content is InsightCellContent
 */
export function isInsightCell(cell: NotebookCell): cell is NotebookCell & { content: InsightCellContent } {
    return cell.cell_type === 'insight';
}
