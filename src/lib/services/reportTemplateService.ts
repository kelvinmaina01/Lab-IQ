export interface ReportTemplate {
    id: string;
    name: string;
    description: string;
    sections: ReportSection[];
}

export interface ReportSection {
    id: string;
    title: string;
    type: 'text' | 'chart' | 'table' | 'insight';
    content?: string; // Static content or placeholder
    dataSource?: string; // 'experiment_results', 'dataset', etc.
}

const DEFAULT_TEMPLATES: ReportTemplate[] = [
    {
        id: 'clinical_summary',
        name: 'Clinical Health Summary',
        description: 'Comprehensive overview of patient health metrics.',
        sections: [
            { id: 'exec_sum', title: 'Executive Summary', type: 'text', dataSource: 'ai_generated' },
            { id: 'vitals', title: 'Vital Signs', type: 'table', dataSource: 'dataset' },
            { id: 'trends', title: 'Key Trends', type: 'chart', dataSource: 'dataset' },
            { id: 'rec', title: 'Recommendations', type: 'insight', dataSource: 'ai_generated' }
        ]
    },
    {
        id: 'experiment_report',
        name: 'ML Experiment Report',
        description: 'Detailed analysis of machine learning experiment results.',
        sections: [
            { id: 'model_perf', title: 'Model Performance', type: 'table', dataSource: 'experiment' },
            { id: 'feature_imp', title: 'Feature Importance', type: 'chart', dataSource: 'experiment' },
            { id: 'interpret', title: 'Interpretation', type: 'text', dataSource: 'ai_generated' }
        ]
    }
];

class ReportTemplateService {
    private static instance: ReportTemplateService;

    private constructor() { }

    public static getInstance(): ReportTemplateService {
        if (!ReportTemplateService.instance) {
            ReportTemplateService.instance = new ReportTemplateService();
        }
        return ReportTemplateService.instance;
    }

    public getTemplates(): ReportTemplate[] {
        return DEFAULT_TEMPLATES;
    }

    public getTemplate(id: string): ReportTemplate | undefined {
        return DEFAULT_TEMPLATES.find(t => t.id === id);
    }

    // In a real app, this would coordinate with backend to generate PDF/HTML
    // For V1, we will generate a structure to be rendered in UI
    public generateReportStructure(templateId: string, context: any): any {
        const template = this.getTemplate(templateId);
        if (!template) throw new Error("Template not found");

        return {
            title: `${template.name} - ${new Date().toLocaleDateString()}`,
            sections: template.sections.map(s => ({
                ...s,
                data: this.mockSectionData(s, context)
            }))
        };
    }

    private mockSectionData(section: ReportSection, context: any) {
        if (section.dataSource === 'ai_generated') {
            return "AI generated content placeholder based on context.";
        }
        return "Data placeholder";
    }
}

export const reportTemplateService = ReportTemplateService.getInstance();
