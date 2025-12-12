import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Activity,
  Wifi,
  Lock,
  Zap,
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Database,
  AlertCircle
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DeviceDataVisualization } from "./DeviceDataVisualization";
import { DeviceMLIntegration } from "./DeviceMLIntegration";

interface DeviceStreamDetailProps {
  stream: {
    id: string;
    name: string;
    stream_type: string;
    status: string;
    connection_config: any;
    last_data_received?: string;
    data_points_count: number;
  };
  onUpdate: () => void;
}

export function DeviceStreamDetail({ stream, onUpdate }: DeviceStreamDetailProps) {
  const { toast } = useToast();
  const [liveData, setLiveData] = useState<any[]>([]);
  const [connectionStatus, setConnectionStatus] = useState(stream.status);
  const [dataRate, setDataRate] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    // Set up real-time subscription for incoming data
    const channel = supabase
      .channel(`device_stream_${stream.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'device_stream_data',
        filter: `stream_id=eq.${stream.id}`
      }, (payload) => {
        console.log('New data received:', payload);
        handleNewData(payload.new);
      })
      .subscribe();

    // Fetch recent data
    fetchRecentData();

    // Set up interval to calculate data rate
    const interval = setInterval(() => {
      calculateDataRate();
    }, 5000);

    return () => {
      channel.unsubscribe();
      clearInterval(interval);
    };
  }, [stream.id]);

  const fetchRecentData = async () => {
    try {
      const { data, error } = await supabase
        .from('device_stream_data')
        .select('*')
        .eq('stream_id', stream.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLiveData(data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleNewData = (newData: any) => {
    setLiveData(prev => [newData, ...prev].slice(0, 50));
    setLastUpdate(new Date());

    // Update connection status to active
    if (connectionStatus !== 'active') {
      setConnectionStatus('active');
      updateStreamStatus('active');
    }
  };

  const calculateDataRate = () => {
    // Calculate data points per minute
    const oneMinuteAgo = new Date(Date.now() - 60000);
    const recentPoints = liveData.filter(d =>
      new Date(d.created_at) > oneMinuteAgo
    );
    setDataRate(recentPoints.length);
  };

  const updateStreamStatus = async (status: string) => {
    try {
      await supabase
        .from('device_streams')
        .update({
          status,
          last_data_received: new Date().toISOString()
        })
        .eq('id', stream.id);

      onUpdate();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const getConnectionInstructions = () => {
    const config = stream.connection_config || {};

    switch (stream.stream_type) {
      case 'mqtt':
        return {
          broker: config.broker_url || `mqtt://broker.lab-iq.com:1883`,
          topic: config.topic || `lab/${stream.id}/data`,
          username: config.username || `device_${stream.id.slice(0, 8)}`,
          password: config.password || '••••••••',
        };

      case 'webhook':
        return {
          endpoint: config.endpoint_url || `https://api.lab-iq.com/webhooks/${stream.id}`,
          secret: config.secret_key || `sk_${stream.id.slice(0, 16)}`,
          method: 'POST',
        };

      case 'token_auth':
        return {
          endpoint: `https://api.lab-iq.com/v1/data/ingest`,
          token: config.api_token || `Bearer ${stream.id.replace(/-/g, '')}`,
          stream_id: stream.id,
        };

      default:
        return {};
    }
  };

  const credentials = getConnectionInstructions();

  return (
    <div className="space-y-4">
      {/* Connection Status Card */}
      <Card className="border-2" style={{
        borderColor: connectionStatus === 'active' ? 'rgb(34 197 94)' :
                    connectionStatus === 'error' ? 'rgb(239 68 68)' :
                    'rgb(156 163 175)'
      }}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full animate-pulse`} style={{
                backgroundColor: connectionStatus === 'active' ? 'rgb(34 197 94)' :
                               connectionStatus === 'error' ? 'rgb(239 68 68)' :
                               'rgb(156 163 175)'
              }} />
              <div>
                <CardTitle className="text-lg">{stream.name}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="capitalize">
                    {stream.stream_type.replace('_', ' ')}
                  </Badge>
                  <span className="text-xs">•</span>
                  <span className="text-xs">
                    {connectionStatus === 'active' ? 'Connected' :
                     connectionStatus === 'error' ? 'Error' :
                     'Disconnected'}
                  </span>
                </CardDescription>
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{dataRate}</div>
              <div className="text-xs text-muted-foreground">points/min</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-sm text-muted-foreground">Total Points</div>
              <div className="text-xl font-bold">{stream.data_points_count.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Last Update</div>
              <div className="text-xl font-bold">
                {lastUpdate ? lastUpdate.toLocaleTimeString() : '--:--'}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Uptime</div>
              <div className="text-xl font-bold">98.5%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="credentials" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="credentials">Credentials</TabsTrigger>
          <TabsTrigger value="livedata">
            Live Data
            {liveData.length > 0 && (
              <Badge variant="secondary" className="ml-2">{liveData.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="visualization">Analytics</TabsTrigger>
          <TabsTrigger value="integration">Integrations</TabsTrigger>
          <TabsTrigger value="code">Code Examples</TabsTrigger>
        </TabsList>

        {/* Credentials Tab */}
        <TabsContent value="credentials" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Connection Credentials</CardTitle>
              <CardDescription>
                Use these credentials to connect your device
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {stream.stream_type === 'mqtt' && (
                <>
                  <div className="space-y-2">
                    <Label>MQTT Broker</Label>
                    <div className="flex gap-2">
                      <Input value={credentials.broker} readOnly className="font-mono text-sm" />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(credentials.broker, 'Broker URL')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Topic</Label>
                    <div className="flex gap-2">
                      <Input value={credentials.topic} readOnly className="font-mono text-sm" />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(credentials.topic, 'Topic')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Username</Label>
                      <div className="flex gap-2">
                        <Input value={credentials.username} readOnly className="font-mono text-sm" />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(credentials.username, 'Username')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <div className="flex gap-2">
                        <Input value={credentials.password} readOnly type="password" className="font-mono text-sm" />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(credentials.password, 'Password')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {stream.stream_type === 'webhook' && (
                <>
                  <div className="space-y-2">
                    <Label>Webhook URL</Label>
                    <div className="flex gap-2">
                      <Input value={credentials.endpoint} readOnly className="font-mono text-sm" />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(credentials.endpoint, 'Webhook URL')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Secret Key</Label>
                    <div className="flex gap-2">
                      <Input value={credentials.secret} readOnly type="password" className="font-mono text-sm" />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(credentials.secret, 'Secret Key')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Include the secret key in the <code className="text-xs bg-background px-1 py-0.5 rounded">X-Lab-IQ-Secret</code> header
                    </p>
                  </div>
                </>
              )}

              {stream.stream_type === 'token_auth' && (
                <>
                  <div className="space-y-2">
                    <Label>API Endpoint</Label>
                    <div className="flex gap-2">
                      <Input value={credentials.endpoint} readOnly className="font-mono text-sm" />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(credentials.endpoint, 'Endpoint')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Device Token</Label>
                    <div className="flex gap-2">
                      <Input value={credentials.token} readOnly type="password" className="font-mono text-sm" />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(credentials.token, 'Token')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Stream ID</Label>
                    <div className="flex gap-2">
                      <Input value={credentials.stream_id} readOnly className="font-mono text-sm" />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(credentials.stream_id, 'Stream ID')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Live Data Tab */}
        <TabsContent value="livedata" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Real-Time Data Stream</CardTitle>
                  <CardDescription>
                    Last {liveData.length} data points (auto-refreshes)
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={fetchRecentData}>
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {liveData.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground">No data received yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Waiting for your device to send data...
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-2">
                    {liveData.map((point, idx) => (
                      <div
                        key={point.id || idx}
                        className="p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors animate-in fade-in slide-in-from-top-2"
                        style={{ animationDuration: '300ms', animationDelay: `${idx * 20}ms` }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            {new Date(point.created_at).toLocaleTimeString()}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            Point #{stream.data_points_count - idx}
                          </Badge>
                        </div>
                        <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
                          {JSON.stringify(point.payload, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics/Visualization Tab */}
        <TabsContent value="visualization" className="space-y-4">
          <DeviceDataVisualization streamId={stream.id} streamName={stream.name} />
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integration" className="space-y-4">
          <DeviceMLIntegration streamId={stream.id} streamName={stream.name} />
        </TabsContent>

        {/* Code Examples Tab */}
        <TabsContent value="code" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Start Code</CardTitle>
              <CardDescription>
                Copy and paste to connect your device
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {stream.stream_type === 'mqtt' && (
                <div className="space-y-2">
                  <Label>Python (MQTT)</Label>
                  <div className="relative">
                    <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto">
{`import paho.mqtt.client as mqtt
import json
import time

broker = "${credentials.broker}"
topic = "${credentials.topic}"
username = "${credentials.username}"
password = "${credentials.password}"

client = mqtt.Client()
client.username_pw_set(username, password)
client.connect(broker.replace('mqtt://', ''), 1883, 60)
client.loop_start()

# Send data
data = {
    "temperature": 25.5,
    "humidity": 60,
    "timestamp": time.time()
}
client.publish(topic, json.dumps(data))
print("Data sent!")`}
                    </pre>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(
                        `import paho.mqtt.client as mqtt\n...`,
                        'Python code'
                      )}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                </div>
              )}

              {stream.stream_type === 'webhook' && (
                <div className="space-y-2">
                  <Label>cURL (Webhook)</Label>
                  <div className="relative">
                    <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto">
{`curl -X POST ${credentials.endpoint} \\
  -H "Content-Type: application/json" \\
  -H "X-Lab-IQ-Secret: ${credentials.secret}" \\
  -d '{
    "temperature": 25.5,
    "timestamp": "2025-12-08T10:30:00Z"
  }'`}
                    </pre>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(
                        `curl -X POST ${credentials.endpoint}...`,
                        'cURL command'
                      )}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
