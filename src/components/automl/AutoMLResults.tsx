/**
 * AutoML Results Component
 * Displays comprehensive AutoML pipeline results
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
    TrendingUp,
    Target,
    Zap,
    CheckCircle,
    AlertCircle,
    BarChart3,
    Download,
    Lightbulb,
    Award
} from 'lucide-react';
import type { AutoMLSummary } from '@/lib/services/automlService';

interface AutoMLResultsProps {
    summary: AutoMLSummary;
    onDownloadReport?: () => void;
    onDeployModel?: () => void;
}

export function AutoMLResults({ summary, onDownloadReport, onDeployModel }: AutoMLResultsProps) {
    const {
        data_summary,
        feature_engineering_summary,
        model_training_summary,
        key_findings,
        recommendations,
        pipeline_duration_seconds,
        problem_type
    } = summary;

    const getQualityColor = (score: number) => {
        if (score >= 85) return 'text-green-600 bg-green-50';
        if (score >= 70) return 'text-blue-600 bg-blue-50';
        if (score >= 50) return 'text-yellow-600 bg-yellow-50';
        return 'text-red-600 bg-red-50';
    };

    const getPerformanceLevel = (score: number) => {
        if (problem_type === 'classification') {
            if (score >= 0.9) return { label: 'Excellent', color: 'bg-green-500' };
            if (score >= 0.8) return { label: 'Good', color: 'bg-blue-500' };
            if (score >= 0.7) return { label: 'Fair', color: 'bg-yellow-500' };
            return { label: 'Needs Improvement', color: 'bg-orange-500' };
        } else {
            if (score >= 0.9) return { label: 'Excellent', color: 'bg-green-500' };
            if (score >= 0.7) return { label: 'Good', color: 'bg-blue-500' };
            if (score >= 0.5) return { label: 'Fair', color: 'bg-yellow-500' };
            return { label: 'Needs Improvement', color: 'bg-orange-500' };
        }
    };

    const performanceLevel = getPerformanceLevel(model_training_summary.best_score);

    return (
        <div className="space-y-6">
            {/* Header Summary */}
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-2xl flex items-center gap-2">
                                <Award className="h-6 w-6 text-primary" />
                                AutoML Pipeline Complete!
                            </CardTitle>
                            <CardDescription>
                                Processed in {pipeline_duration_seconds.toFixed(1)}s • {data_summary.rows.toLocaleString()} rows analyzed
                            </CardDescription>
                        </div>
                        <Badge variant="outline" className="text-lg px-4 py-1">
                            {problem_type.charAt(0).toUpperCase() + problem_type.slice(1)}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Data Quality */}
                        <div className={`p-4 rounded-lg ${getQualityColor(data_summary.quality_score)}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <CheckCircle className="h-5 w-5" />
                                <span className="font-semibold">Data Quality</span>
                            </div>
                            <div className="text-3xl font-bold">{data_summary.quality_score.toFixed(1)}/100</div>
                            <div className="text-sm mt-1">{data_summary.quality_rating}</div>
                        </div>

                        {/* Best Model */}
                        <div className="bg-blue-50 text-blue-900 p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <Target className="h-5 w-5" />
                                <span className="font-semibold">Best Model</span>
                            </div>
                            <div className="text-2xl font-bold">{model_training_summary.best_model}</div>
                            <div className="text-sm mt-1">{model_training_summary.models_trained} models trained</div>
                        </div>

                        {/* Performance */}
                        <div className={`${performanceLevel.color} text-white p-4 rounded-lg`}>
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="h-5 w-5" />
                                <span className="font-semibold">Performance</span>
                            </div>
                            <div className="text-3xl font-bold">
                                {problem_type === 'classification'
                                    ? `${(model_training_summary.best_score * 100).toFixed(1)}%`
                                    : model_training_summary.best_score.toFixed(3)
                                }
                            </div>
                            <div className="text-sm mt-1">{performanceLevel.label}</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Detailed Tabs */}
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="features">Features</TabsTrigger>
                    <TabsTrigger value="insights">Insights</TabsTrigger>
                    <TabsTrigger value="recommendations">Actions</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                Pipeline Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Data Summary */}
                            <div>
                                <h4 className="font-semibold mb-3 text-sm text-muted-foreground">DATA ANALYSIS</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="text-center p-3 bg-muted rounded-lg">
                                        <div className="text-2xl font-bold text-primary">{data_summary.rows.toLocaleString()}</div>
                                        <div className="text-xs text-muted-foreground">Rows</div>
                                    </div>
                                    <div className="text-center p-3 bg-muted rounded-lg">
                                        <div className="text-2xl font-bold text-primary">{data_summary.columns}</div>
                                        <div className="text-xs text-muted-foreground">Columns</div>
                                    </div>
                                    <div className="text-center p-3 bg-muted rounded-lg">
                                        <div className="text-2xl font-bold text-primary">{data_summary.quality_score.toFixed(0)}%</div>
                                        <div className="text-xs text-muted-foreground">Quality Score</div>
                                    </div>
                                    <div className="text-center p-3 bg-muted rounded-lg">
                                        <div className="text-lg font-bold text-primary">{data_summary.quality_rating}</div>
                                        <div className="text-xs text-muted-foreground">Rating</div>
                                    </div>
                                </div>
                            </div>

                            {/* Model Training Summary */}
                            <div>
                                <h4 className="font-semibold mb-3 text-sm text-muted-foreground">MODEL TRAINING</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                        <span className="text-sm">Best Algorithm</span>
                                        <Badge variant="default">{model_training_summary.best_model}</Badge>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                        <span className="text-sm">Models Trained</span>
                                        <Badge variant="secondary">{model_training_summary.models_trained}</Badge>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                        <span className="text-sm">Best Score</span>
                                        <Badge variant="outline" className="font-mono">
                                            {problem_type === 'classification'
                                                ? `${(model_training_summary.best_score * 100).toFixed(2)}%`
                                                : model_training_summary.best_score.toFixed(4)
                                            }
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Features Tab */}
                <TabsContent value="features" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Zap className="h-5 w-5" />
                                Feature Engineering
                            </CardTitle>
                            <CardDescription>
                                Automated feature generation and selection
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Original Features</span>
                                    <span className="text-2xl font-bold">{feature_engineering_summary.original_features}</span>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span>Features Generated</span>
                                        <Badge variant="secondary">+{feature_engineering_summary.features_generated}</Badge>
                                    </div>
                                    <Progress value={(feature_engineering_summary.features_generated / 100) * 100} />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span>Features Selected</span>
                                        <Badge variant="default">{feature_engineering_summary.features_selected}</Badge>
                                    </div>
                                    <Progress value={(feature_engineering_summary.features_selected / feature_engineering_summary.original_features) * 100} />
                                </div>

                                <div className="pt-4 border-t">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Final Features</span>
                                        <span className="text-2xl font-bold text-primary">{feature_engineering_summary.final_features}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Insights Tab */}
                <TabsContent value="insights" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Lightbulb className="h-5 w-5" />
                                Key Findings
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {key_findings.map((finding, index) => (
                                    <div key={index} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm">{finding}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Recommendations Tab */}
                <TabsContent value="recommendations" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertCircle className="h-5 w-5" />
                                Recommendations & Next Steps
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 mb-6">
                                {recommendations.map((rec, index) => (
                                    <div key={index} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                                        <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                                            {index + 1}
                                        </span>
                                        <p className="text-sm">{rec}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-3">
                                {onDownloadReport && (
                                    <Button onClick={onDownloadReport} variant="outline" className="flex-1">
                                        <Download className="h-4 w-4 mr-2" />
                                        Download Report
                                    </Button>
                                )}
                                {onDeployModel && (
                                    <Button onClick={onDeployModel} className="flex-1">
                                        <Target className="h-4 w-4 mr-2" />
                                        Deploy Model
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
