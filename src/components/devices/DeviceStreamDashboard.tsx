import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Activity, Wifi, WifiOff, AlertCircle, RefreshCw, Zap, Brain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DeviceStream {
  id: string;
  name: string;
  stream_type: string;
  status: string;
  last_data_received: string | null;
  config: any;
}

interface StreamMetrics {
  timestamp: string;
  temperature?: number;
  humidity?: number;
  pressure?: number;
  flowRate?: number;
  [key: string]: any;
}

export const DeviceStreamDashboard = () => {
  const [streams, setStreams] = useState<DeviceStream[]>([]);
  const [selectedStream, setSelectedStream] = useState<string | null>(null);
  const [metricsData, setMetricsData] = useState<StreamMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDeviceStreams();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('device-streams')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'device_streams'
        },
        (payload) => {
          console.log('Device stream update:', payload);
          fetchDeviceStreams();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (selectedStream) {
      generateMockMetrics();
      const interval = setInterval(generateMockMetrics, 5000); // Update every 5 seconds
      return () => clearInterval(interval);
    }
  }, [selectedStream]);

  const fetchDeviceStreams = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('device_streams')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      setStreams(data || []);
      if (data && data.length > 0 && !selectedStream) {
        setSelectedStream(data[0].id);
      }
    } catch (error: any) {
      console.error('Error fetching device streams:', error);
      toast({
        title: "Error",
        description: "Failed to load device streams",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate mock real-time metrics for demonstration
  const generateMockMetrics = () => {
    const now = new Date();
    const newMetrics: StreamMetrics[] = Array.from({ length: 20 }, (_, i) => {
      const time = new Date(now.getTime() - (19 - i) * 60000);
      return {
        timestamp: time.toLocaleTimeString(),
        temperature: 20 + Math.random() * 10,
        humidity: 40 + Math.random() * 20,
        pressure: 1010 + Math.random() * 20,
        flowRate: 100 + Math.random() * 50
      };
    });
    setMetricsData(newMetrics);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-500 border-green-500/30';
      case 'inactive':
        return 'bg-gray-500/20 text-gray-500 border-gray-500/30';
      case 'error':
        return 'bg-red-500/20 text-red-500 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-500 border-gray-500/30';
    }
  };

  const getStreamTypeIcon = (type: string) => {
    switch (type) {
      case 'mqtt':
        return <Wifi className="w-4 h-4" />;
      case 'webhook':
        return <Zap className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (streams.length === 0) {
    return (
      <Card className="p-8 text-center">
        <WifiOff className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">No Device Streams Connected</h3>
        <p className="text-muted-foreground mb-4">
          Connect your IoT devices to start monitoring real-time data
        </p>
        <Button variant="outline">Connect Device</Button>
      </Card>
    );
  }

  const activeStream = streams.find(s => s.id === selectedStream);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Live Device Streams</h2>
          <p className="text-muted-foreground">Real-time monitoring of connected IoT devices</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/models'}>
            <Brain className="w-4 h-4 mr-2" />
            Attach AI Model
          </Button>
          <Button variant="outline" size="sm" onClick={fetchDeviceStreams}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stream Selector */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {streams.map((stream) => (
          <Card
            key={stream.id}
            className={`p-4 cursor-pointer transition-all ${selectedStream === stream.id
              ? 'ring-2 ring-primary shadow-lg'
              : 'hover:shadow-md'
              }`}
            onClick={() => setSelectedStream(stream.id)}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {getStreamTypeIcon(stream.stream_type)}
                <h3 className="font-semibold text-sm">{stream.name}</h3>
              </div>
              <Badge className={getStatusColor(stream.status)} variant="outline">
                {stream.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {stream.stream_type.toUpperCase()}
            </p>
            {stream.last_data_received && (
              <p className="text-xs text-muted-foreground mt-2">
                Last: {new Date(stream.last_data_received).toLocaleTimeString()}
              </p>
            )}
          </Card>
        ))}
      </div>

      {/* Metrics Visualization */}
      {activeStream && (
        <>
          {/* Real-time Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Temperature</p>
                <Activity className="w-4 h-4 text-orange-500" />
              </div>
              <p className="text-2xl font-bold">
                {metricsData[metricsData.length - 1]?.temperature.toFixed(1)}°C
              </p>
              <p className="text-xs text-green-500 mt-1">Live</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Humidity</p>
                <Activity className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-2xl font-bold">
                {metricsData[metricsData.length - 1]?.humidity.toFixed(1)}%
              </p>
              <p className="text-xs text-green-500 mt-1">Live</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Pressure</p>
                <Activity className="w-4 h-4 text-purple-500" />
              </div>
              <p className="text-2xl font-bold">
                {metricsData[metricsData.length - 1]?.pressure.toFixed(0)} hPa
              </p>
              <p className="text-xs text-green-500 mt-1">Live</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Flow Rate</p>
                <Activity className="w-4 h-4 text-teal-500" />
              </div>
              <p className="text-2xl font-bold">
                {metricsData[metricsData.length - 1]?.flowRate.toFixed(0)} mL/min
              </p>
              <p className="text-xs text-green-500 mt-1">Live</p>
            </Card>
          </div>

          {/* Time Series Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Temperature & Humidity</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={metricsData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="timestamp" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="temperature"
                    stroke="hsl(var(--destructive))"
                    strokeWidth={2}
                    dot={false}
                    name="Temperature (°C)"
                  />
                  <Line
                    type="monotone"
                    dataKey="humidity"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                    name="Humidity (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Pressure & Flow Rate</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={metricsData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="timestamp" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="pressure"
                    stroke="hsl(var(--accent))"
                    strokeWidth={2}
                    dot={false}
                    name="Pressure (hPa)"
                  />
                  <Line
                    type="monotone"
                    dataKey="flowRate"
                    stroke="hsl(var(--secondary))"
                    strokeWidth={2}
                    dot={false}
                    name="Flow Rate (mL/min)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Alerts */}
          {activeStream.status === 'error' && (
            <Card className="p-4 border-destructive/50 bg-destructive/5">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                <div>
                  <h4 className="font-semibold text-destructive">Connection Error</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Unable to receive data from {activeStream.name}. Check device connection and configuration.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
