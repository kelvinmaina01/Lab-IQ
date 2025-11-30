import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Bell, ArrowLeft, Save, AlertTriangle, CheckCircle2 } from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import MobileNav from "@/components/MobileNav";

export default function NotificationPreferences() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [preferences, setPreferences] = useState({
    email_on_action_assignment: true,
    email_on_bottleneck_detection: true,
    email_on_experiment_complete: true,
    email_on_data_quality_issues: true,
    bottleneck_threshold: 30,
    data_quality_threshold: 70,
  });

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPreferences({
          email_on_action_assignment: data.email_on_action_assignment,
          email_on_bottleneck_detection: data.email_on_bottleneck_detection,
          email_on_experiment_complete: data.email_on_experiment_complete,
          email_on_data_quality_issues: data.email_on_data_quality_issues,
          bottleneck_threshold: data.bottleneck_threshold,
          data_quality_threshold: data.data_quality_threshold,
        });
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          ...preferences,
        });

      if (error) throw error;

      toast({
        title: "Preferences saved",
        description: "Your notification preferences have been updated.",
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col lg:flex-row bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <TopBar />
          <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Bell className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                    Notification Preferences
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Customize your email alerts and thresholds
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 max-w-4xl">
              {/* Email Notification Settings */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    Email Notifications
                  </CardTitle>
                  <CardDescription>
                    Choose which events trigger email notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="action-assignment">Action Assignment</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when you're assigned to an action
                      </p>
                    </div>
                    <Switch
                      id="action-assignment"
                      checked={preferences.email_on_action_assignment}
                      onCheckedChange={(checked) =>
                        setPreferences({ ...preferences, email_on_action_assignment: checked })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="bottleneck-detection">Critical Bottleneck Detection</Label>
                      <p className="text-sm text-muted-foreground">
                        Alert when high-impact bottlenecks are detected
                      </p>
                    </div>
                    <Switch
                      id="bottleneck-detection"
                      checked={preferences.email_on_bottleneck_detection}
                      onCheckedChange={(checked) =>
                        setPreferences({ ...preferences, email_on_bottleneck_detection: checked })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="experiment-complete">Experiment Completion</Label>
                      <p className="text-sm text-muted-foreground">
                        Notify when your experiments finish processing
                      </p>
                    </div>
                    <Switch
                      id="experiment-complete"
                      checked={preferences.email_on_experiment_complete}
                      onCheckedChange={(checked) =>
                        setPreferences({ ...preferences, email_on_experiment_complete: checked })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="data-quality">Data Quality Issues</Label>
                      <p className="text-sm text-muted-foreground">
                        Alert on data quality degradation
                      </p>
                    </div>
                    <Switch
                      id="data-quality"
                      checked={preferences.email_on_data_quality_issues}
                      onCheckedChange={(checked) =>
                        setPreferences({ ...preferences, email_on_data_quality_issues: checked })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Threshold Settings */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-primary" />
                    Alert Thresholds
                  </CardTitle>
                  <CardDescription>
                    Set custom impact scores for triggering alerts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="bottleneck-threshold">
                        Bottleneck Impact Threshold
                      </Label>
                      <span className="text-sm font-medium text-muted-foreground">
                        {preferences.bottleneck_threshold}
                      </span>
                    </div>
                    <Slider
                      id="bottleneck-threshold"
                      min={10}
                      max={100}
                      step={10}
                      value={[preferences.bottleneck_threshold]}
                      onValueChange={([value]) =>
                        setPreferences({ ...preferences, bottleneck_threshold: value })
                      }
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Only notify about bottlenecks with impact score ≥ {preferences.bottleneck_threshold}
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="quality-threshold">
                        Data Quality Score Threshold
                      </Label>
                      <span className="text-sm font-medium text-muted-foreground">
                        {preferences.data_quality_threshold}%
                      </span>
                    </div>
                    <Slider
                      id="quality-threshold"
                      min={50}
                      max={100}
                      step={5}
                      value={[preferences.data_quality_threshold]}
                      onValueChange={([value]) =>
                        setPreferences({ ...preferences, data_quality_threshold: value })
                      }
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Alert when data quality falls below {preferences.data_quality_threshold}%
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Save Button */}
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate(-1)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={savePreferences}
                  disabled={saving}
                  className="gap-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Preferences
                    </>
                  )}
                </Button>
              </div>
            </div>
          </main>
          <MobileNav />
        </div>
      </div>
    </AuthGuard>
  );
}
