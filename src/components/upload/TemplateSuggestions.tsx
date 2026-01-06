import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight, Lock, Info, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TemplateRecommendation } from "@/lib/types/templates";

interface TemplateSuggestionsProps {
    recommendations: TemplateRecommendation[];
    loading?: boolean;
    error?: string;
}

export const TemplateSuggestions = ({ recommendations, loading, error }: TemplateSuggestionsProps) => {
    const navigate = useNavigate();
    const { subscription } = useSubscription();

    if (loading) {
        return (
            <Card className="border-purple-500/20 bg-purple-500/5 p-4 mt-4">
                <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
                    <div>
                        <h3 className="font-semibold text-purple-900 dark:text-purple-100">
                            AI Recommendations
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Analyzing your dataset to suggest templates...
                        </p>
                    </div>
                </div>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="border-orange-500/20 bg-orange-500/5 p-4 mt-4">
                <div className="flex items-center gap-3">
                    <Info className="w-5 h-5 text-orange-500" />
                    <div>
                        <h3 className="font-semibold text-orange-900 dark:text-orange-100">
                            Template Suggestions
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {error}
                        </p>
                    </div>
                </div>
            </Card>
        );
    }

    if (!recommendations || recommendations.length === 0) return null;

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 0.8) return "bg-green-500";
        if (confidence >= 0.6) return "bg-blue-500";
        if (confidence >= 0.4) return "bg-yellow-500";
        return "bg-gray-500";
    };

    const getConfidenceBadge = (confidence: number) => {
        if (confidence >= 0.8) return { text: "High Match", variant: "default" as const };
        if (confidence >= 0.6) return { text: "Good Match", variant: "secondary" as const };
        return { text: "Possible Match", variant: "outline" as const };
    };

    return (
        <Card className="border-purple-500/20 bg-purple-500/5 p-4 mt-4">
            <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold text-purple-900 dark:text-purple-100">
                    AI Recommendations
                </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
                Based on your dataset analysis, these experiment templates might be useful:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recommendations.slice(0, 3).map((rec) => {
                    const template = TEMPLATE_DATA[rec.id];
                    if (!template) return null;

                    const isLocked = template.isPro && subscription?.tier === "free";
                    const confidenceBadge = getConfidenceBadge(rec.confidence);

                    return (
                        <div
                            key={rec.id}
                            className="flex flex-col gap-2 p-3 bg-background rounded-lg border hover:border-purple-500/50 transition-colors"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium">{template.name}</span>
                                        {template.isPro && <Badge variant="secondary" className="text-xs">Pro</Badge>}
                                    </div>
                                    <span className="text-xs text-muted-foreground capitalize">{template.type}</span>
                                </div>

                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0"
                                            title="Why this template?"
                                        >
                                            <Info className="w-3 h-3" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80">
                                        <div className="space-y-2">
                                            <h4 className="font-semibold text-sm">AI Analysis</h4>
                                            <p className="text-sm text-muted-foreground">
                                                {rec.reasoning}
                                            </p>
                                            <div className="flex items-center gap-2 pt-2 border-t">
                                                <span className="text-xs text-muted-foreground">Confidence:</span>
                                                <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className={`h-full ${getConfidenceColor(rec.confidence)} transition-all`}
                                                        style={{ width: `${rec.confidence * 100}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-medium">{Math.round(rec.confidence * 100)}%</span>
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="flex items-center gap-2">
                                <Badge variant={confidenceBadge.variant} className="text-xs">
                                    {confidenceBadge.text}
                                </Badge>
                                <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                                    <div
                                        className={`h-full ${getConfidenceColor(rec.confidence)} transition-all`}
                                        style={{ width: `${rec.confidence * 100}%` }}
                                    />
                                </div>
                            </div>

                            <Button
                                size="sm"
                                variant={isLocked ? "outline" : "default"}
                                className="gap-2 w-full"
                                onClick={() => navigate(`/experiments?template=${rec.id}`)}
                            >
                                {isLocked ? <Lock className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
                                {isLocked ? "Unlock" : "Use Template"}
                            </Button>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
};

// Export TEMPLATE_DATA for backward compatibility
export const TEMPLATE_DATA: Record<string, any> = {
    "clinical-trial": { name: "Clinical Trial Analysis", type: "Clinical", isPro: false },
    "diagnostic-validation": { name: "Diagnostic Test Validation", type: "Clinical", isPro: false },
    "cohort-study": { name: "Patient Cohort Study", type: "Research", isPro: false },
    "lab-qc": { name: "Laboratory Quality Control", type: "Lab", isPro: true },
    "biomarker-discovery": { name: "Biomarker Discovery", type: "Research", isPro: true },
    "drug-efficacy": { name: "Drug Efficacy Analysis", type: "Clinical", isPro: true },
    "epidemiology-survey": { name: "Epidemiological Survey", type: "Public Health", isPro: false },
    "case-control": { name: "Case-Control Study", type: "Research", isPro: false },
    "lab-results": { name: "Laboratory Results Analysis", type: "Lab", isPro: false },
    "vitals-monitoring": { name: "Vital Signs Monitoring", type: "Clinical", isPro: false },
};
