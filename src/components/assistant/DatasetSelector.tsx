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
  columns_info: any;
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
      const { data, error } = await supabase
        .from('datasets')
        .select('*')
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
  }, []);

  const selectedDatasetInfo = datasets.find((d) => d.id === selectedDataset);

  return (
    <Card className="p-4 mb-4 bg-muted/30 border-border/40">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Active Dataset</span>
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
              <SelectItem key={dataset.id} value={dataset.id}>
                <div className="flex items-center gap-2">
                  <span>{dataset.name}</span>
                  {dataset.row_count && (
                    <Badge variant="outline" className="text-xs">
                      {dataset.row_count} rows
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      {selectedDatasetInfo && (
        <div className="mt-3 p-3 bg-background/50 rounded-lg text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Columns:</span>
            <span className="font-mono">
              {selectedDatasetInfo.columns_info?.length || 0}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-muted-foreground">Rows:</span>
            <span className="font-mono">{selectedDatasetInfo.row_count || 0}</span>
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
