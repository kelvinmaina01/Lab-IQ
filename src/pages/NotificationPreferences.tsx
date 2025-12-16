import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Settings,
  Inbox,
  Search,
  Check,
  Trash2,
  Mail
} from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { MainLayout } from "@/components/layout/MainLayout";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link: string | null;
  created_at: string;
}

const LOCAL_STORAGE_PREFS_KEY = 'notification_preferences';

const getDefaultPreferences = () => ({
  email_on_action_assignment: true,
  email_on_bottleneck_detection: true,
  email_on_experiment_complete: true,
  email_on_data_quality_issues: true,
  bottleneck_threshold: 30,
  data_quality_threshold: 70,
});

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("inbox");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [tablesExist, setTablesExist] = useState({ notifications: true, preferences: true });

  // Preferences State - initialize from localStorage
  const [preferences, setPreferences] = useState(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_PREFS_KEY);
    return stored ? JSON.parse(stored) : getDefaultPreferences();
  });
  const [savingPreferences, setSavingPreferences] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch Notifications
      const { data: notifs, error: notifsError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (notifsError?.code === 'PGRST205') {
        setTablesExist(prev => ({ ...prev, notifications: false }));
      } else if (notifs) {
        setNotifications(notifs);
      }

      // Fetch Preferences
      const { data: prefs, error: prefsError } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (prefsError?.code === 'PGRST205') {
        setTablesExist(prev => ({ ...prev, preferences: false }));
        // Use localStorage fallback
        const stored = localStorage.getItem(LOCAL_STORAGE_PREFS_KEY);
        if (stored) setPreferences(JSON.parse(stored));
      } else if (prefs) {
        const newPrefs = {
          email_on_action_assignment: prefs.email_on_action_assignment ?? true,
          email_on_bottleneck_detection: prefs.email_on_bottleneck_detection ?? true,
          email_on_experiment_complete: prefs.email_on_experiment_complete ?? true,
          email_on_data_quality_issues: prefs.email_on_data_quality_issues ?? true,
          bottleneck_threshold: prefs.bottleneck_threshold ?? 30,
          data_quality_threshold: prefs.data_quality_threshold ?? 70,
        };
        setPreferences(newPrefs);
        localStorage.setItem(LOCAL_STORAGE_PREFS_KEY, JSON.stringify(newPrefs));
      }
    } catch (error) {
      console.warn("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    if (!tablesExist.notifications) {
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
      return;
    }
    try {
      await supabase.from('notifications').update({ read: true }).eq('id', id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.warn("Error marking as read", error);
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    }
  };

  const markAllAsRead = async () => {
    if (!tablesExist.notifications) {
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      toast({ title: "All notifications marked as read" });
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      toast({ title: "All notifications marked as read" });
    } catch (error) {
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      toast({ title: "All notifications marked as read" });
    }
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!tablesExist.notifications) {
      setNotifications(notifications.filter(n => n.id !== id));
      return;
    }
    try {
      await supabase.from('notifications').delete().eq('id', id);
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (error) {
      setNotifications(notifications.filter(n => n.id !== id));
    }
  };

  const savePreferences = async () => {
    setSavingPreferences(true);
    // Always save to localStorage
    localStorage.setItem(LOCAL_STORAGE_PREFS_KEY, JSON.stringify(preferences));

    if (!tablesExist.preferences) {
      toast({ title: "Preferences saved", description: "Your notification settings have been saved locally." });
      setSavingPreferences(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Preferences saved", description: "Your settings have been saved locally." });
        setSavingPreferences(false);
        return;
      }

      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          ...preferences,
        });

      if (error?.code === 'PGRST205') {
        setTablesExist(prev => ({ ...prev, preferences: false }));
        toast({ title: "Preferences saved", description: "Your settings have been saved locally." });
      } else if (error) {
        throw error;
      } else {
        toast({ title: "Preferences saved", description: "Your notification settings have been updated." });
      }
    } catch (error) {
      console.warn('Error saving preferences:', error);
      toast({ title: "Preferences saved locally", description: "Your settings have been saved to your browser." });
    } finally {
      setSavingPreferences(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'success': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      default: return <Bell className="h-5 w-5 text-primary" />;
    }
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'error': return 'bg-red-500/10 border-red-500/20';
      case 'warning': return 'bg-amber-500/10 border-amber-500/20';
      case 'success': return 'bg-green-500/10 border-green-500/20';
      default: return 'bg-primary/5 border-primary/10';
    }
  };

  return (
    <AuthGuard>
      <MainLayout>
        <div className="flex-1 p-4 md:p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl border border-primary/10">
                <Bell className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
                <p className="text-sm text-muted-foreground">Manage your alerts and preferences</p>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-muted/50 p-1 border">
              <TabsTrigger value="inbox" className="gap-2">
                <Inbox className="h-4 w-4" /> Inbox
                {notifications.some(n => !n.read) && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                    {notifications.filter(n => !n.read).length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="h-4 w-4" /> Preferences
              </TabsTrigger>
            </TabsList>

            <TabsContent value="inbox" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Your Activity</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={markAllAsRead}>
                    <Check className="mr-2 h-3.5 w-3.5" /> Mark all read
                  </Button>
                </div>
              </div>

              <div className="grid gap-3">
                {loading ? (
                  <div className="p-12 text-center text-muted-foreground">Loading notifications...</div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center border rounded-xl border-dashed">
                    <div className="p-4 bg-muted/50 rounded-full mb-4">
                      <Bell className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground">All caught up!</h3>
                    <p className="text-muted-foreground max-w-sm mt-1">
                      You have no new notifications at the moment.
                    </p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`group relative flex items-start gap-4 p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${notif.read ? 'bg-card/50 border-border/50' : 'bg-card border-primary/20 shadow-sm'
                        }`}
                      onClick={() => {
                        markAsRead(notif.id);
                        if (notif.link) navigate(notif.link);
                      }}
                    >
                      <div className={`mt-0.5 p-2 rounded-lg shrink-0 ${getTypeStyle(notif.type)}`}>
                        {getTypeIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0 cursor-pointer">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className={`text-sm font-semibold ${!notif.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {notif.title}
                          </h4>
                          <span className="text-xs text-muted-foreground">
                            {new Date(notif.created_at).toLocaleDateString()} at {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{notif.message}</p>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={(e) => deleteNotification(notif.id, e)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {!notif.read && (
                        <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-primary animate-pulse md:static md:hidden" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="settings">
              <div className="grid gap-6 max-w-3xl">
                <Card className="border-primary/5 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Mail className="h-5 w-5 text-primary" />
                      Email Notifications
                    </CardTitle>
                    <CardDescription>Control which emails you receive</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Action Assignments</Label>
                        <p className="text-sm text-muted-foreground">When you are assigned new tasks</p>
                      </div>
                      <Switch
                        checked={preferences.email_on_action_assignment}
                        onCheckedChange={(c) => setPreferences(p => ({ ...p, email_on_action_assignment: c }))}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Bottleneck Alerts</Label>
                        <p className="text-sm text-muted-foreground">When critical bottlenecks are detected</p>
                      </div>
                      <Switch
                        checked={preferences.email_on_bottleneck_detection}
                        onCheckedChange={(c) => setPreferences(p => ({ ...p, email_on_bottleneck_detection: c }))}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Experiment Completion</Label>
                        <p className="text-sm text-muted-foreground">When ML experiments finish</p>
                      </div>
                      <Switch
                        checked={preferences.email_on_experiment_complete}
                        onCheckedChange={(c) => setPreferences(p => ({ ...p, email_on_experiment_complete: c }))}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-primary/5 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <AlertTriangle className="h-5 w-5 text-primary" />
                      Threshold Configuration
                    </CardTitle>
                    <CardDescription>Adjust sensitivity for automated alerts</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Bottleneck Impact Threshold</Label>
                        <span className="font-mono text-sm">{preferences.bottleneck_threshold}</span>
                      </div>
                      <Slider
                        value={[preferences.bottleneck_threshold]}
                        min={10} max={100} step={5}
                        onValueChange={([v]) => setPreferences(p => ({ ...p, bottleneck_threshold: v }))}
                      />
                      <p className="text-xs text-muted-foreground">Alert only when impact score exceeds this value.</p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Data Quality Warning</Label>
                        <span className="font-mono text-sm">{preferences.data_quality_threshold}%</span>
                      </div>
                      <Slider
                        value={[preferences.data_quality_threshold]}
                        min={50} max={99} step={1}
                        onValueChange={([v]) => setPreferences(p => ({ ...p, data_quality_threshold: v }))}
                      />
                      <p className="text-xs text-muted-foreground">Alert when data quality drops below this percentage.</p>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button size="lg" onClick={savePreferences} disabled={savingPreferences}>
                    {savingPreferences ? 'Saving...' : 'Save Preferences'}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </MainLayout>
    </AuthGuard>
  );
}
