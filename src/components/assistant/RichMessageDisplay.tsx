import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Pin, Download, TrendingUp, Brain } from 'lucide-react';

interface RichMessageDisplayProps {
  content: string;
  resultType?: string;
  resultData?: any;
  onPin?: () => void;
  onExport?: () => void;
}

export const RichMessageDisplay = ({
  content,
  resultType,
  resultData,
  onPin,
  onExport,
}: RichMessageDisplayProps) => {
  const renderResult = () => {
    if (!resultType || !resultData) return null;

    switch (resultType) {
      case 'chart':
        return (
          <Card className="p-4 mt-4 bg-muted/30">
            <div className="flex items-center justify-between mb-4">
              <Badge variant="secondary" className="gap-2">
                <TrendingUp className="w-3 h-3" />
                Visualization
              </Badge>
              <div className="flex gap-2">
                {onPin && (
                  <Button size="sm" variant="outline" onClick={onPin}>
                    <Pin className="w-3 h-3" />
                  </Button>
                )}
                {onExport && (
                  <Button size="sm" variant="outline" onClick={onExport}>
                    <Download className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              {resultData.type === 'bar' ? (
                <BarChart data={resultData.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="hsl(var(--primary))" />
                </BarChart>
              ) : (
                <LineChart data={resultData.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </Card>
        );

      case 'table':
        return (
          <Card className="p-4 mt-4 bg-muted/30">
            <div className="flex items-center justify-between mb-4">
              <Badge variant="secondary">Data Table</Badge>
              <div className="flex gap-2">
                {onPin && (
                  <Button size="sm" variant="outline" onClick={onPin}>
                    <Pin className="w-3 h-3" />
                  </Button>
                )}
                {onExport && (
                  <Button size="sm" variant="outline" onClick={onExport}>
                    <Download className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {resultData.columns?.map((col: string, i: number) => (
                      <TableHead key={i}>{col}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resultData.rows?.map((row: any[], i: number) => (
                    <TableRow key={i}>
                      {row.map((cell, j) => (
                        <TableCell key={j}>{cell}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        );

      case 'model':
        return (
          <Card className="p-6 mt-4 bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-secondary/20">
                <Brain className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <h4 className="font-semibold">AutoML Model Results</h4>
                <Badge variant="secondary" className="mt-1">
                  {resultData.algorithm}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {Object.entries(resultData.metrics || {}).map(([key, value]: any) => (
                <div key={key} className="text-center p-3 bg-background/50 rounded-lg">
                  <p className="text-2xl font-bold text-secondary">{value.toFixed(3)}</p>
                  <p className="text-xs text-muted-foreground uppercase">{key}</p>
                </div>
              ))}
            </div>

            {resultData.feature_importance && (
              <div className="mt-4">
                <h5 className="text-sm font-semibold mb-3">Feature Importance</h5>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={resultData.feature_importance}
                    layout="vertical"
                    margin={{ left: 100 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="feature" type="category" />
                    <Tooltip />
                    <Bar dataKey="importance" fill="hsl(var(--secondary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="flex gap-2 mt-4">
              {onPin && (
                <Button size="sm" variant="outline" onClick={onPin}>
                  <Pin className="w-3 h-3 mr-2" />
                  Pin to Dashboard
                </Button>
              )}
              {onExport && (
                <Button size="sm" variant="outline" onClick={onExport}>
                  <Download className="w-3 h-3 mr-2" />
                  Export Model
                </Button>
              )}
            </div>
          </Card>
        );

      case 'kpi':
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {resultData.metrics?.map((metric: any, i: number) => (
              <Card key={i} className="p-4 text-center bg-primary/5 border-primary/20">
                <p className="text-3xl font-bold text-primary">{metric.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{metric.label}</p>
              </Card>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      <p className="text-sm whitespace-pre-wrap">{content}</p>
      {renderResult()}
    </div>
  );
};
