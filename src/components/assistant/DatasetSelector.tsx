import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Database, Upload, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Dataset {
  id: string;
  name: string;
  row_count: number | null;
  column_count: number | null;
  status: string | null;
  created_at: string;
}

interface DatasetSelectorProps {
  selectedDataset: string | null;
  onSelectDataset: (datasetId: string | null) => void;
}

export const DatasetSelector = ({
  selectedDataset,
  onSelectDataset,
}: DatasetSelectorProps) => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDatasets = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('datasets')
        .select('id, name, row_count, column_count, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDatasets(data || []);
    } catch (error: any) {
      toast({
        title: 'Error loading datasets',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('datasets-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'datasets' },
        (payload) => {
          console.log('Dataset change detected:', payload);
          fetchDatasets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const selectedDatasetInfo = datasets.find((d) => d.id === selectedDataset);
  const readyDatasets = datasets.filter(d => d.status === 'ready');

  const getStatusBadge = (status: string | null) => {
    if (!status) return null;

    const statusConfig = {
      processing: { label: 'Processing', variant: 'secondary' as const, className: 'bg-blue-500/10 text-blue-500' },
      ready: { label: 'Ready', variant: 'default' as const, className: 'bg-green-500/10 text-green-500' },
      error: { label: 'Error', variant: 'destructive' as const, className: 'bg-red-500/10 text-red-500' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.processing;

    return (
      <Badge variant={config.variant} className={`text-xs ${config.className}`}>
        {config.label}
      </Badge>
    );
  };

  return (
    <Card className="p-4 mb-4 bg-muted/30 border-border/40">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Active Dataset</span>
          {readyDatasets.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {readyDatasets.length} ready
            </Badge>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={fetchDatasets}
          disabled={loading}
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <Select value={selectedDataset || ''} onValueChange={onSelectDataset}>
        <SelectTrigger>
          <SelectValue placeholder="Select a dataset to analyze..." />
        </SelectTrigger>
        <SelectContent>
          {datasets.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No datasets found. Upload data first.
            </div>
          ) : (
            datasets.map((dataset) => (
              <SelectItem
                key={dataset.id}
                value={dataset.id}
                disabled={dataset.status !== 'ready'}
              >
                <div className="flex items-center gap-2 justify-between w-full">
                  <span className="truncate">{dataset.name}</span>
                  <div className="flex items-center gap-1">
                    {dataset.row_count && (
                      <Badge variant="outline" className="text-xs">
                        {dataset.row_count.toLocaleString()} rows
                      </Badge>
                    )}
                    {getStatusBadge(dataset.status)}
                  </div>
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      {selectedDatasetInfo && (
        <div className="mt-3 p-3 bg-background/50 rounded-lg text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Columns:</span>
            <span className="font-mono">
              {selectedDatasetInfo.column_count || 0}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Rows:</span>
            <span className="font-mono">{selectedDatasetInfo.row_count?.toLocaleString() || 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Status:</span>
            {getStatusBadge(selectedDatasetInfo.status)}
          </div>
        </div>
      )}

      {datasets.length === 0 && (
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-3"
          onClick={() => (window.location.href = '/upload')}
        >
          <Upload className="w-3 h-3 mr-2" />
          Upload Dataset
        </Button>
      )}
    </Card>
  );
};
