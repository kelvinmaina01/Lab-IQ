/**
 * Notebook Engine Service
 * Orchestrates AI-powered notebook cell generation
 * 
 * This service converts user prompts into structured notebook analyses
 * conforming to the JSON schema contract.
 */

import { NotebookOutput, NotebookCell, validateNotebookOutput } from '@/lib/types/notebook';
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

        // 2. Call NotebookAgent to generate JSON output
        const notebookAgent = await import('@/lib/ai/NotebookAgent');
        const notebookOutput = await notebookAgent.generateNotebook(
            userPrompt,
            datasetId,
            datasetSchema
        );

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
    private async getDatasetSchema(datasetId: string): Promise<any> {
        const { data, error } = await supabase
            .from('datasets')
            .select('name, schema, row_count')
            .eq('id', datasetId)
            .single();

        if (error) throw new Error(`Failed to fetch dataset: ${error.message}`);

        // Parse schema JSON
        const schema = typeof data.schema === 'string'
            ? JSON.parse(data.schema)
            : data.schema;

        return {
            dataset_name: data.name,
            row_count: data.row_count,
            columns: schema
        };
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
            title: cell.title,
            content: cell.content,
            dependencies: cell.dependencies,
            ui_hints: cell.ui_hints,
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
        if (promptCell && 'user_question' in promptCell.content) {
            const question = promptCell.content.user_question;
            // Truncate to reasonable length
            return question.length > 100 ? question.substring(0, 97) + '...' : question;
        }
        return `Analysis ${new Date().toISOString().split('T')[0]}`;
    }

    /**
     * Load existing notebook with all cells
     */
    async loadNotebook(notebookId: string): Promise<NotebookOutput> {
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
                content: cell.content,
                dependencies: cell.dependencies || [],
                ui_hints: cell.ui_hints
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
        const eligibleInsights = notebook.cells.filter(cell =>
            cell.cell_type === 'insight' &&
            (cell.content as any).pin_metadata?.pin_eligible
        );

        if (eligibleInsights.length === 0) return;

        console.log(`Auto-pinning ${eligibleInsights.length} insights...`);

        const insightsToInsert = eligibleInsights.map(cell => {
            const content = cell.content as any;
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
}

// Singleton instance
export const notebookEngine = new NotebookEngine();
