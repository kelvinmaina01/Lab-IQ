import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  FileCheck,
  AlertCircle,
  Database,
  Clock,
  Activity,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getUploadStatistics } from "@/lib/services/enhancedUploadService";

interface UploadStats {
  total_uploads: number;
  successful_uploads: number;
  failed_uploads: number;
  total_rows_ingested: number;
  total_size_gb: number;
  avg_quality_score: number;
  methods_used: Record<string, number>;
}

export function UploadStatistics() {
  const [stats, setStats] = useState<UploadStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    loadStats();
  }, [days]);

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const statistics = await getUploadStatistics(user.id, days);
      setStats(statistics);
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSuccessRate = () => {
    if (!stats || !stats.total_uploads || stats.total_uploads === 0) return '0.0';
    return ((stats.successful_uploads / stats.total_uploads) * 100).toFixed(1);
  };

  const getMethodLabel = (method: string): string => {
    const labels: Record<string, string> = {
      'file_upload': 'File Upload',
      'device_stream': 'Device Stream',
      'api_import': 'API Import',
      'database_sync': 'Database Sync',
      'email_attachment': 'Email'
    };
    return labels[method] || method;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center h-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Safely get values with defaults
  const totalUploads = stats?.total_uploads || 0;
  const successfulUploads = stats?.successful_uploads || 0;
  const failedUploads = stats?.failed_uploads || 0;
  const totalRowsIngested = stats?.total_rows_ingested || 0;
  const totalSizeGb = stats?.total_size_gb || 0;
  const avgQualityScore = stats?.avg_quality_score || 0;
  const methodsUsed = stats?.methods_used || {};

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Uploads</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUploads.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Last {days} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculateSuccessRate()}%</div>
            <p className="text-xs text-muted-foreground">
              {successfulUploads} successful
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Ingested</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalRowsIngested ? (totalRowsIngested / 1000).toFixed(1) : 0}K
            </div>
            <p className="text-xs text-muted-foreground">
              Total rows processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Quality</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgQualityScore ? (avgQualityScore * 100).toFixed(0) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Data quality score
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Methods Used */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upload Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {methodsUsed && Object.keys(methodsUsed).length > 0 ? (
                Object.entries(methodsUsed).map(([method, count]) => (
                  <div key={method} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span className="text-sm">{getMethodLabel(method)}</span>
                    </div>
                    <Badge variant="secondary">{count as number}</Badge>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No uploads yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Storage & Quality */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Storage & Quality</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Total Storage</span>
                </div>
                <span className="text-sm font-medium">
                  {totalSizeGb ? `${totalSizeGb} GB` : '0 GB'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Quality Score</span>
                </div>
                <span className="text-sm font-medium">
                  {avgQualityScore ? (avgQualityScore * 100).toFixed(0) : 0}%
                </span>
              </div>

              {failedUploads > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <span className="text-sm">Failed Uploads</span>
                  </div>
                  <Badge variant="destructive">{failedUploads}</Badge>
                </div>
              )}

              <div className="pt-3 border-t">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Showing data from last {days} days</span>
                  <Clock className="h-3 w-3" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
