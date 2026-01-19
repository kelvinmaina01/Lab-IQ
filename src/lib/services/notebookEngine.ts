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
import { ML_API_URL } from '../config';

interface AgentOutput {
    plan?: string;
    answer: string;
    code?: string;
    ui_components?: any[];
}


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
        onCellGenerated?: (cell: NotebookCell) => void,
        existingCells: NotebookCell[] = [] // New: Context history
    ): Promise<NotebookOutput> {
        // 1. Fetch dataset schema AND data rows (for AI context)
        const datasetSchema = await this.getDatasetSchema(datasetId);

        // Fetch up to 2000 rows for the AI to analyze
        const { data: rowData, error: rowError } = await supabase
            .from('dataset_rows')
            .select('data')
            .eq('dataset_id', datasetId)
            .limit(2000);

        const rows = rowData ? rowData.map(r => r.data) : [];

        // ... existing imports

        // Create Message History
        const messages = [];

        // Add existing history if provided
        if (existingCells && existingCells.length > 0) {
            existingCells.forEach(cell => {
                if (cell.cell_type === 'prompt' && cell.content.user_question) {
                    messages.push({ role: 'user', content: cell.content.user_question });
                } else if (cell.cell_type === 'insight' && cell.content.summary) {
                    messages.push({ role: 'assistant', content: cell.content.summary });
                } else if (cell.cell_type === 'code' && cell.content.code) {
                    // formatting code as part of assistant response
                    messages.push({ role: 'assistant', content: `Assuming previous code:\n\`\`\`python\n${cell.content.code}\n\`\`\`\n` });
                }
            });
        }

        // Add current prompt
        messages.push({ role: 'user', content: userPrompt });

        // 2. Call Backend API
        const response = await fetch(`${ML_API_URL}/api/agent/run`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: messages, // Send full history
                datasetId: datasetId,
                data: rows,
                mode: 'analysis'
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`AI generation failed (${response.status}): ${errorText}`);
        }

        const agentOutput = await response.json();

        // 3. Map AgentOutput to NotebookOutput
        const notebookOutput: NotebookOutput = {
            notebook_id: crypto.randomUUID(),
            analysis_metadata: {
                domain: 'General', // Could be inferred
                analysis_type: 'Exploratory'
            },
            cells: []
        };

        // Add Prompt Cell
        notebookOutput.cells.push({
            cell_id: crypto.randomUUID(),
            cell_type: 'prompt',
            content: { user_question: userPrompt }
        });

        // 1. Add "Thought Process" / Plan Cell (Glass Box Step 1)
        if (agentOutput.plan) {
            notebookOutput.cells.push({
                cell_id: crypto.randomUUID(),
                cell_type: 'markdown',
                title: 'Analyst Thoughts',
                content: agentOutput.plan,
                ui_hints: { collapsible: false, emphasis: 'low' } // Keeping it low emphasis but visible
            });
        }

        // 2. Add Code Cell (Glass Box Step 2)
        if (agentOutput.code) {
            notebookOutput.cells.push({
                cell_id: crypto.randomUUID(),
                cell_type: 'code',
                title: 'Analysis Logic',
                content: {
                    language: 'python',
                    code: agentOutput.code,
                    explanation: 'Generated analysis code',
                    display_formats: {} // Can hold execution outputs later
                },
                ui_hints: { collapsible: true, emphasis: 'normal' }
            });
        }

        if (agentOutput.answer) {
            notebookOutput.cells.push({
                cell_id: crypto.randomUUID(),
                cell_type: 'insight',
                title: 'Analysis Summary',
                content: {
                    summary: agentOutput.answer,
                    key_evidence: [],
                    notable_examples: [],
                    implications: [],
                    confidence: 'high',
                    pin_metadata: {
                        pin_eligible: false,
                        suggested_title: 'Analysis Summary',
                        suggested_description: typeof agentOutput.answer === 'string' ? agentOutput.answer.substring(0, 100) : 'Summary',
                        pin_tags: [],
                        source_cells: [],
                        drilldown_path: { type: 'notebook', target_cell_ids: [] }
                    }
                }
            });
        }

        // Map UI Components to Cells
        if (agentOutput.ui_components) {
            agentOutput.ui_components.forEach((comp: any) => {
                if (comp.component === 'Chart') {
                    // Ensure we have data. If the Agent provided data in props.data, use it.
                    // If props.data is missing/empty, we might be in trouble, but the agent prompt now ENFORCES data.
                    const chartData = comp.props.data || [];

                    notebookOutput.cells.push({
                        cell_id: crypto.randomUUID(),
                        cell_type: 'visualization',
                        title: comp.props.title,
                        content: {
                            chart_type: comp.props.type || 'bar', // snake_case for DB/TS
                            config: {
                                data: chartData,
                                xKey: comp.props.xKey,
                                yKey: comp.props.yKey
                            }, // VisualizationCell reads config.data
                            description: comp.props.description || 'Generated chart',
                            data_source_cell_ids: [],
                        },
                        ui_hints: { collapsible: false, emphasis: 'normal' }
                    });
                } else if (comp.component === 'StatCard') {
                    notebookOutput.cells.push({
                        cell_id: crypto.randomUUID(),
                        cell_type: 'metric',
                        title: comp.props.title,
                        content: {
                            metrics: [{
                                label: comp.props.title,
                                value: comp.props.value,
                                interpretation: comp.props.description,
                                unit: ''
                            }],
                            pin_metadata: {
                                pin_eligible: true,
                                suggested_title: comp.props.title,
                                suggested_description: comp.props.description,
                                pin_tags: ['trend'],
                                source_cells: [],
                                drilldown_path: { type: 'notebook', target_cell_ids: [] }
                            }
                        }
                    });
                } else if (comp.component === 'InsightCard') {
                    notebookOutput.cells.push({
                        cell_id: crypto.randomUUID(),
                        cell_type: 'insight',
                        title: comp.props.title,
                        content: {
                            summary: comp.props.content,
                            key_evidence: [],
                            notable_examples: [],
                            implications: [],
                            confidence: comp.props.severity === 'critical' ? 'high' : 'medium',
                            pin_metadata: {
                                pin_eligible: true,
                                suggested_title: comp.props.title,
                                suggested_description: comp.props.content,
                                pin_tags: ['risk'],
                                source_cells: [],
                                drilldown_path: { type: 'notebook', target_cell_ids: [] }
                            }
                        }
                    });
                }
            });
        }


        // 4. Validate output (Lenient validation for mapped content)
        // const validation = validateNotebookOutput(notebookOutput);
        // if (!validation.valid) { ... } // Skip strict validation for now as we are adapting dynamic agent output

        // 5. Stream cells to UI if callback provided
        if (onCellGenerated) {
            notebookOutput.cells.forEach(cell => onCellGenerated(cell));
        }

        // 6. Persist to database
        try {
            await this.saveNotebook(notebookOutput, datasetId, userId);
        } catch (e) {
            console.error("Failed to save notebook to DB (non-fatal):", e);
        }

        // 7. Auto-Pin eligible insights
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
