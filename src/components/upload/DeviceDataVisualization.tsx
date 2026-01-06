import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter
} from 'recharts';
import {
  TrendingUp,
  Activity,
  AlertTriangle,
  CheckCircle,
  Download,
  Database,
  Beaker,
  Workflow,
  Brain
} from "lucide-react";
import {
  getEnrichedDeviceData,
  calculateFieldStatistics,
  detectAnomalies,
  createDatasetFromStream,
  triggerWorkflowFromDevice,
  getDeviceExperiments
} from "@/lib/services/deviceDataService";
import { useToast } from "@/hooks/use-toast";

interface DeviceDataVisualizationProps {
  streamId: string;
  streamName: string;
}

export function DeviceDataVisualization({ streamId, streamName }: DeviceDataVisualizationProps) {
  const { toast } = useToast();
  const [data, setData] = useState<any[]>([]);
  const [selectedField, setSelectedField] = useState<string>('');
  const [availableFields, setAvailableFields] = useState<string[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [experiments, setExperiments] = useState<any[]>([]);
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area' | 'scatter'>('line');

  useEffect(() => {
    loadData();
    loadExperiments();
  }, [streamId]);

  useEffect(() => {
    if (data.length > 0 && selectedField) {
      // Calculate statistics
      const stats = calculateFieldStatistics(data, selectedField);
      setStatistics(stats);

      // Detect anomalies
      const anomalyData = detectAnomalies(data, selectedField, 2);
      setAnomalies(anomalyData);
    }
  }, [data, selectedField]);

  const loadData = async () => {
    try {
      setLoading(true);
      const enrichedData = await getEnrichedDeviceData(streamId, 500, true);
      setData(enrichedData);

      // Extract available numeric fields
      if (enrichedData.length > 0) {
        const firstPayload = enrichedData[0].payload;
        const numericFields = Object.keys(firstPayload).filter(key => {
          return typeof firstPayload[key] === 'number';
        });
        setAvailableFields(numericFields);
        if (numericFields.length > 0) {
          setSelectedField(numericFields[0]);
        }
      }
    } catch (error) {
      console.error('Error loading device data:', error);
      toast({
        title: "Error",
        description: "Failed to load device data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadExperiments = async () => {
    try {
      const exps = await getDeviceExperiments(streamId);
      setExperiments(exps);
    } catch (error) {
      console.error('Error loading experiments:', error);
    }
  };

  const handleCreateDataset = async () => {
    try {
      toast({
        title: "Creating dataset...",
        description: "Converting device data to dataset format"
      });

      const datasetId = await createDatasetFromStream(streamId, `${streamName} Dataset`);

      toast({
        title: "Dataset created!",
        description: "Device data has been converted to a dataset",
      });

      // Navigate to dataset
      window.location.href = `/datasets/${datasetId}`;
    } catch (error) {
      console.error('Error creating dataset:', error);
      toast({
        title: "Error",
        description: "Failed to create dataset",
        variant: "destructive"
      });
    }
  };

  const prepareChartData = () => {
    if (!selectedField || data.length === 0) return [];

    return data.map((point, index) => ({
      index: data.length - index,
      time: new Date(point.created_at).toLocaleTimeString(),
      [selectedField]: point.payload[selectedField],
      isAnomaly: anomalies.some(a => a.id === point.id)
    })).reverse();
  };

  const renderChart = () => {
    const chartData = prepareChartData();

    if (chartData.length === 0) {
      return (
        <div className="h-[400px] flex items-center justify-center text-muted-foreground">
          <p>No data available for visualization</p>
        </div>
      );
    }

    const commonProps = {
      data: chartData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey={selectedField}
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={(props: any) => {
                  if (props.payload.isAnomaly) {
                    return <circle cx={props.cx} cy={props.cy} r={6} fill="#ef4444" />;
                  }
                  return <circle cx={props.cx} cy={props.cy} r={3} fill="#8b5cf6" />;
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey={selectedField}
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey={selectedField} fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="index" name="Data Point" />
              <YAxis dataKey={selectedField} name={selectedField} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Legend />
              <Scatter
                name={selectedField}
                data={chartData}
                fill="#8b5cf6"
                shape={(props: any) => {
                  if (props.payload.isAnomaly) {
                    return <circle cx={props.cx} cy={props.cy} r={8} fill="#ef4444" />;
                  }
                  return <circle cx={props.cx} cy={props.cy} r={5} fill="#8b5cf6" />;
                }}
              />
            </ScatterChart>
          </ResponsiveContainer>
        );
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Statistics Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Points</p>
                <p className="text-2xl font-bold">{data.length}</p>
              </div>
              <Database className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valid Data</p>
                <p className="text-2xl font-bold text-green-600">
                  {data.filter(d => d.is_valid).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Anomalies</p>
                <p className="text-2xl font-bold text-red-600">{anomalies.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Experiments</p>
                <p className="text-2xl font-bold">{experiments.length}</p>
              </div>
              <Beaker className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Visualization */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Data Visualization</CardTitle>
              <CardDescription>
                Real-time analysis of {streamName}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateDataset}
                className="gap-2"
              >
                <Database className="h-4 w-4" />
                Create Dataset
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Controls */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Select Field</label>
              <Select value={selectedField} onValueChange={setSelectedField}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a field" />
                </SelectTrigger>
                <SelectContent>
                  {availableFields.map(field => (
                    <SelectItem key={field} value={field}>
                      {field}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Chart Type</label>
              <Select value={chartType} onValueChange={(val: any) => setChartType(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">Line Chart</SelectItem>
                  <SelectItem value="area">Area Chart</SelectItem>
                  <SelectItem value="bar">Bar Chart</SelectItem>
                  <SelectItem value="scatter">Scatter Plot</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Chart */}
          {renderChart()}

          {/* Statistics */}
          {statistics && (
            <div className="grid grid-cols-4 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Mean</p>
                <p className="text-lg font-semibold">{statistics.mean}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Std Dev</p>
                <p className="text-lg font-semibold">{statistics.stddev}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Min</p>
                <p className="text-lg font-semibold">{statistics.min}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Max</p>
                <p className="text-lg font-semibold">{statistics.max}</p>
              </div>
            </div>
          )}

          {/* Anomalies */}
          {anomalies.length > 0 && (
            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <h3 className="font-semibold">Detected Anomalies</h3>
                <Badge variant="destructive">{anomalies.length}</Badge>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {anomalies.slice(0, 5).map((anomaly, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950/20 rounded text-sm">
                    <span>
                      {selectedField}: <strong>{anomaly.payload[selectedField]}</strong>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(anomaly.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Linked Experiments */}
      {experiments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Beaker className="h-5 w-5" />
              Linked Experiments
            </CardTitle>
            <CardDescription>
              Experiments automatically created from this device stream
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {experiments.map(exp => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 cursor-pointer"
                  onClick={() => window.location.href = `/experiments/${exp.id}`}
                >
                  <div>
                    <p className="font-medium">{exp.name}</p>
                    <p className="text-sm text-muted-foreground">{exp.description}</p>
                  </div>
                  <Badge variant={exp.status === 'running' ? 'default' : 'secondary'}>
                    {exp.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
