import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function SampleDatasetCTA() {
  const { toast } = useToast();

  const loadSampleDataset = async () => {
    try {
      toast({
        title: "Loading sample dataset...",
        description: "Creating demo pipeline with 1000 rows of lab data",
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Generate realistic sample lab data
      const sampleData = generateSampleLabData(1000);
      const csvContent = convertToCSV(sampleData);

      // Create a blob and simulate file upload
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], 'Sample_Lab_Dataset.csv', { type: 'text/csv' });

      // Check if bucket exists, if not create it
      const { data: buckets } = await supabase.storage.listBuckets();
      const datasetsBucketExists = buckets?.some(b => b.name === 'datasets');

      if (!datasetsBucketExists) {
        // Create bucket if it doesn't exist
        const { error: bucketError } = await supabase.storage.createBucket('datasets', {
          public: false,
          fileSizeLimit: 52428800, // 50MB
          allowedMimeTypes: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
        });

        if (bucketError) {
          console.warn('Could not create bucket:', bucketError);
          // Try to continue anyway in case bucket was created by another process
        }
      }

      // Upload to Supabase Storage
      const filePath = `${user.id}/Sample_Lab_Dataset_${Date.now()}.csv`;
      const { error: uploadError } = await supabase.storage
        .from('datasets')
        .upload(filePath, file, {
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Storage upload failed: ${uploadError.message}. Please ensure the 'datasets' storage bucket exists in Supabase.`);
      }

      // Create dataset record with full metadata
      const fileSizeInBytes = blob.size;
      const fileSizeInMB = (blob.size / 1024 / 1024).toFixed(2);

      const { data: dataset, error: insertError } = await supabase
        .from('datasets')
        .insert({
          user_id: user.id,
          name: 'Sample Lab Dataset',
          file_name: 'Sample_Lab_Dataset.csv',
          file_path: filePath,
          file_size: fileSizeInBytes, // Use file_size in bytes (integer)
          file_type: 'csv', // Add file_type
          row_count: 1000,
          column_count: 7,
          columns_info: {
            experiment_id: 'string',
            temperature: 'numeric',
            ph_level: 'numeric',
            concentration: 'numeric',
            enzyme_activity: 'numeric',
            result: 'string',
            timestamp: 'datetime'
          },
          status: 'ready'
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Create metadata record
      await supabase
        .from('dataset_metadata')
        .insert({
          dataset_id: dataset.id,
          quality_score: 0.95,
          completeness: 1.0,
          pii_detected: false,
          schema_info: {
            columns: [
              { name: 'experiment_id', type: 'string', nullable: false },
              { name: 'temperature', type: 'numeric', nullable: false, unit: 'Celsius' },
              { name: 'ph_level', type: 'numeric', nullable: false, range: [0, 14] },
              { name: 'concentration', type: 'numeric', nullable: false, unit: 'M' },
              { name: 'enzyme_activity', type: 'numeric', nullable: false, unit: 'U/mL' },
              { name: 'result', type: 'string', nullable: false },
              { name: 'timestamp', type: 'datetime', nullable: false }
            ]
          }
        });

      toast({
        title: "Sample dataset loaded successfully!",
        description: "1000 rows of realistic lab data ready. Navigate to Dashboard to explore.",
      });

      // Navigate to dataset detail page after a short delay
      setTimeout(() => {
        window.location.href = `/dashboard/datasets/${dataset.id}`;
      }, 1500);

    } catch (error) {
      console.error('Error loading sample:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load sample dataset.",
        variant: "destructive",
      });
    }
  };

  // Generate realistic lab data
  const generateSampleLabData = (rows: number) => {
    const data = [];
    const results = ['Success', 'Partial', 'Failed'];

    for (let i = 0; i < rows; i++) {
      const temperature = (20 + Math.random() * 15).toFixed(2); // 20-35°C
      const ph = (6.5 + Math.random() * 2).toFixed(2); // 6.5-8.5
      const concentration = (0.1 + Math.random() * 0.9).toFixed(3); // 0.1-1.0 M
      const enzymeActivity = (50 + Math.random() * 150).toFixed(2); // 50-200 U/mL
      const result = results[Math.floor(Math.random() * results.length)];
      const timestamp = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString();

      data.push({
        experiment_id: `EXP-${String(i + 1).padStart(4, '0')}`,
        temperature,
        ph_level: ph,
        concentration,
        enzyme_activity: enzymeActivity,
        result,
        timestamp
      });
    }

    return data;
  };

  // Convert JSON data to CSV
  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        return typeof value === 'string' ? `"${value}"` : value;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  };

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">Try with Sample Dataset</h3>
            </div>
            <p className="text-sm text-muted-foreground max-w-md">
              Explore the platform instantly with pre-configured lab data. One click to run a complete demo pipeline.
            </p>
          </div>
          <Button
            onClick={loadSampleDataset}
            size="lg"
            className="gap-2 shadow-lg"
          >
            <Play className="h-4 w-4" />
            Run Demo Pipeline
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
