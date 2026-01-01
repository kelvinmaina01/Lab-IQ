/**
 * Presentation Generator - Main dialog for creating AI-powered presentations
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Sparkles, Check, BarChart3, FileText, TrendingUp } from 'lucide-react';
import { PinnedDashboard } from '@/lib/services/dashboardService';
import {
    presentationService,
    PRESENTATION_THEMES,
    PresentationTheme,
    PresentationTemplate,
    Presentation
} from '@/lib/services/presentationService';
import { toast } from 'sonner';

interface PresentationGeneratorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    dashboards: PinnedDashboard[];
    onPresentationCreated?: (presentation: Presentation) => void;
}

const TEMPLATE_OPTIONS: Array<{
    value: PresentationTemplate;
    label: string;
    description: string;
    icon: React.ReactNode;
}> = [
        {
            value: 'executive',
            label: 'Executive Summary',
            description: 'High-level overview for stakeholders',
            icon: <TrendingUp className="h-5 w-5" />
        },
        {
            value: 'technical',
            label: 'Technical Deep Dive',
            description: 'Detailed analysis with methodology',
            icon: <BarChart3 className="h-5 w-5" />
        },
        {
            value: 'progress',
            label: 'Progress Report',
            description: 'Time-based trends and updates',
            icon: <FileText className="h-5 w-5" />
        }
    ];

export function PresentationGenerator({
    open,
    onOpenChange,
    dashboards,
    onPresentationCreated
}: PresentationGeneratorProps) {
    const [selectedDashboards, setSelectedDashboards] = useState<string[]>([]);
    const [title, setTitle] = useState('');
    const [template, setTemplate] = useState<PresentationTemplate>('executive');
    const [theme, setTheme] = useState<PresentationTheme>('modern');
    const [isGenerating, setIsGenerating] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [datasetName, setDatasetName] = useState<string>('your analysis');
    const [autoSelected, setAutoSelected] = useState(false);

    // AI-Driven: Auto-select dashboards on open using context
    useEffect(() => {
        if (open && dashboards.length > 0) {
            // AI intelligently selects relevant dashboards
            // Priority: Dataset match > AI insights > Recently created
            const sortedByRelevance = [...dashboards].sort((a, b) => {
                // Prioritize AI insights and dataset analysis
                const sourceWeight = (d: typeof a) => {
                    if (d.source === 'ai_insights') return 3;
                    if (d.source === 'dataset_analysis') return 2;
                    return 1;
                };

                const weightA = sourceWeight(a);
                const weightB = sourceWeight(b);

                if (weightA !== weightB) return weightB - weightA;

                // Then by recency
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });

            // Select top most relevant dashboards (limit to 12 for optimal presentation)
            const autoSelectedIds = sortedByRelevance.slice(0, 12).map(d => d.id);
            setSelectedDashboards(autoSelectedIds);
            setAutoSelected(true);

            // Detect dataset name from dashboards
            const firstDashboard = sortedByRelevance[0];
            if (firstDashboard?.metadata?.dataset_name) {
                setDatasetName(firstDashboard.metadata.dataset_name);
            }

            toast.success(`AI selected ${autoSelectedIds.length} relevant insights`, {
                description: 'Based on your recent analysis context'
            });
        }
    }, [open, dashboards]);

    const handleGenerate = async () => {
        if (selectedDashboards.length === 0) {
            toast.error('No dashboards selected. Please run an analysis first.');
            return;
        }

        setIsGenerating(true);
        try {
            const presentation = await presentationService.generatePresentation({
                dashboardIds: selectedDashboards,
                template,
                theme,
                title: title || undefined,
                includeInsights: true,
                datasetId: dashboards[0]?.metadata?.dataset_id
            });

            if (presentation) {
                toast.success('Presentation generated successfully!', {
                    description: `Created ${presentation.slides.length} slides from AI-selected insights`
                });
                onPresentationCreated?.(presentation);
                onOpenChange(false);

                // Reset form
                setTitle('');
                setSelectedDashboards([]);
                setAutoSelected(false);
            } else {
                toast.error('Failed to generate presentation');
            }
        } catch (error) {
            console.error('Error generating presentation:', error);
            toast.error('An error occurred while generating the presentation');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl">
                        <Sparkles className="h-6 w-6 text-primary" />
                        Generate Data Insights Presentation
                    </DialogTitle>
                    <DialogDescription>
                        AI automatically selects the most relevant insights from your analysis context
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 pr-4">
                    <div className="space-y-6 py-4">
                        {/* Title Input */}
                        <div className="space-y-2">
                            <Label htmlFor="title">Presentation Title (Optional)</Label>
                            <Input
                                id="title"
                                placeholder="e.g., Q4 Health Data Analysis"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Leave empty for auto-generated title
                            </p>
                        </div>

                        {/* AI-Selected Dashboards - Context Summary */}
                        <div className="space-y-3">
                            <Label>AI-Selected Insights</Label>
                            <Card className="border-2 border-primary/20 bg-primary/5">
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-lg bg-primary/10">
                                            <Sparkles className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-foreground">
                                                {selectedDashboards.length} insights automatically selected
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Based on {datasetName} context · AI prioritized by relevance
                                            </p>
                                            <Button
                                                variant="link"
                                                size="sm"
                                                className="h-auto p-0 mt-2 text-xs"
                                                onClick={() => setShowDetails(!showDetails)}
                                            >
                                                {showDetails ? 'Hide' : 'Show'} selection details
                                            </Button>
                                        </div>
                                        <Badge variant="secondary" className="text-xs">
                                            Auto-selected
                                        </Badge>
                                    </div>

                                    {/* Collapsible Details */}
                                    {showDetails && (
                                        <div className="mt-4 pt-4 border-t space-y-2 max-h-48 overflow-y-auto">
                                            {dashboards
                                                .filter(d => selectedDashboards.includes(d.id))
                                                .map(dashboard => (
                                                    <div
                                                        key={dashboard.id}
                                                        className="flex items-center gap-2 p-2 rounded bg-background/50 text-xs"
                                                    >
                                                        <Check className="h-3 w-3 text-primary flex-shrink-0" />
                                                        <span className="flex-1 truncate font-medium">
                                                            {dashboard.title}
                                                        </span>
                                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                                            {dashboard.type}
                                                        </Badge>
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                            <p className="text-xs text-muted-foreground">
                                💡 The AI selected dashboards from your recent analysis, prioritizing insights,
                                dataset matches, and temporal relevance.
                            </p>
                        </div>

                        {/* Template Selection */}
                        <div className="space-y-3">
                            <Label>Presentation Template</Label>
                            <RadioGroup value={template} onValueChange={(v) => setTemplate(v as PresentationTemplate)}>
                                <div className="grid gap-3">
                                    {TEMPLATE_OPTIONS.map(option => (
                                        <Card
                                            key={option.value}
                                            className={`cursor-pointer transition-all ${template === option.value ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                                                }`}
                                            onClick={() => setTemplate(option.value)}
                                        >
                                            <CardContent className="p-4 flex items-start gap-3">
                                                <RadioGroupItem value={option.value} id={option.value} />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        {option.icon}
                                                        <Label htmlFor={option.value} className="cursor-pointer font-semibold">
                                                            {option.label}
                                                        </Label>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </RadioGroup>
                        </div>

                        {/* Theme Selection */}
                        <div className="space-y-3">
                            <Label>Select Theme</Label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {Object.values(PRESENTATION_THEMES).map(themeConfig => (
                                    <Card
                                        key={themeConfig.id}
                                        className={`cursor-pointer transition-all ${theme === themeConfig.id ? 'ring-2 ring-primary' : 'hover:shadow-md'
                                            }`}
                                        onClick={() => setTheme(themeConfig.id)}
                                    >
                                        <CardContent className="p-4">
                                            {/* Theme Preview */}
                                            <div
                                                className="h-20 rounded-lg mb-3 flex items-center justify-center"
                                                style={{
                                                    background: themeConfig.colors.headerBg,
                                                    color: themeConfig.colors.background
                                                }}
                                            >
                                                <BarChart3 className="h-8 w-8" />
                                            </div>
                                            <div className="text-center">
                                                <p className="font-semibold text-sm">{themeConfig.name}</p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {themeConfig.description}
                                                </p>
                                            </div>
                                            {theme === themeConfig.id && (
                                                <div className="mt-3 flex justify-center">
                                                    <Badge variant="default" className="text-xs">
                                                        <Check className="h-3 w-3 mr-1" />
                                                        Selected
                                                    </Badge>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isGenerating}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleGenerate}
                        disabled={isGenerating || selectedDashboards.length === 0}
                        className="gap-2"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-4 w-4" />
                                Generate Presentation
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
