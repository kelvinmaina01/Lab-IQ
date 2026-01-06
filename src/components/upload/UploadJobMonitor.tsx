import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  TrendingUp,
  ExternalLink
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  getRecentIngestionJobs,
  subscribeToIngestionJob,
  type IngestionJob
} from "@/lib/services/enhancedUploadService";
import { formatDistanceToNow } from "date-fns";

export function UploadJobMonitor() {
  const [jobs, setJobs] = useState<IngestionJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const recentJobs = await getRecentIngestionJobs(user.id, 10);
      setJobs(recentJobs);
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
      case 'completed':
        return <Badge variant="default" className="gap-1"><CheckCircle className="h-3 w-3" />Complete</Badge>;
      case 'uploading':
      case 'processing':
      case 'profiling':
        return <Badge variant="secondary" className="gap-1"><Loader2 className="h-3 w-3 animate-spin" />Processing</Badge>;
      case 'error':
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" />Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getMethodBadge = (method: string) => {
    const methodLabels: Record<string, string> = {
      'file_upload': 'File Upload',
      'device_stream': 'Device Stream',
      'api_import': 'API Import',
      'database_sync': 'Database Sync',
      'email_attachment': 'Email'
    };

    return <Badge variant="outline">{methodLabels[method] || method}</Badge>;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const formatDuration = (created: string, completed?: string) => {
    const start = new Date(created);
    const end = completed ? new Date(completed) : new Date();
    const diffSeconds = Math.floor((end.getTime() - start.getTime()) / 1000);

    if (diffSeconds < 60) return `${diffSeconds}s`;
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ${diffSeconds % 60}s`;
    return `${Math.floor(diffSeconds / 3600)}h ${Math.floor((diffSeconds % 3600) / 60)}m`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Recent Uploads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (jobs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Recent Uploads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No uploads yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Recent Uploads
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Rows</TableHead>
                <TableHead>Quality</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Created</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">
                    {job.original_filename || 'Unknown'}
                  </TableCell>
                  <TableCell>
                    {getMethodBadge(job.ingestion_method)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(job.status)}
                  </TableCell>
                  <TableCell>
                    {job.status !== 'ready' && job.status !== 'error' ? (
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <Progress value={job.progress_percentage} className="h-2 flex-1" />
                        <span className="text-xs text-muted-foreground">
                          {job.progress_percentage}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {job.progress_percentage}%
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatFileSize(job.file_size)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {job.total_rows?.toLocaleString() || '-'}
                  </TableCell>
                  <TableCell>
                    {job.data_quality_score ? (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        <span className="text-sm font-medium">
                          {(job.data_quality_score * 100).toFixed(0)}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDuration(job.created_at, job.completed_at)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    {job.dataset_id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.location.href = `/dashboard/datasets/${job.dataset_id}`}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
