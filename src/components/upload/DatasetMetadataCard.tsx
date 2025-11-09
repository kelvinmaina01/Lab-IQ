import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Database, Shield, TrendingUp, Tag } from "lucide-react";

interface DatasetMetadata {
  data_quality_score?: number;
  missingness_percentage?: number;
  pii_classification?: string;
  schema_info?: any;
  feature_tags?: string[];
}

interface DatasetMetadataCardProps {
  metadata: DatasetMetadata;
  datasetName: string;
}

export function DatasetMetadataCard({ metadata, datasetName }: DatasetMetadataCardProps) {
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
              {metadata.data_quality_score ? `${metadata.data_quality_score}%` : 'Calculating...'}
            </span>
          </div>
          <Progress
            value={metadata.data_quality_score || 0}
            className={getQualityColor(metadata.data_quality_score)}
          />
        </div>

        {/* Missingness */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Missingness</span>
          <span className="font-medium">
            {metadata.missingness_percentage !== undefined
              ? `${metadata.missingness_percentage.toFixed(1)}%`
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
            <Badge className={getPIIBadgeColor(metadata.pii_classification)}>
              {metadata.pii_classification?.toUpperCase() || 'SCANNING'}
            </Badge>
          </div>
        </div>

        {/* Feature Tags */}
        {metadata.feature_tags && metadata.feature_tags.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm flex items-center gap-2 text-muted-foreground">
              <Tag className="h-4 w-4" />
              Feature Tags
            </span>
            <div className="flex flex-wrap gap-2">
              {metadata.feature_tags.map((tag, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Schema Info Preview */}
        {metadata.schema_info && Object.keys(metadata.schema_info).length > 0 && (
          <div className="space-y-2">
            <span className="text-sm text-muted-foreground">Schema Columns</span>
            <div className="text-xs text-muted-foreground space-y-1">
              {Object.entries(metadata.schema_info).slice(0, 3).map(([col, type]: [string, any]) => (
                <div key={col} className="flex justify-between">
                  <span className="font-mono">{col}</span>
                  <span className="text-primary">{type}</span>
                </div>
              ))}
              {Object.keys(metadata.schema_info).length > 3 && (
                <div className="text-center pt-1">
                  +{Object.keys(metadata.schema_info).length - 3} more columns
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
