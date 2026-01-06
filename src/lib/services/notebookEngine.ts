/**
 * Notebook Engine Service
 * Orchestrates AI-powered notebook cell generation
 * 
 * This service converts user prompts into structured notebook analyses
 * conforming to the JSON schema contract.
 */

import {
    NotebookOutput,
    NotebookCell,
    validateNotebookOutput,
    PromptCellContent,
    InsightCellContent,
    isInsightCell
} from '@/lib/types/notebook';
import { supabase } from '@/integrations/supabase/client';

export class NotebookEngine {
    /**
     * Generate complete notebook from user prompt
     * 
     * @param userPrompt - Natural language analytical question
     * @param datasetId - Dataset to analyze
     * @param userId - Current user ID
     * @param onCellGenerated - Optional callback for progressive rendering
     */
    async generateNotebook(
        userPrompt: string,
        datasetId: string,
        userId: string,
        onCellGenerated?: (cell: NotebookCell) => void
    ): Promise<NotebookOutput> {
        // 1. Fetch dataset schema
        const datasetSchema = await this.getDatasetSchema(datasetId);

        // 2. Call Backend API to generate JSON output (LangGraph Agent)
        const response = await fetch('/api/v1/generate-notebook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_prompt: userPrompt,
                dataset_context: datasetSchema
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`AI generation failed (${response.status}): ${errorText}`);
        }

        const notebookOutput = await response.json();

        // 3. Validate output
        const validation = validateNotebookOutput(notebookOutput);
        if (!validation.valid) {
            console.error('Notebook validation failed:', validation.errors);
            throw new Error(`Invalid notebook structure: ${validation.errors.join(', ')}`);
        }

        // 4. Stream cells to UI if callback provided
        if (onCellGenerated) {
            notebookOutput.cells.forEach(cell => onCellGenerated(cell));
        }

        // 5. Persist to database
        await this.saveNotebook(notebookOutput, datasetId, userId);

        // 6. Auto-Pin eligible insights (Section 9.2 Compliance)
        await this.autoPinInsights(notebookOutput, userId);

        return notebookOutput;
    }

    /**
     * Fetch dataset schema for AI context
     */
    /**
     * Fetch dataset schema and preview for AI context and UI
     */
    async getDatasetSchema(datasetId: string): Promise<any> {
        const { data, error } = await supabase
            .from('datasets')
            .select('name, schema, row_count, preview_data')
            .eq('id', datasetId)
            .single();

        if (error) throw new Error(`Failed to fetch dataset: ${error.message}`);

        // Parse schema JSON
        const rawSchema = typeof data.schema === 'string'
            ? JSON.parse(data.schema)
            : data.schema;

        // Handle { columns: [...] } wrapper vs raw [...] array
        const columns = Array.isArray(rawSchema) ? rawSchema : (rawSchema?.columns || []);

        return {
            dataset_name: data.name,
            row_count: data.row_count,
            columns: columns,
            preview: data.preview_data || []
        };
    }

    /**
     * Get dataset preview rows for Explorer
     */
    async getDatasetPreview(datasetId: string): Promise<any[]> {
        // Try fetching optimized preview from metadata first
        const { data, error } = await supabase
            .from('datasets')
            .select('preview_data')
            .eq('id', datasetId)
            .single();

        if (!error && data?.preview_data && data.preview_data.length > 0) {
            return data.preview_data;
        }

        // Fallback to fetching raw rows
        const { data: rows, error: rowsError } = await supabase
            .from('dataset_rows')
            .select('data')
            .eq('dataset_id', datasetId)
            .order('row_index', { ascending: true })
            .limit(100);

        if (rowsError) {
            console.error("Failed to fetch preview rows:", rowsError);
            return [];
        }

        return rows.map(r => r.data);
    }

    /**
     * Save notebook and cells to database
     */
    private async saveNotebook(
        notebook: NotebookOutput,
        datasetId: string,
        userId: string
    ): Promise<void> {
        // Insert notebook record
        const { data: notebookRecord, error: notebookError } = await supabase
            .from('notebooks')
            .insert({
                id: notebook.notebook_id,
                user_id: userId,
                dataset_id: datasetId,
                title: this.extractTitle(notebook),
                analysis_metadata: notebook.analysis_metadata
            })
            .select()
            .single();

        if (notebookError) {
            console.error('Failed to save notebook:', notebookError);
            throw new Error(`Notebook save failed: ${notebookError.message}`);
        }

        // Insert all cells
        const cellRecords = notebook.cells.map((cell, index) => ({
            notebook_id: notebook.notebook_id,
            cell_id: cell.cell_id,
            cell_type: cell.cell_type,
            title: cell.title || 'Untitled Cell',
            content: cell.content || {},
            dependencies: cell.dependencies || [],
            ui_hints: cell.ui_hints || {},
            execution_order: index
        }));

        const { error: cellsError } = await supabase
            .from('notebook_cells')
            .insert(cellRecords);

        if (cellsError) {
            console.error('Failed to save cells:', cellsError);
            throw new Error(`Cells save failed: ${cellsError.message}`);
        }
    }

    /**
     * Extract notebook title from first cell or generate from prompt
     */
    private extractTitle(notebook: NotebookOutput): string {
        const promptCell = notebook.cells.find(c => c.cell_type === 'prompt');
        if (promptCell) {
            const content = promptCell.content as PromptCellContent;
            if (content.user_question) {
                const question = content.user_question;
                // Truncate to reasonable length
                return question.length > 100 ? question.substring(0, 97) + '...' : question;
            }
        }
        return `Analysis ${new Date().toISOString().split('T')[0]}`;
    }

    /**
     * Load existing notebook with all cells
     */
    async loadNotebook(notebookId: string): Promise<NotebookOutput> {
        // MOCK INTERCEPTION
        if (notebookId === 'mock-julius-poc') {
            console.warn("Intercepting mock notebook ID");
            return {
                notebook_id: 'mock-julius-poc',
                analysis_metadata: {
                    domain: 'Healthcare',
                    analysis_type: 'Exploratory'
                },
                cells: []
            };
        }

        // Fetch notebook
        const { data: notebook, error: notebookError } = await supabase
            .from('notebooks')
            .select('*')
            .eq('id', notebookId)
            .single();

        if (notebookError) throw new Error(`Notebook not found: ${notebookError.message}`);

        // Fetch cells
        const { data: cells, error: cellsError } = await supabase
            .from('notebook_cells')
            .select('*')
            .eq('notebook_id', notebookId)
            .order('execution_order', { ascending: true });

        if (cellsError) throw new Error(`Failed to load cells: ${cellsError.message}`);

        // Reconstruct NotebookOutput
        return {
            notebook_id: notebook.id,
            analysis_metadata: notebook.analysis_metadata,
            cells: cells.map(cell => ({
                cell_id: cell.cell_id,
                cell_type: cell.cell_type as any,
                title: cell.title,
                content: cell.content as any, // Cast JSON from DB to CellContent
                dependencies: cell.dependencies || [],
                ui_hints: cell.ui_hints as any
            }))
        };
    }

    /**
     * List user's notebooks
     */
    async listNotebooks(userId: string, datasetId?: string): Promise<any[]> {
        let query = supabase
            .from('notebooks')
            .select('id, title, analysis_metadata, created_at, dataset_id')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (datasetId) {
            query = query.eq('dataset_id', datasetId);
        }

        const { data, error } = await query;

        if (error) throw new Error(`Failed to list notebooks: ${error.message}`);

        return data || [];
    }

    /**
     * Delete notebook and all cells
     */
    async deleteNotebook(notebookId: string): Promise<void> {
        // Cascade delete handles cells automatically
        const { error } = await supabase
            .from('notebooks')
            .delete()
            .eq('id', notebookId);

        if (error) throw new Error(`Failed to delete notebook: ${error.message}`);
    }


    /**
     * Auto-pin eligible insights to dashboard
     * Compliance: Section 9.2 Auto-Pin Prompt (Default = ON)
     */
    private async autoPinInsights(notebook: NotebookOutput, userId: string): Promise<void> {
        // Filter for insight cells that are eligible for pinning
        const eligibleInsights = notebook.cells.filter((cell): cell is NotebookCell & { content: InsightCellContent } => {
            return isInsightCell(cell) && (cell.content as InsightCellContent).pin_metadata?.pin_eligible;
        });

        if (eligibleInsights.length === 0) return;

        console.log(`Auto-pinning ${eligibleInsights.length} insights...`);

        const insightsToInsert = eligibleInsights.map(cell => {
            // Content is already narrowed to InsightCellContent by the filter predicate above
            const content = cell.content;
            const meta = content.pin_metadata;

            return {
                user_id: userId,
                notebook_id: notebook.notebook_id,
                cell_id: cell.cell_id,
                title: meta.suggested_title || 'New Insight',
                description: meta.suggested_description || content.summary,
                insight_data: content,
                tags: meta.pin_tags || ['trend'],
                is_archived: false,
                source: 'ai_assistant'
            };
        });

        const { error } = await supabase
            .from('pinned_insights')
            .insert(insightsToInsert);

        if (error) {
            console.error('Failed to auto-pin insights:', error);
            // Non-blocking error, just log warning
        }
    }
    /**
     * Generate notebook using Real-time WebSocket Stream
     */
    async generateNotebookStream(
        userPrompt: string,
        datasetId: string,
        userId: string,
        callbacks: {
            onThought?: (thought: any) => void;
            onCode?: (code: any) => void;
            onExecution?: (log: string) => void;
            onComplete?: (notebook: NotebookOutput) => void;
            onError?: (error: string) => void;
        }
    ): Promise<void> {
        // 1. Fetch Schema
        const datasetSchema = await this.getDatasetSchema(datasetId);

        // 2. Open WebSocket
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host; // Uses current host (proxy handles /ws)
        // Adjust port if running in dev mode where backend might be on different port if not proxied
        // Assuming standard Vite proxy setup:
        const wsUrl = `${protocol}//${host}/ws/generate-notebook`;

        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            // 3. Send Request
            ws.send(JSON.stringify({
                user_prompt: userPrompt,
                dataset_context: datasetSchema,
                data_rows: [] // In a real app, we might pass sample rows or ID for backend to fetch
            }));
        };

        ws.onmessage = async (event) => {
            try {
                const msg = JSON.parse(event.data);

                switch (msg.type) {
                    case 'token':
                        if (msg.target === 'thought') callbacks.onThought?.(msg.chunk);
                        if (msg.target === 'code') callbacks.onCode?.(msg.chunk);
                        break;
                    case 'status':
                        // Optional: phase change handler
                        break;
                    case 'thought':
                        callbacks.onThought?.(msg);
                        break;
                    case 'code':
                        callbacks.onCode?.(msg);
                        break;
                    case 'execution':
                        callbacks.onExecution?.(msg.logs);
                        break;
                    case 'complete':
                        // Final notebook received
                        const notebook = msg.payload;

                        // Validate & Persist
                        const validation = validateNotebookOutput(notebook);
                        if (!validation.valid) {
                            throw new Error(`Invalid notebook structure: ${validation.errors.join(', ')}`);
                        }

                        await this.saveNotebook(notebook, datasetId, userId);
                        await this.autoPinInsights(notebook, userId);

                        callbacks.onComplete?.(notebook);
                        ws.close();
                        break;
                    case 'error':
                        callbacks.onError?.(msg.error);
                        ws.close();
                        break;
                }
            } catch (e) {
                console.error("Stream processing error:", e);
                callbacks.onError?.(e instanceof Error ? e.message : "Unknown stream error");
                ws.close();
            }
        };

        ws.onerror = (e) => {
            console.error("WebSocket error:", e);
            callbacks.onError?.("Connection failed");
        };

        ws.onclose = () => {
            console.log("Stream closed");
        };
    }
}

// Singleton instance
export const notebookEngine = new NotebookEngine();
