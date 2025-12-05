import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, FlaskConical, ShieldCheck, Activity, Microscope, Pill, Factory, Leaf } from "lucide-react";

export interface Template {
    id: string;
    title: string;
    description: string;
    category: string;
    icon: any;
    config: any; // Pre-dined config for ReportBuilder
    tags: string[];
}

export const templates: Template[] = [
    // General Domain
    {
        id: "general-exec",
        title: "Executive Summary",
        description: "High-level overview of project progress and key KPIs suitable for management review.",
        category: "General",
        icon: FileText,
        tags: ["Management", "Overview", "KPIs"],
        config: {
            title: "Project Executive Summary",
            type: "executive",
            modules: { summary: true, stats: true, charts: true, anomalies: false, recommendations: true, auditLog: false }
        }
    },
    // Clinical / Pharma
    {
        id: "clinical-trial",
        title: "Clinical Trial Analysis",
        description: "Detailed analysis of patient cohorts, efficacy data, and safety signals for Phase 1-3 trials.",
        category: "Pharma",
        icon: Pill,
        tags: ["Clinical", "FDA", "Cohorts"],
        config: {
            title: "Clinical Trial Phase Analysis",
            type: "technical",
            modules: { summary: true, stats: true, charts: true, anomalies: true, recommendations: false, auditLog: true }
        }
    },
    {
        id: "bio-assay",
        title: "Bio-Assay Validation",
        description: "Standard validation report for biological assays including linearity, accuracy, and precision metrics.",
        category: "Bio-Tech",
        icon: Microscope,
        tags: ["Validation", "QC", "Biology"],
        config: {
            title: "Bio-Assay Validation Report",
            type: "technical",
            modules: { summary: true, stats: true, charts: true, anomalies: true, recommendations: true, auditLog: true }
        }
    },
    // Chemical / Manufacturing
    {
        id: "chem-stability",
        title: "Stability Study Report",
        description: "Long-term stability testing results for chemical substances under varying environmental conditions.",
        category: "Chemical",
        icon: FlaskConical,
        tags: ["Stability", "Shelf-Life", "Quality"],
        config: {
            title: "Product Stability Assessment",
            type: "technical",
            modules: { summary: true, stats: true, charts: true, anomalies: true, recommendations: false, auditLog: false }
        }
    },
    {
        id: "mfg-batch",
        title: "Batch Release Record",
        description: "Comprehensive record of a production batch, including QC tests, yield analysis, and deviation logs.",
        category: "Manufacturing",
        icon: Factory,
        tags: ["Production", "QC Release", "GMP"],
        config: {
            title: "Batch #___ Release Record",
            type: "compliance",
            modules: { summary: true, stats: true, charts: false, anomalies: true, recommendations: false, auditLog: true }
        }
    },
    // Environmental
    {
        id: "env-impact",
        title: "Environmental Impact Assessment",
        description: "Analysis of environmental samples (water, soil, air) against regulatory compliance limits.",
        category: "Environmental",
        icon: Leaf,
        tags: ["EPA", "Compliance", "Safety"],
        config: {
            title: "Environmental Monitoring Report",
            type: "compliance",
            modules: { summary: true, stats: true, charts: true, anomalies: true, recommendations: true, auditLog: false }
        }
    },
    // Compliance
    {
        id: "audit-iso",
        title: "ISO 17025 Internal Audit",
        description: "Internal audit template structured meeting ISO/IEC 17025 general requirements for competence.",
        category: "Compliance",
        icon: ShieldCheck,
        tags: ["ISO 17025", "Audit", "Quality"],
        config: {
            title: "ISO 17025 Internal Audit Result",
            type: "compliance",
            modules: { summary: true, stats: false, charts: false, anomalies: true, recommendations: true, auditLog: true }
        }
    },
    {
        id: "perf-lab",
        title: "Lab Performance Dashboard",
        description: "Operational metrics including throughput, turnaround time, and instrument utilization rates.",
        category: "Operations",
        icon: Activity,
        tags: ["Operations", "Efficiency", "Metrics"],
        config: {
            title: "Monthly Lab Operations Review",
            type: "performance",
            modules: { summary: true, stats: true, charts: true, anomalies: false, recommendations: true, auditLog: false }
        }
    }
];

interface TemplatesGalleryProps {
    onUseTemplate: (template: Template) => void;
}

export const TemplatesGallery = ({ onUseTemplate }: TemplatesGalleryProps) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4">
            {templates.map((template) => (
                <Card key={template.id} className="flex flex-col hover:shadow-lg transition-all border-muted group cursor-pointer" onClick={() => onUseTemplate(template)}>
                    <CardHeader>
                        <div className="flex justify-between items-start mb-2">
                            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                                <template.icon className="w-6 h-6 text-primary" />
                            </div>
                            <Badge variant="secondary" className="text-xs">{template.category}</Badge>
                        </div>
                        <CardTitle className="text-lg">{template.title}</CardTitle>
                        <CardDescription className="line-clamp-3 h-[4.5em]">{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <div className="flex flex-wrap gap-2">
                            {template.tags.map(tag => (
                                <span key={tag} className="text-[10px] bg-muted px-2 py-1 rounded-full text-muted-foreground border">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                        <Button className="w-full gap-2 group-hover:bg-primary group-hover:text-primary-foreground">
                            Use Template
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
};
