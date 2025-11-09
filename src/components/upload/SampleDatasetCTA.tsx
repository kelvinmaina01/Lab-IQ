import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function SampleDatasetCTA() {
  const { toast } = useToast();

  const loadSampleDataset = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create a sample dataset
      const { error } = await supabase
        .from('datasets')
        .insert({
          user_id: user.id,
          name: 'Sample Lab Dataset',
          row_count: 1000,
          file_size_mb: 2.5,
          columns_info: {
            experiment_id: 'string',
            temperature: 'numeric',
            ph_level: 'numeric',
            concentration: 'numeric',
            result: 'string',
            timestamp: 'datetime'
          }
        });

      if (error) throw error;

      toast({
        title: "Sample dataset loaded",
        description: "Demo pipeline is ready to explore. Check the Experiments tab.",
      });
    } catch (error) {
      console.error('Error loading sample:', error);
      toast({
        title: "Error",
        description: "Failed to load sample dataset.",
        variant: "destructive",
      });
    }
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
