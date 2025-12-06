import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileText, Database, BarChart3, Clock, Mail, CheckCircle2, FlaskConical, Brain, AlertTriangle, FileCheck, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ReportBuilderProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onComplete: (reportConfig: any) => void;
    initialConfig?: any;
}

export const ReportBuilder = ({ open, onOpenChange, onComplete, initialConfig }: ReportBuilderProps) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
    const [datasets, setDatasets] = useState<any[]>([]);

    const defaultConfig = {
        title: "",
        description: "",
        type: "executive",
        format: "pdf",
        dataSourceId: "",
        modules: {
            summary: true,
            stats: true,
            charts: true,
            anomalies: false,
            recommendations: true,
            auditLog: false
        },
        schedule: {
            enabled: false,
            frequency: "weekly",
            recipients: ""
        }
    };

    // Form State
    const [config, setConfig] = useState(defaultConfig);

    useEffect(() => {
        if (open) {
            fetchDatasets();
            setStep(1);
            if (initialConfig) {
                setConfig({ ...defaultConfig, ...initialConfig });
            } else {
                setConfig(defaultConfig);
            }
        }
    }, [open, initialConfig]);

    const fetchDatasets = async () => {
        setLoading(true);
        try {
            const { data } = await supabase
                .from('datasets')
                .select('id, name, file_name, row_count')
                .order('created_at', { ascending: false })
                .limit(10);
            setDatasets(data || []);
        } catch (error) {
            console.error("Error loading datasets", error);
        } finally {
            setLoading(false);
        }
    };

    const updateModule = (key: keyof typeof config.modules, checked: boolean) => {
        setConfig(prev => ({
            ...prev,
            modules: { ...prev.modules, [key]: checked }
        }));
    };

    const generateDescription = async () => {
        setIsGeneratingDescription(true);
        try {
            // Get active modules
            const activeModules = Object.entries(config.modules)
                .filter(([_, enabled]) => enabled)
                .map(([key]) => key);

            const response = await fetch('http://localhost:8002/api/ml/generate-description', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: config.title || "Untitled Report",
                    report_type: config.type,
                    modules: activeModules
                })
            });

            const data = await response.json();
            if (data.success && data.description) {
                setConfig(prev => ({ ...prev, description: data.description }));
            }
        } catch (error) {
            console.error("Failed to generate description:", error);
        } finally {
            setIsGeneratingDescription(false);
        }
    };

    const handleNext = () => {
        if (step < 4) setStep(step + 1);
        else {
            onComplete(config);
            onOpenChange(false);
        }
    };

    const steps = [
        { num: 1, title: "Configuration", icon: FileText },
        { num: 2, title: "Data Source", icon: Database },
        { num: 3, title: "Content Modules", icon: BarChart3 },
        { num: 4, title: "Distribution", icon: Mail },
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 pb-2 border-b">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-xl">Create Enterprise Report</DialogTitle>
                        <Badge variant="outline" className="gap-1">
                            <FileCheck className="w-3 h-3 text-green-500" />
                            ISO/IEC 17025 Compliant
                        </Badge>
                    </div>
                    <DialogDescription>
                        Configure a professional, audit-ready report for your stakeholders.
                    </DialogDescription>

                    {/* Progress Steps */}
                    <div className="flex items-center justify-between mt-6 px-4">
                        {steps.map((s) => (
                            <div key={s.num} className="flex flex-col items-center gap-2 relative z-10">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${step >= s.num ? "bg-primary border-primary text-primary-foreground" : "bg-card border-muted-foreground text-muted-foreground"
                                        }`}
                                >
                                    <s.icon className="w-5 h-5" />
                                </div>
                                <span className={`text-xs font-medium ${step >= s.num ? "text-primary" : "text-muted-foreground"}`}>
                                    {s.title}
                                </span>
                            </div>
                        ))}
                        {/* Progress Bar Line */}
                        <div className="absolute left-[60px] right-[60px] top-[105px] h-0.5 bg-muted -z-0">
                            <div
                                className="h-full bg-primary transition-all duration-300"
                                style={{ width: `${((step - 1) / 3) * 100}%` }}
                            />
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-8">
                    {step === 1 && (
                        <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in slide-in-from-right-4">
                            <div className="space-y-2">
                                <Label>Report Title</Label>
                                <Input
                                    value={config.title}
                                    onChange={(e) => setConfig({ ...config, title: e.target.value })}
                                    placeholder="e.g., Q1 2025 Clinical Trial Summary"
                                    className="text-lg"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label>Description</Label>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-xs gap-1 text-primary hover:text-primary hover:bg-primary/10"
                                        disabled={isGeneratingDescription}
                                        onClick={generateDescription}
                                    >
                                        {isGeneratingDescription ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                            <Brain className="w-3 h-3" />
                                        )}
                                        {isGeneratingDescription ? "Generating..." : "Auto-Generate with AI"}
                                    </Button>
                                </div>
                                <Textarea
                                    value={config.description}
                                    onChange={(e) => setConfig({ ...config, description: e.target.value })}
                                    placeholder="Executive summary of the findings..."
                                    rows={4}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Report Type</Label>
                                    <Select
                                        value={config.type}
                                        onValueChange={(val) => setConfig({ ...config, type: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="executive">📊 Executive Summary</SelectItem>
                                            <SelectItem value="technical">🔧 Technical Analysis</SelectItem>
                                            <SelectItem value="compliance">🛡️ Compliance Audit</SelectItem>
                                            <SelectItem value="performance">⚡ Performance Review</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Export Format</Label>
                                    <Select
                                        value={config.format}
                                        onValueChange={(val) => setConfig({ ...config, format: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pdf">PDF Document</SelectItem>
                                            <SelectItem value="docx">Word Document</SelectItem>
                                            <SelectItem value="html">Interactive HTML</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in slide-in-from-right-4">
                            <div className="space-y-4">
                                <Label className="text-base">Select Primary Data Source</Label>
                                {loading ? (
                                    <div className="text-center py-8">Loading available datasets...</div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-3">
                                        {datasets.map((ds) => (
                                            <Card
                                                key={ds.id}
                                                className={`p-4 cursor-pointer hover:border-primary transition-all flex items-center gap-4 ${config.dataSourceId === ds.id ? "border-primary bg-primary/5 ring-1 ring-primary" : ""
                                                    }`}
                                                onClick={() => setConfig({ ...config, dataSourceId: ds.id })}
                                            >
                                                <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                                    <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-medium">{ds.name}</h4>
                                                    <p className="text-sm text-muted-foreground">{ds.file_name} • {ds.row_count?.toLocaleString() || 0} rows</p>
                                                </div>
                                                {config.dataSourceId === ds.id && (
                                                    <CheckCircle2 className="h-5 w-5 text-primary" />
                                                )}
                                            </Card>
                                        ))}
                                        {datasets.length === 0 && (
                                            <div className="text-center p-8 border border-dashed rounded-lg bg-muted/50">
                                                <Database className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                                <p>No datasets found. Please upload data first.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in slide-in-from-right-4">
                            <Label className="text-base mb-4 block">Select Content Modules</Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { id: "summary", label: "Executive Summary", icon: FileText, desc: "High-level overview of findings" },
                                    { id: "stats", label: "Statistical Analysis", icon: BarChart3, desc: "Key metrics, mean, median, distributions" },
                                    { id: "charts", label: "Visualizations", icon: FlaskConical, desc: "Generated charts and graphs" },
                                    { id: "anomalies", label: "Anomaly Detection", icon: AlertTriangle, desc: "Outliers and data quality issues" },
                                    { id: "recommendations", label: "AI Recommendations", icon: Brain, desc: "Next steps suggested by LabIQ AI" },
                                    { id: "auditLog", label: "Audit Log", icon: Clock, desc: "Full history of data changes for compliance" },
                                ].map((mod) => (
                                    <div
                                        key={mod.id}
                                        className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer hover:bg-muted/50 transition-all ${config.modules[mod.id as keyof typeof config.modules] ? "border-primary bg-primary/5" : ""
                                            }`}
                                        onClick={() => updateModule(mod.id as any, !config.modules[mod.id as keyof typeof config.modules])}
                                    >
                                        <Checkbox
                                            checked={config.modules[mod.id as keyof typeof config.modules]}
                                            className="mt-1"
                                        />
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <mod.icon className="w-4 h-4 text-muted-foreground" />
                                                <span className="font-medium">{mod.label}</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">{mod.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in slide-in-from-right-4">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                            <Clock className="h-5 w-5 text-green-600" />
                                        </div>
                                        <div>
                                            <Label className="text-base">Schedule Automation</Label>
                                            <p className="text-sm text-muted-foreground">Automatically generate and email this report</p>
                                        </div>
                                    </div>
                                    <Checkbox
                                        checked={config.schedule.enabled}
                                        onCheckedChange={(c) => setConfig({ ...config, schedule: { ...config.schedule, enabled: !!c } })}
                                    />
                                </div>

                                {config.schedule.enabled && (
                                    <div className="pl-4 border-l-2 ml-4 space-y-4 animate-in slide-in-from-top-2">
                                        <div className="space-y-2">
                                            <Label>Frequency</Label>
                                            <Select
                                                value={config.schedule.frequency}
                                                onValueChange={(val) => setConfig({ ...config, schedule: { ...config.schedule, frequency: val } })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="daily">Daily (8:00 AM)</SelectItem>
                                                    <SelectItem value="weekly">Weekly (Monday)</SelectItem>
                                                    <SelectItem value="monthly">Monthly (1st day)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Recipients (Comma separated)</Label>
                                            <Input
                                                placeholder="stakeholders@company.com, management@company.com"
                                                value={config.schedule.recipients}
                                                onChange={(e) => setConfig({ ...config, schedule: { ...config.schedule, recipients: e.target.value } })}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex gap-3 text-sm text-blue-800 dark:text-blue-300">
                                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                                    <p>
                                        <strong>Ready to Generate:</strong> You are about to generate a <strong>{config.type}</strong> report
                                        {config.dataSourceId ? " based on the selected dataset" : ""} with
                                        <strong> {Object.values(config.modules).filter(Boolean).length} modules</strong> included.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="p-6 border-t bg-muted/20">
                    <Button variant="outline" onClick={() => step > 1 ? setStep(step - 1) : onOpenChange(false)}>
                        {step === 1 ? "Cancel" : "Back"}
                    </Button>
                    <Button
                        onClick={handleNext}
                        disabled={step === 2 && !config.dataSourceId}
                        className="w-32"
                    >
                        {step === 4 ? "Generate" : "Next"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
