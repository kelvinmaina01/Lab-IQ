import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
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
    Brain
} from "lucide-react";
import { toast } from "sonner";
import { DataExplorer } from "@/components/data/DataExplorer";

const DatasetDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [dataset, setDataset] = useState<any>(null);
    const [columns, setColumns] = useState<any[]>([]);
    const [rows, setRows] = useState<any[]>([]);
    const [quality, setQuality] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) fetchDatasetDetails();
    }, [id]);

    const fetchDatasetDetails = async () => {
        try {
            setLoading(true);

            // 1. Fetch Dataset Metadata
            const { data: datasetData, error: datasetError } = await supabase
                .from('datasets')
                .select('*')
                .eq('id', id)
                .single();

            if (datasetError) throw datasetError;
            setDataset(datasetData);

            // 2. Fetch Columns (Schema)
            const { data: columnsData, error: columnsError } = await supabase
                .from('dataset_columns')
                .select('*')
                .eq('dataset_id', id)
                .order('column_index');

            if (columnsError) throw columnsError;
            setColumns(columnsData || []);

            // 3. Fetch Quality Metrics
            const { data: qualityData, error: qualityError } = await supabase
                .from('dataset_quality')
                .select('*')
                .eq('dataset_id', id)
                .single();

            if (!qualityError) setQuality(qualityData);

            // 4. Fetch Rows (Preview - increased to 5000 for better exploration)
            const { data: rowsData, error: rowsError } = await supabase
                .from('dataset_rows')
                .select('data')
                .eq('dataset_id', id)
                .order('row_index')
                .limit(5000);

            if (rowsError) throw rowsError;
            setRows(rowsData?.map(r => r.data) || []);

        } catch (error) {
            console.error("Error fetching dataset:", error);
            toast.error("Failed to load dataset details");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this dataset? This action cannot be undone.")) return;

        try {
            const { datasetService } = await import("@/lib/services/datasetService");
            await datasetService.deleteDataset(id!);
            toast.success("Dataset deleted successfully");
            navigate("/dashboard");
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("Failed to delete dataset");
        }
    };

    const handleDownload = () => {
        if (!rows.length) return;

        // Simple CSV export
        const headers = Object.keys(rows[0]).join(",");
        const csv = [
            headers,
            ...rows.map(row => Object.values(row).map(v =>
                typeof v === 'object' ? `"${JSON.stringify(v).replace(/"/g, '""')}"` : `"${String(v).replace(/"/g, '""')}"`
            ).join(","))
        ].join("\n");

        const blob = new Blob([csv], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${dataset.file_name || "dataset"}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success("Download started");
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
        <div className="min-h-screen bg-background">
            <Navigation />

            <main className="container mx-auto px-4 pt-24 pb-12 space-y-8">
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
                            <span>{new Date(dataset.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="destructive" variant="outline" onClick={handleDelete} className="text-destructive hover:bg-destructive/10 border-destructive/50">
                            Delete
                        </Button>
                        <Button variant="outline" onClick={handleDownload}>
                            Download CSV
                        </Button>
                        <Button onClick={() => navigate('/models')} variant="secondary" className="gap-2">
                            <Brain className="h-4 w-4" />
                            Predict
                        </Button>
                        <Button>Analyze with AI</Button>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {columns.map((col) => (
                                <Card key={col.id}>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base font-medium flex justify-between">
                                            {col.column_name}
                                            <Badge>{col.data_type}</Badge>
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
                    </TabsContent>

                    <TabsContent value="analysis" className="mt-6">
                        <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg border-dashed">
                            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium">Advanced Analysis</h3>
                            <p className="text-muted-foreground max-w-md mt-2">
                                Automated insights and visualizations are being generated.
                                Check back in a few moments or run a custom query.
                            </p>
                            <Button className="mt-6">Run Auto-Analysis</Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
};

export default DatasetDetail;
