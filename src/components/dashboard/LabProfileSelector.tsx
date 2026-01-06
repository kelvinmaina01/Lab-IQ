import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Globe, GraduationCap, Building2, HeartPulse } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const LOCAL_STORAGE_KEY = 'health_profile_type';

export const LabProfileSelector = () => {
  const [selectedProfile, setSelectedProfile] = useState<string>(() => {
    // Initialize from localStorage
    return localStorage.getItem(LOCAL_STORAGE_KEY) || "public-health";
  });
  const [loading, setLoading] = useState(true);
  const [tableExists, setTableExists] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('lab_profiles')
        .select('profile_type')
        .eq('user_id', user.id)
        .maybeSingle();

      // Check if table doesn't exist (PGRST205 error)
      if (error?.code === 'PGRST205') {
        setTableExists(false);
        // Use localStorage fallback
        const localProfile = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (localProfile) setSelectedProfile(localProfile);
        setLoading(false);
        return;
      }

      if (error && error.code !== 'PGRST116') {
        console.warn('Health profile fetch warning:', error.message);
      }

      if (data) {
        setSelectedProfile(data.profile_type);
        localStorage.setItem(LOCAL_STORAGE_KEY, data.profile_type);
      }
    } catch (error) {
      console.warn('Error fetching profile, using localStorage fallback');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = async (value: string) => {
    setSelectedProfile(value);
    // Always save to localStorage as backup
    localStorage.setItem(LOCAL_STORAGE_KEY, value);

    // If table doesn't exist, just use localStorage
    if (!tableExists) {
      toast({
        title: "Profile updated",
        description: "Your health profile preference has been saved locally.",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('lab_profiles')
        .upsert({ user_id: user.id, profile_type: value }, { onConflict: 'user_id' });

      if (error?.code === 'PGRST205') {
        setTableExists(false);
        toast({
          title: "Profile updated",
          description: "Your health profile preference has been saved locally.",
        });
        return;
      }

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your health profile has been saved successfully.",
      });
    } catch (error: any) {
      console.warn('Error updating profile:', error?.message);
      toast({
        title: "Profile saved locally",
        description: "Your preference has been saved to your browser.",
      });
    }
  };

  if (loading) {
    return (
      <div className="w-[240px] h-10 bg-muted/50 rounded-md animate-pulse" />
    );
  }

  return (
    <Select value={selectedProfile} onValueChange={handleProfileChange}>
      <SelectTrigger className="w-[240px] bg-muted/50 border-muted">
        <SelectValue placeholder="Select health profile" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="public-health">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            <span>Public Health Research</span>
          </div>
        </SelectItem>
        <SelectItem value="epidemiology">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            <span>Epidemiology & Surveillance</span>
          </div>
        </SelectItem>
        <SelectItem value="health-programs">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-4 h-4" />
            <span>Health Programs & NGOs</span>
          </div>
        </SelectItem>
        <SelectItem value="institution">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span>Research Institution</span>
          </div>
        </SelectItem>
        <SelectItem value="university">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            <span>University & Academic</span>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
};
