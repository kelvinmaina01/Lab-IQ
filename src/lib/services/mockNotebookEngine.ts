import { NotebookOutput, NotebookCell } from '@/lib/types/notebook';
import { supabase } from '@/integrations/supabase/client';

export class MockNotebookEngine {

    // Simulate fetching schema
    async getDatasetSchema(datasetId: string): Promise<any> {
        try {
            const { data } = await supabase
                .from('datasets')
                .select('name, schema, row_count, preview_data')
                .eq('id', datasetId)
                .single();

            if (data) {
                const rawSchema = typeof data.schema === 'string'
                    ? JSON.parse(data.schema)
                    : data.schema;
                const columns = Array.isArray(rawSchema) ? rawSchema : (rawSchema?.columns || []);
                return {
                    dataset_name: data.name,
                    row_count: data.row_count,
                    columns: columns,
                    preview: data.preview_data || []
                };
            }
        } catch (e) {
            console.warn("Mock engine failed to fetch real meta, using fallback", e);
        }

        return {
            dataset_name: "Dataset Analytics",
            row_count: 868,
            columns: [{ name: "Upvotes" }, { name: "File_Size" }, { name: "Upload_Date" }],
            preview: []
        };
    }

    async loadNotebook(id: string): Promise<NotebookOutput> {
        return this.getMockNotebook();
    }

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

        // 1. Simulate "Thinking" / Reasoning Phase
        const thoughts = [
            "Parsing query: Average upvotes by file size for top-dataset month...",
            "Identifying top upvoted dataset...",
            "Found: 'Depression and Mental Health Data Analysis' (29 upvotes).",
            "Extracting upload month: January 2024.",
            "Filtering dataset for Jan 2024 uploads.",
            "Segmenting by File_Size categories: Small, Medium, Large.",
            "Calculating average upvotes per segment."
        ];

        for (const thought of thoughts) {
            await this.delay(600);
            callbacks.onThought?.(thought);
        }

        // 2. Simulate Code Generation
        const codeSnippet = `
import pandas as pd
import altair as alt

# 1. Identify Top Dataset & Month
top_dataset = df.loc[df['Upvotes'].idxmax()]
target_month = top_dataset['Upload_Date'].month
target_year = top_dataset['Upload_Date'].year

# 2. Filter Cohort
cohort = df[
    (df['Upload_Date'].dt.month == target_month) & 
    (df['Upload_Date'].dt.year == target_year)
]

# 3. Aggregate by File Size
avg_upvotes = cohort.groupby('File_Size')['Upvotes'].mean().reset_index()

# 4. Visualize
chart = alt.Chart(avg_upvotes).mark_bar().encode(
    x='File_Size',
    y='Upvotes',
    tooltip=['File_Size', 'Upvotes']
).properties(title='Avg Upvotes by File Size')
`;

        const chars = codeSnippet.split('');
        for (let i = 0; i < chars.length; i += 5) {
            await this.delay(5);
            callbacks.onCode?.(chars.slice(i, i + 5).join(''));
        }

        // 3. Simulate Execution
        await this.delay(800);
        callbacks.onExecution?.("Top Dataset: 'Depression and Mental Health Data Analysis'\n");
        await this.delay(400);
        callbacks.onExecution?.("Target Period: 2024-01\n");
        await this.delay(400);
        callbacks.onExecution?.("Cohort Size: 265 datasets\n");

        // 4. Complete
        await this.delay(500);
        callbacks.onComplete?.(this.getMockNotebook());
    }

    private delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private getMockNotebook(): NotebookOutput {
        return {
            notebook_id: "mock-julius-poc",
            analysis_metadata: {
                domain: "life_sciences",
                analysis_type: "comparative",
                confidence_level: "high",
                generated_at: new Date().toISOString()
            },
            cells: [
                {
                    cell_id: "c1",
                    cell_type: "prompt",
                    title: "User Query",
                    content: { user_question: "What is the average \"Upvotes\" for datasets uploaded in the same month as the dataset with the highest number of upvotes, segmented by \"File_Size\" categories?" },
                    dependencies: [],
                    ui_hints: { collapsible: false, emphasis: 'normal' }
                },
                {
                    cell_id: "c2",
                    cell_type: "reasoning",
                    title: "Thinking Process",
                    content: {
                        thought_process: [
                            { step_number: 1, section: "Identification", content: "Identified top dataset: 'Depression and Mental Health Data Analysis' (29 upvotes)." },
                            { step_number: 2, section: "Timeframe", content: "Determined target upload month: January 2024." },
                            { step_number: 3, section: "Segmentation", content: "Grouped 264 datasets by File_Size categories." }
                        ],
                        methodology: "Cohort Analysis & Aggregation",
                        assumptions: [],
                        challenges: [],
                        observations: []
                    },
                    dependencies: [],
                    ui_hints: { collapsible: true, emphasis: 'normal' }
                },
                {
                    cell_id: "c3",
                    cell_type: "metric",
                    title: "Key Result",
                    content: {
                        metrics: [
                            { label: "Cohort Average", value: 7.14, interpretation: "Healthy engagement baseline" },
                            { label: "Top Segment (Large)", value: 7.68, interpretation: "Highest average upvotes" },
                            { label: "Cohort Size", value: 265, interpretation: "Datasets in Jan 2024" }
                        ]
                    },
                    dependencies: [],
                    ui_hints: { collapsible: false, emphasis: 'normal' }
                },
                {
                    cell_id: "c4",
                    cell_type: "explanation",
                    title: "Data Analysis",
                    content: {
                        explanation: `
### 📊 Data Analysis: Average Upvotes by File Size Category

**🔹 Overview and Context**
We explored how datasets uploaded in **January 2024** performed in terms of upvotes, focusing specifically on the month when our highest-upvoted dataset, titled *'Depression and Mental Health Data Analysis'*, was added. This dataset received a standout **29 upvotes**, setting the benchmark for that period.

Within this same timeframe, we analyzed **264 other datasets** segmented by their file size categories to understand how dataset size influences community engagement.

**🔹 Key Insights**
*   **Overall Average**: 7.14 upvotes – indicating healthy engagement.
*   **Maximum (Large Files)**: **7.68 upvotes** 🔺 — larger datasets attract slightly higher user interest.
*   **Minimum (Small Files)**: **6.91 upvotes** 🔻 — smaller datasets received somewhat less attention.

In simple terms, the community tends to reward datasets that are larger in size with more upvotes, possibly because these datasets offer richer information.
`
                    },
                    dependencies: [],
                    ui_hints: { collapsible: false, emphasis: 'normal' }
                },
                {
                    cell_id: "c5",
                    cell_type: "visualization",
                    title: "Upvotes by File Size",
                    content: {
                        chart_type: "bar",
                        config: {
                            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
                            "data": {
                                "values": [
                                    { "File_Size": "Small", "Upvotes": 6.91, "Color": "#cbd5e1" },
                                    { "File_Size": "Medium", "Upvotes": 7.07, "Color": "#94a3b8" },
                                    { "File_Size": "Large", "Upvotes": 7.68, "Color": "#3b82f6" },
                                    { "File_Size": "Unknown", "Upvotes": 7.68, "Color": "#64748b" }
                                ]
                            },
                            "title": "Average Upvotes by File Size Category",
                            "mark": "bar",
                            "encoding": {
                                "x": { "field": "File_Size", "type": "ordinal", "sort": ["Small", "Medium", "Large", "Unknown"], "axis": { "labelAngle": 0 } },
                                "y": { "field": "Upvotes", "type": "quantitative" },
                                "color": { "field": "Color", "type": "nominal", "scale": null },
                                "tooltip": ["File_Size", "Upvotes"]
                            }
                        },
                        description: "Large and Unknown file sizes show the highest average engagement (7.68), while Small files show the lowest (6.91)."
                    },
                    dependencies: [],
                    ui_hints: { collapsible: false, emphasis: 'normal' }
                },
                {
                    cell_id: "c6",
                    cell_type: "explanation",
                    title: "Chart Analysis",
                    content: {
                        explanation: `
### 📊 Chart Analysis: Typical Upvote Engagement

**🔹 Overview**
The typical number of upvotes gently rises as file size increases, suggesting that larger datasets tend to attract slightly more attention.

**📈 Breakdown by File Size**
*   **Small Files**: ~6.91 upvotes. Steady interest. 🔻
*   **Medium Files**: ~7.07 upvotes. Moderate increase. ➡️
*   **Large Files**: **7.68 upvotes**. Highest community appreciation. 🔺
*   **Unknown Size**: Also 7.68 upvotes. Metadata absence doesn’t hinder interest.

**🔹 Key Takeaway**
Building larger datasets tends to increase your visibility. However, even smaller datasets maintain respectable engagement.
`
                    },
                    dependencies: [],
                    ui_hints: { collapsible: false, emphasis: 'normal' }
                },
                {
                    cell_id: "c7",
                    cell_type: "table",
                    title: "Detailed Breakdown",
                    content: {
                        headers: ["File_Size", "Average_Upvotes", "Engagement Level"],
                        rows: [
                            ["Small", "6.91", "Lowest 🔻"],
                            ["Medium", "7.07", "Moderate ➡️"],
                            ["Large", "7.68", "Highest 🔺"],
                            ["Unknown", "7.68", "Highest 🔺"]
                        ],
                        caption: "Comparative Insight: The difference between highest and lowest is 0.77 upvotes."
                    },
                    dependencies: [],
                    ui_hints: { collapsible: false, emphasis: 'normal' }
                },
                {
                    cell_id: "c8",
                    cell_type: "explanation",
                    title: "Implications",
                    content: {
                        explanation: `
### 🔹 Implications and Recommendations

1.  **🔺 Encourage Larger Datasets**: Comprehensive datasets are rewarded with higher upvotes.
2.  **➡️ Support Small Datasets**: They still generate solid engagement.
3.  **🔻 Enhance Visibility**: Improve metadata for smaller datasets to boost upvotes.

By understanding how dataset size influences user engagement, we can better guide contributors.
`
                    },
                    dependencies: [],
                    ui_hints: { collapsible: false, emphasis: 'normal' }
                },
                {
                    cell_id: "c9",
                    cell_type: "suggestion",
                    title: "Next Steps",
                    content: {
                        suggestions: [
                            { prompt: "How does 'Usability_Rating' correlate with 'Upvotes'?", rationale: "Check quality vs quantity" },
                            { prompt: "What is the distribution of 'File_Size' categories?", rationale: "Understand population mix" },
                            { prompt: "Analyze Author activity for top datasets", rationale: "Identify top contributors" }
                        ]
                    },
                    dependencies: [],
                    ui_hints: { collapsible: false, emphasis: 'normal' }
                }
            ]
        };
    }
}

export const mockNotebookEngine = new MockNotebookEngine();
