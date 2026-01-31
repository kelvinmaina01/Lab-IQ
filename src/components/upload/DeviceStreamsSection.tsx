import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Plus, Trash2, Wifi, Lock, Zap, Eye, ChevronRight } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { DeviceStreamDetail } from "./DeviceStreamDetail";

interface DeviceStream {
  id: string;
  name: string;
  stream_type: string;
  status: string;
  created_at: string;
  last_data_received?: string;
  data_points_count: number;
  connection_config: any;
}

export function DeviceStreamsSection() {
  const { toast } = useToast();
  const { subscription, isPro } = useSubscription();
  const [streams, setStreams] = useState<DeviceStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStream, setSelectedStream] = useState<DeviceStream | null>(null);
  const [newStream, setNewStream] = useState({
    name: "",
    stream_type: "mqtt",
    broker_url: "mqtt://broker.dataiq.io:1883",
    topic: "",
    username: "",
    password: "",
    endpoint_url: "",
    secret_key: "",
    api_token: "",
  });

  useEffect(() => {
    fetchStreams();
  }, []);

  const fetchStreams = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('device_streams')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStreams(data || []);
    } catch (error) {
      console.error('Error fetching streams:', error);
    } finally {
      setLoading(false);
    }
  };

  const createStream = async () => {
    if (!newStream.name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for the device stream.",
        variant: "destructive",
      });
      return;
    }

    // Check limits
    if (!isPro && streams.length >= 1) {
      toast({
        title: "Upgrade required",
        description: "Free plan is limited to 1 device stream. Upgrade to Pro for unlimited streams.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Build connection config based on stream type
      const connection_config: any = {};

      if (newStream.stream_type === 'mqtt') {
        connection_config.broker_url = newStream.broker_url || 'mqtt://broker.dataiq.io:1883';
        connection_config.topic = newStream.topic || `lab/${user.id}/data`;
        connection_config.username = newStream.username || `device_${Date.now()}`;
        connection_config.password = newStream.password || generateRandomPassword();
      } else if (newStream.stream_type === 'webhook') {
        const streamId = `wh_${Date.now()}`;
        connection_config.endpoint_url = newStream.endpoint_url || `https://api.dataiq.io/webhooks/${streamId}`;
        connection_config.secret_key = newStream.secret_key || `sk_${generateRandomPassword()}`;
      } else if (newStream.stream_type === 'token_auth') {
        connection_config.api_token = newStream.api_token || `Bearer ${generateRandomPassword(32)}`;
      }

      const { error } = await supabase
        .from('device_streams')
        .insert({
          user_id: user.id,
          name: newStream.name,
          stream_type: newStream.stream_type,
          status: 'inactive',
          connection_config,
          data_points_count: 0,
        });

      if (error) throw error;

      toast({
        title: "Stream created successfully!",
        description: "Your device credentials have been generated. Click to view details.",
      });

      setDialogOpen(false);
      setNewStream({
        name: "",
        stream_type: "mqtt",
        broker_url: "mqtt://broker.dataiq.io:1883",
        topic: "",
        username: "",
        password: "",
        endpoint_url: "",
        secret_key: "",
        api_token: "",
      });
      fetchStreams();
    } catch (error) {
      console.error('Error creating stream:', error);
      toast({
        title: "Error",
        description: "Failed to create device stream.",
        variant: "destructive",
      });
    }
  };

  const generateRandomPassword = (length: number = 16) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const deleteStream = async (id: string) => {
    try {
      const { error } = await supabase
        .from('device_streams')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Stream deleted",
        description: "Device stream has been removed.",
      });

      fetchStreams();
    } catch (error) {
      console.error('Error deleting stream:', error);
      toast({
        title: "Error",
        description: "Failed to delete device stream.",
        variant: "destructive",
      });
    }
  };

  const getStreamIcon = (type: string) => {
    switch (type) {
      case 'mqtt': return <Wifi className="h-4 w-4" />;
      case 'webhook': return <Activity className="h-4 w-4" />;
      case 'token_auth': return <Lock className="h-4 w-4" />;
      case 'edge_gateway': return <Zap className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'inactive': return 'bg-muted text-muted-foreground border-border';
      case 'error': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  if (loading) {
    return (
      <Card className="border-border/50">
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
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              IoT & Device Streams
              {!isPro && <Badge variant="secondary" className="ml-2">Pro Feature</Badge>}
            </CardTitle>
            <CardDescription>
              Connect IoT devices for real-time data ingestion
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Connect Device
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Connect Device Stream</DialogTitle>
                <DialogDescription>
                  Configure a new device stream for real-time data ingestion
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="stream-name">Stream Name</Label>
                  <Input
                    id="stream-name"
                    placeholder="e.g., Lab Device #1"
                    value={newStream.name}
                    onChange={(e) => setNewStream({ ...newStream, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stream-type">Connection Type</Label>
                  <Select
                    value={newStream.stream_type}
                    onValueChange={(value) => setNewStream({ ...newStream, stream_type: value })}
                  >
                    <SelectTrigger id="stream-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mqtt">MQTT Broker</SelectItem>
                      <SelectItem value="webhook">Webhook Endpoint</SelectItem>
                      <SelectItem value="token_auth">Device Token Auth</SelectItem>
                      <SelectItem value="edge_gateway">Edge Gateway (Coming Soon)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={createStream} className="w-full">
                Create Stream
              </Button>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {selectedStream ? (
          <div className="space-y-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedStream(null)}
              className="mb-4"
            >
              ← Back to Streams
            </Button>
            <DeviceStreamDetail
              stream={selectedStream}
              onUpdate={fetchStreams}
            />
          </div>
        ) : streams.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No device streams configured</p>
            <p className="text-sm">Connect your first device to start ingesting real-time data</p>
          </div>
        ) : (
          <div className="space-y-3">
            {streams.map((stream) => (
              <div
                key={stream.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => setSelectedStream(stream)}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    {getStreamIcon(stream.stream_type)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{stream.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {stream.stream_type.replace('_', ' ')} • {stream.data_points_count || 0} points
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={getStatusColor(stream.status)}>
                    {stream.status}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteStream(stream.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
