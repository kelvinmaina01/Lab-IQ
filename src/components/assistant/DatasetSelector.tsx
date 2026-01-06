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
  minimal?: boolean;
}

export const DatasetSelector = ({
  selectedDataset,
  onSelectDataset,
  minimal = false,
}: DatasetSelectorProps) => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDatasets = async () => {
    // ... (fetch logic remains same)
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: datasetsData, error: datasetsError } = await supabase
        .from('datasets')
        .select('id, name, row_count, created_at')
        .eq('user_id', user.id)
        .not('name', 'ilike', '%Sample%')
        .order('created_at', { ascending: false });

      if (datasetsError) throw datasetsError;

      if (!datasetsData || datasetsData.length === 0) {
        setDatasets([]);
        return;
      }

      const datasetIds = datasetsData.map(d => d.id);
      const { data: columnsData } = await supabase
        .from('dataset_columns')
        .select('dataset_id')
        .in('dataset_id', datasetIds);

      const columnCounts = columnsData?.reduce((acc: Record<string, number>, col) => {
        acc[col.dataset_id] = (acc[col.dataset_id] || 0) + 1;
        return acc;
      }, {}) || {};

      const transformedData = datasetsData.map(d => ({
        id: d.id,
        name: d.name,
        row_count: d.row_count,
        column_count: columnCounts[d.id] || 0,
        status: 'ready',
        created_at: d.created_at
      }));

      setDatasets(transformedData);
    } catch (error: any) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
    const channel = supabase.channel('datasets-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'datasets' }, () => fetchDatasets()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const selectedDatasetInfo = datasets.find((d) => d.id === selectedDataset);

  if (minimal) {
    return (
      <div className="space-y-1">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Datasets</h4>
        <Select value={selectedDataset || ''} onValueChange={onSelectDataset}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Select dataset..." />
          </SelectTrigger>
          <SelectContent>
            {datasets.map((dataset) => (
              <SelectItem key={dataset.id} value={dataset.id} className="text-xs">
                {dataset.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <Card className="p-4 mb-4 bg-muted/30 border-border/40">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Active Dataset</span>
          {datasets.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {datasets.length} available
            </Badge>
          )}
        </div>
        <Button size="sm" variant="ghost" onClick={fetchDatasets} disabled={loading}>
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
              <SelectItem key={dataset.id} value={dataset.id}>
                <div className="flex items-center gap-2 justify-between w-full">
                  <span className="truncate">{dataset.name}</span>
                  <div className="flex items-center gap-1">
                    {dataset.row_count && (
                      <Badge variant="outline" className="text-xs">
                        {dataset.row_count.toLocaleString()} rows
                      </Badge>
                    )}
                    <Badge variant="default" className="text-xs bg-green-500/10 text-green-500">
                      Ready
                    </Badge>
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
            <span className="font-mono">{selectedDatasetInfo.column_count || 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Rows:</span>
            <span className="font-mono">{selectedDatasetInfo.row_count?.toLocaleString() || 0}</span>
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
