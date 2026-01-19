import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    Database,
    FileText,
    AlertTriangle,
    CheckCircle2,
    BarChart3,
    Table as TableIcon,
    Brain,
    Dna,
    FlaskConical,
    Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { DataExplorer } from "@/components/data/DataExplorer";
import { QuickActionsPanel } from "@/components/upload/QuickActionsPanel";
import { AutoMLPipelineDashboard } from "@/components/ml/AutoMLPipelineDashboard";
import { datasetService } from "@/lib/services/datasetService";
import {
    History,
    GitBranch,
    ShieldCheck,
    Activity,
    Lock,
    Eye,
    Tag,
    Info
} from "lucide-react";

const DatasetDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [dataset, setDataset] = useState<any>(null);
    const [quality, setQuality] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [analysisResults, setAnalysisResults] = useState<any>(null);
    const [analysisLoading, setAnalysisLoading] = useState(false);
    const [rows, setRows] = useState<any[]>([]);
    const [columns, setColumns] = useState<any[]>([]);

    // V2 Data State
    const [versions, setVersions] = useState<any[]>([]);
    const [lineage, setLineage] = useState<any[]>([]);
    const [qualityChecks, setQualityChecks] = useState<any[]>([]);
    const [anonymizationLogs, setAnonymizationLogs] = useState<any[]>([]);

    useEffect(() => {
        if (id) {
            fetchDataset();
        }
    }, [id]);

    const fetchDataset = async () => {
        try {
            setLoading(true);

            // Fetch dataset
            const { data: datasetData, error: datasetError } = await supabase
                .from('datasets')
                .select('*')
                .eq('id', id)
                .single();

            if (datasetError) throw datasetError;

            setDataset(datasetData);

            // Fetch V2 metadata in parallel
            const [versionsData, lineageData, checksData, logsData] = await Promise.all([
                datasetService.getVersions(id!),
                datasetService.getLineage(id!),
                datasetService.getQualityChecks(id!),
                datasetService.getAnonymizationLogs(id!)
            ]);

            setVersions(versionsData);
            setLineage(lineageData);
            setQualityChecks(checksData);
            setAnonymizationLogs(logsData);

            // Fetch quality scores (Priority: quality_score column, then metadata)
            if (datasetData?.quality_score !== undefined) {
                setQuality({
                    overall_score: Math.round(datasetData.quality_score),
                    ...(datasetData.quality_breakdown || {})
                });
            } else if (datasetData?.metadata?.quality) {
                setQuality(datasetData.metadata.quality);
            }

            // Fetch analysis results if available
            if (datasetData?.metadata?.analysis) {
                setAnalysisResults(datasetData.metadata.analysis);
            }

            // Set preview data (rows and columns)
            if (datasetData?.preview_data) {
                setRows(datasetData.preview_data);
            }

            // Handle columns - support both schema.columns and preview_data generation
            if (datasetData?.schema?.columns && Array.isArray(datasetData.schema.columns)) {
                setColumns(datasetData.schema.columns);
            } else if (datasetData?.columns_info) {
                // If we have columns_info (simple Record<string, string>)
                const generatedColumns = Object.entries(datasetData.columns_info).map(([key, type], index) => ({
                    id: `col_${index}`,
                    column_name: key,
                    name: key,
                    data_type: type,
                    type: type,
                    unique_values_count: 0,
                    nullable: true
                }));
                setColumns(generatedColumns);
            } else if (datasetData?.preview_data && datasetData.preview_data.length > 0) {
                // Generate columns from first row if schema not available
                const firstRow = datasetData.preview_data[0];
                const generatedColumns = Object.keys(firstRow).map((key, index) => ({
                    id: `col_${index}`,
                    column_name: key,
                    name: key,
                    data_type: typeof firstRow[key],
                    type: typeof firstRow[key],
                    unique_values_count: 0,
                    nullable: true
                }));
                setColumns(generatedColumns);
            }
        } catch (error) {
            console.error('Error fetching dataset:', error);
            toast.error('Failed to load dataset');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this dataset?')) return;

        try {
            const { error } = await supabase
                .from('datasets')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast.success('Dataset deleted successfully');
            navigate('/datasets');
        } catch (error) {
            console.error('Error deleting dataset:', error);
            toast.error('Failed to delete dataset');
        }
    };

    const handleDownload = () => {
        if (dataset?.file_path) {
            window.open(dataset.file_path, '_blank');
        } else {
            toast.error('File path not available');
        }
    };

    const runAutoAnalysis = async () => {
        if (!id) return;

        setAnalysisLoading(true);
        try {
            const results = await datasetService.runAutoAnalysis(id);
            setAnalysisResults(results);
            toast.success('Auto Analysis Complete!');
        } catch (err) {
            console.error("Manual Auto Analysis failed:", err);
            toast.error('Failed to run analysis. Check backend status.');
        } finally {
            setAnalysisLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="h-12 w-12 bg-primary/20 rounded-full animate-bounce" />
                    <p className="text-muted-foreground">Loading dataset...</p>
                </div>
            </div>
        );
    }

    if (!dataset) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
                <h1 className="text-2xl font-bold">Dataset Not Found</h1>
                <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
            </div>
        );
    }

    return (
        <MainLayout>
            <div className="space-y-8 p-4 md:p-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                            <Button variant="ghost" size="sm" className="p-0 h-auto hover:bg-transparent" onClick={() => navigate('/dashboard')}>
                                <ArrowLeft className="h-4 w-4 mr-1" />
                                Back to Dashboard
                            </Button>
                            <span>/</span>
                            <span>Datasets</span>
                        </div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <Database className="h-8 w-8 text-primary" />
                            {dataset.name}
                        </h1>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <FileText className="h-4 w-4" />
                                {dataset.file_name}
                            </span>
                            <span>•</span>
                            <span>{(dataset.file_size / 1024 / 1024).toFixed(2)} MB</span>
                            <span>•</span>
                            <span>v{dataset.version || 1}</span>
                            <span>•</span>
                            <div className="flex items-center gap-2">
                                {dataset.domain && (
                                    <Badge variant="secondary" className="px-2 py-0 h-5 text-[10px] uppercase">
                                        {dataset.domain}
                                    </Badge>
                                )}
                                {dataset.is_anonymized && (
                                    <Badge variant="outline" className="px-2 py-0 h-5 text-[10px] bg-blue-50 text-blue-600 border-blue-200 uppercase">
                                        <Lock className="w-3 h-3 mr-1" />
                                        PHI-Safe
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleDelete} className="text-destructive hover:bg-destructive/10 border-destructive/50">
                            Delete
                        </Button>
                        <Button variant="outline" onClick={handleDownload}>
                            Download CSV
                        </Button>
                    </div>
                </div>

                {/* Quality Score Cards */}
                {quality && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card className="bg-card/50 backdrop-blur">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Overall Quality</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold flex items-center gap-2">
                                    {quality.overall_score}%
                                    {quality.overall_score >= 80 ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    ) : (
                                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                                    )}
                                </div>
                                <div className="h-1 w-full bg-secondary mt-2 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${quality.overall_score >= 80 ? 'bg-green-500' : 'bg-yellow-500'}`}
                                        style={{ width: `${quality.overall_score}%` }}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Completeness</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{quality.completeness_score}%</div>
                                <p className="text-xs text-muted-foreground">{quality.missing_values_count} missing values</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Consistency</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{quality.consistency_score}%</div>
                                <p className="text-xs text-muted-foreground">Type mismatches check</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Uniqueness</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{quality.accuracy_score}%</div>
                                <p className="text-xs text-muted-foreground">{quality.duplicate_rows_count} duplicates found</p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Quick Actions Panel */}
                <QuickActionsPanel
                    datasetId={id!}
                    datasetName={dataset.name}
                />

                {/* Main Content Tabs */}
                <Tabs defaultValue="data" className="w-full">
                    <TabsList>
                        <TabsTrigger value="data" className="gap-2">
                            <TableIcon className="h-4 w-4" />
                            Data Preview
                        </TabsTrigger>
                        <TabsTrigger value="schema" className="gap-2">
                            <Database className="h-4 w-4" />
                            Schema & Stats
                        </TabsTrigger>
                        <TabsTrigger value="analysis" className="gap-2">
                            <BarChart3 className="h-4 w-4" />
                            Analysis
                        </TabsTrigger>
                        <TabsTrigger value="automl" className="gap-2">
                            <Sparkles className="h-4 w-4" />
                            AutoML
                        </TabsTrigger>
                        <TabsTrigger value="versions" className="gap-2">
                            <History className="h-4 w-4" />
                            History
                        </TabsTrigger>
                        <TabsTrigger value="lineage" className="gap-2">
                            <GitBranch className="h-4 w-4" />
                            Lineage
                        </TabsTrigger>
                        <TabsTrigger value="governance" className="gap-2">
                            <ShieldCheck className="h-4 w-4" />
                            Governance
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="data" className="mt-6">
                        <Card className="border-none shadow-none bg-transparent">
                            <CardHeader className="px-0 pt-0">
                                <CardTitle>Data Explorer</CardTitle>
                                <CardDescription>
                                    Interactive view of your dataset. Filter, sort, and analyze distributions.
                                    <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                        Previewing {rows.length.toLocaleString()} rows
                                    </span>
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="px-0">
                                <DataExplorer
                                    data={rows}
                                    columns={columns}
                                    loading={loading}
                                    fileName={dataset.file_name}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="schema" className="mt-6">
                        {columns.length === 0 ? (
                            <Card className="p-12 text-center">
                                <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                <h3 className="text-lg font-medium mb-2">No Schema Available</h3>
                                <p className="text-sm text-muted-foreground">
                                    The dataset schema could not be loaded. Try re-uploading the file.
                                </p>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {columns.map((col, index) => (
                                    <Card key={col.id || `col_${index}`}>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-base font-medium flex justify-between">
                                                {col.column_name || col.name}
                                                <Badge>{col.data_type || col.type}</Badge>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="text-sm space-y-2">
                                            <div className="flex justify-between py-1 border-b">
                                                <span className="text-muted-foreground">Unique Values</span>
                                                <span>{col.unique_values_count}</span>
                                            </div>
                                            <div className="flex justify-between py-1 border-b">
                                                <span className="text-muted-foreground">Nullable</span>
                                                <span>{col.nullable ? 'Yes' : 'No'}</span>
                                            </div>
                                            {col.stats && (
                                                <>
                                                    {col.stats.min !== undefined && (
                                                        <div className="flex justify-between py-1 border-b">
                                                            <span className="text-muted-foreground">Min</span>
                                                            <span>{Number(col.stats.min).toFixed(2)}</span>
                                                        </div>
                                                    )}
                                                    {col.stats.max !== undefined && (
                                                        <div className="flex justify-between py-1 border-b">
                                                            <span className="text-muted-foreground">Max</span>
                                                            <span>{Number(col.stats.max).toFixed(2)}</span>
                                                        </div>
                                                    )}
                                                    {col.stats.mean !== undefined && (
                                                        <div className="flex justify-between py-1 border-b">
                                                            <span className="text-muted-foreground">Mean</span>
                                                            <span>{Number(col.stats.mean).toFixed(2)}</span>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="analysis" className="mt-6">
                        {analysisLoading ? (
                            <Card>
                                <CardContent className="p-12">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="relative">
                                            <Brain className="h-16 w-16 text-primary animate-pulse" />
                                            <div className="absolute -top-1 -right-1">
                                                <div className="h-4 w-4 bg-primary rounded-full animate-ping" />
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <h3 className="text-lg font-semibold mb-2">AI Analysis in Progress</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Analyzing {dataset.row_count.toLocaleString()} rows across {dataset.column_count} columns...
                                            </p>
                                            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                                                <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : analysisResults ? (
                            <div className="space-y-6">
                                {/* Domain Analysis Card */}
                                {analysisResults.domain_analysis?.domain_detected && analysisResults.domain_analysis.domain_detected !== 'general' && (
                                    <Card className="border-primary/20 bg-primary/5">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                {analysisResults.domain_analysis.domain_detected === 'biotech' ? <Dna className="h-5 w-5 text-primary" /> : <FlaskConical className="h-5 w-5 text-primary" />}
                                                Domain Analysis: {analysisResults.domain_analysis.domain_detected.charAt(0).toUpperCase() + analysisResults.domain_analysis.domain_detected.slice(1)}
                                            </CardTitle>
                                            <CardDescription>
                                                Specialized analysis with {((analysisResults.domain_analysis.confidence || 0) * 100).toFixed(0)}% confidence
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {Object.entries(analysisResults.domain_analysis.analysis || {}).map(([col, data]: [string, any]) => (
                                                    <div key={col} className="p-3 bg-background/50 rounded-lg border">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <strong className="text-sm font-medium">{col}</strong>
                                                            <Badge variant="outline" className="text-[10px]">{data.type || 'Structure'}</Badge>
                                                        </div>
                                                        <div className="space-y-1.5 text-xs">
                                                            {data.avg_length && (
                                                                <div className="flex justify-between">
                                                                    <span className="text-muted-foreground">Avg Length:</span>
                                                                    <span className="font-mono">{data.avg_length.toFixed(1)}</span>
                                                                </div>
                                                            )}
                                                            {data.avg_gc_content && (
                                                                <div className="flex justify-between">
                                                                    <span className="text-muted-foreground">GC Content:</span>
                                                                    <span className="font-mono">{data.avg_gc_content.toFixed(1)}%</span>
                                                                </div>
                                                            )}
                                                            {data.properties?.avg_molecular_weight && (
                                                                <div className="flex justify-between">
                                                                    <span className="text-muted-foreground">Avg MW:</span>
                                                                    <span className="font-mono">{data.properties.avg_molecular_weight.toFixed(1)}</span>
                                                                </div>
                                                            )}
                                                            {data.properties?.avg_logp && (
                                                                <div className="flex justify-between">
                                                                    <span className="text-muted-foreground">Avg LogP:</span>
                                                                    <span className="font-mono">{data.properties.avg_logp.toFixed(2)}</span>
                                                                </div>
                                                            )}
                                                            {data.drug_likeness && (
                                                                <div className="flex justify-between">
                                                                    <span className="text-muted-foreground">Rule of 5 Pass:</span>
                                                                    <span className="font-mono text-green-600">{data.drug_likeness.lipinski_rule_of_5_pass_rate?.toFixed(0)}%</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Summary Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-sm font-medium text-muted-foreground">Key Insights</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-3xl font-bold">{analysisResults.insights?.length || 0}</div>
                                            <p className="text-xs text-muted-foreground mt-1">Patterns detected</p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-sm font-medium text-muted-foreground">Correlations</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-3xl font-bold">{analysisResults.correlations?.length || 0}</div>
                                            <p className="text-xs text-muted-foreground mt-1">Strong relationships</p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-sm font-medium text-muted-foreground">Recommendations</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-3xl font-bold">{analysisResults.recommendations?.length || 0}</div>
                                            <p className="text-xs text-muted-foreground mt-1">Action items</p>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* AI Insights */}
                                {analysisResults.insights && analysisResults.insights.length > 0 && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Brain className="h-5 w-5 text-primary" />
                                                AI-Generated Insights
                                            </CardTitle>
                                            <CardDescription>Key patterns and observations from your data</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                {analysisResults.insights.map((insight: string, idx: number) => (
                                                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                                                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                                        <p className="text-sm">{insight}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Correlations */}
                                {analysisResults.correlations && analysisResults.correlations.length > 0 && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <BarChart3 className="h-5 w-5 text-primary" />
                                                Strong Correlations
                                            </CardTitle>
                                            <CardDescription>Relationships between variables</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-2">
                                                {analysisResults.correlations.map((corr: any, idx: number) => (
                                                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg border">
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium">
                                                                {corr.column1} ↔ {corr.column2}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground mt-1">{corr.interpretation}</p>
                                                        </div>
                                                        <Badge variant={corr.strength > 0.7 ? "default" : "secondary"}>
                                                            {(corr.strength * 100).toFixed(0)}%
                                                        </Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Recommendations */}
                                {analysisResults.recommendations && analysisResults.recommendations.length > 0 && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <AlertTriangle className="h-5 w-5 text-primary" />
                                                Recommendations
                                            </CardTitle>
                                            <CardDescription>Suggested next steps for your analysis</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                {analysisResults.recommendations.map((rec: string, idx: number) => (
                                                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                                                        <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                                            <span className="text-xs font-semibold text-primary">{idx + 1}</span>
                                                        </div>
                                                        <p className="text-sm">{rec}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Re-run Button */}
                                <div className="flex justify-center">
                                    <Button variant="outline" onClick={runAutoAnalysis}>
                                        <Brain className="h-4 w-4 mr-2" />
                                        Re-run Analysis
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg border-dashed">
                                <Brain className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium">Advanced Analysis</h3>
                                <p className="text-muted-foreground max-w-md mt-2">
                                    Let AI analyze your data to discover patterns, correlations, and insights automatically.
                                </p>
                                <Button className="mt-6 gap-2" onClick={runAutoAnalysis}>
                                    <Brain className="h-4 w-4" />
                                    Run Auto-Analysis
                                </Button>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="automl" className="mt-6">
                        <AutoMLPipelineDashboard
                            datasetId={id!}
                            data={rows}
                            onComplete={(result: any) => {
                                toast.success(`AutoML Complete: Best model is ${result.summary.model_training_summary.best_model} with ${(result.summary.model_training_summary.best_score * 100).toFixed(1)}% score`);
                            }}
                            onError={(error: any) => {
                                toast.error(`AutoML Error: ${error}`);
                            }}
                        />
                    </TabsContent>

                    <TabsContent value="versions" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <History className="h-5 w-5 text-primary" />
                                    Version History
                                </CardTitle>
                                <CardDescription>Track changes and snapshots of this dataset</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {versions.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            No version history recorded yet.
                                        </div>
                                    ) : (
                                        versions.map((v, idx) => (
                                            <div key={v.id} className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                                    {v.version}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="font-semibold">{v.change_summary || (idx === versions.length - 1 ? 'Initial Upload' : 'Update')}</h4>
                                                        <span className="text-xs text-muted-foreground">{new Date(v.created_at).toLocaleString()}</span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        Rows: {v.snapshot_row_count} • Size: {(v.snapshot_size_bytes / 1024 / 1024).toFixed(2)} MB
                                                    </p>
                                                    <div className="flex gap-2 mt-2">
                                                        <Badge variant="outline" className="text-[10px]">{v.change_type}</Badge>
                                                        {v.id === dataset.latest_version_id && <Badge className="text-[10px]">Current</Badge>}
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="sm">Restore</Button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="lineage" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <GitBranch className="h-5 w-5 text-primary" />
                                    Data Provenance & Lineage
                                </CardTitle>
                                <CardDescription>Track the origin and dependencies of this data</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    <div className="p-4 rounded-lg border border-dashed text-center bg-muted/30">
                                        <p className="text-sm text-muted-foreground mb-4">Lineage Visualization coming soon. Listed below are the direct connections.</p>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Sources & Destinations</h4>
                                        {lineage.length === 0 ? (
                                            <div className="p-4 rounded-lg border bg-card flex items-center gap-3">
                                                <Info className="h-5 w-5 text-muted-foreground" />
                                                <div className="text-sm">
                                                    This dataset was uploaded directly via <strong>{dataset.source_type || 'Manual Upload'}</strong>.
                                                </div>
                                            </div>
                                        ) : (
                                            lineage.map((item) => (
                                                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded bg-secondary flex items-center justify-center">
                                                            {item.source_type === 'dataset' ? <Database className="h-4 w-4" /> : <Brain className="h-4 w-4" />}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium">{item.source_name} → {item.target_name}</div>
                                                            <div className="text-xs text-muted-foreground">{item.transformation_type}</div>
                                                        </div>
                                                    </div>
                                                    <Badge variant="outline">{new Date(item.created_at).toLocaleDateString()}</Badge>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="governance" className="mt-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="md:col-span-2">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <ShieldCheck className="h-5 w-5 text-primary" />
                                        Encryption & Anonymization Audit
                                    </CardTitle>
                                    <CardDescription>Security status and transformation history</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 rounded-lg border bg-blue-50/30 border-blue-100">
                                            <div className="flex items-center gap-3">
                                                <Lock className="h-5 w-5 text-blue-600" />
                                                <div>
                                                    <div className="text-sm font-semibold text-blue-900">Anonymization Status</div>
                                                    <div className="text-xs text-blue-700">{dataset.is_anonymized ? 'Fully Processed' : 'Raw Data (Action Required for Compliance)'}</div>
                                                </div>
                                            </div>
                                            <Badge variant={dataset.is_anonymized ? "default" : "destructive"}>
                                                {dataset.is_anonymized ? 'Protected' : 'Pending'}
                                            </Badge>
                                        </div>

                                        <div className="space-y-3">
                                            <h4 className="text-xs font-semibold uppercase text-muted-foreground">Transformation Logs</h4>
                                            {anonymizationLogs.length === 0 ? (
                                                <p className="text-sm text-muted-foreground italic">No anonymization runs recorded.</p>
                                            ) : (
                                                anonymizationLogs.map((log) => (
                                                    <div key={log.id} className="p-3 rounded-lg border text-sm flex justify-between items-center">
                                                        <div>
                                                            <div className="font-medium">{log.method}</div>
                                                            <div className="text-xs text-muted-foreground">{log.fields_processed.length} fields masked</div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-xs">{new Date(log.completed_at).toLocaleDateString()}</div>
                                                            <div className="text-[10px] text-green-600">Verified</div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Compliance Badges</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-3 opacity-50 grayscale hover:grayscale-0 transition-all cursor-help" title="HIPAA Compliant Ingestion">
                                        <div className="h-10 w-10 rounded border flex items-center justify-center font-bold text-xs">HIPAA</div>
                                        <div className="text-xs font-medium">Safe Ingestion</div>
                                    </div>
                                    <div className="flex items-center gap-3 opacity-50 grayscale hover:grayscale-0 transition-all cursor-help" title="GDPR Automated Masking">
                                        <div className="h-10 w-10 rounded border flex items-center justify-center font-bold text-xs">GDPR</div>
                                        <div className="text-xs font-medium">Anonymized</div>
                                    </div>
                                    <div className="flex items-center gap-3 opacity-50 grayscale hover:grayscale-0 transition-all cursor-help" title="SOC2 Verified Storage">
                                        <div className="h-10 w-10 rounded border flex items-center justify-center font-bold text-xs">SOC2</div>
                                        <div className="text-xs font-medium">Vault Encrypted</div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </MainLayout>
    );
};

export default DatasetDetail;
