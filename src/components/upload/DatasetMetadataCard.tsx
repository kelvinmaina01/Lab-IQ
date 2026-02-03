import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Database, Shield, TrendingUp, Tag } from "lucide-react";

interface DatasetMetadataProps {
  quality_score?: number;
  metadata?: any;
  schema?: any;
  datasetName: string;
}

export function DatasetMetadataCard({ quality_score, metadata, schema, datasetName }: DatasetMetadataProps) {
  const getPIIBadgeColor = (classification?: string) => {
    switch (classification) {
      case 'none':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'low':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'high':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'phi':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getQualityColor = (score?: number) => {
    if (!score) return 'bg-muted';
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Database className="h-4 w-4 text-primary" />
          {datasetName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Data Quality Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Data Quality Score
            </span>
            <span className="font-medium">
              {quality_score ? `${quality_score}%` : 'Calculating...'}
            </span>
          </div>
          <Progress
            value={quality_score || 0}
            className={getQualityColor(quality_score)}
          />
        </div>

        {/* Missingness */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Missingness</span>
          <span className="font-medium">
            {metadata?.missing_values_count !== undefined
              ? `${((metadata.missing_values_count / (metadata.row_count || 1)) * 100).toFixed(1)}%`
              : 'N/A'}
          </span>
        </div>

        {/* PII Classification */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm flex items-center gap-2 text-muted-foreground">
              <Shield className="h-4 w-4" />
              Privacy Classification
            </span>
            <Badge className={getPIIBadgeColor(metadata?.pii_classification || 'none')}>
              {(metadata?.pii_classification || 'none').toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Feature Tags */}
        {metadata?.tags && metadata.tags.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm flex items-center gap-2 text-muted-foreground">
              <Tag className="h-4 w-4" />
              Feature Tags
            </span>
            <div className="flex flex-wrap gap-2">
              {metadata.tags.map((tag: string, idx: number) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Schema Info Preview */}
        {schema && Object.keys(schema).length > 0 && (
          <div className="space-y-2">
            <span className="text-sm text-muted-foreground">Schema Columns</span>
            <div className="text-xs text-muted-foreground space-y-1">
              {Object.entries(schema).slice(0, 3).map(([col, info]: [string, any]) => (
                <div key={col} className="flex justify-between">
                  <span className="font-mono">{col}</span>
                  <span className="text-primary">{info.type || info}</span>
                </div>
              ))}
              {Object.keys(schema).length > 3 && (
                <div className="text-center pt-1">
                  +{Object.keys(schema).length - 3} more columns
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
