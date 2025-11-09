import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FlaskConical, Microscope, Dna, Cpu, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const LabProfileSelector = () => {
  const [selectedProfile, setSelectedProfile] = useState<string>("clinical");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('lab_profiles')
        .select('profile_type')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) setSelectedProfile(data.profile_type);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = async (value: string) => {
    setSelectedProfile(value);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('lab_profiles')
        .upsert({ user_id: user.id, profile_type: value }, { onConflict: 'user_id' });

      if (error) throw error;
      
      toast({
        title: "Profile updated",
        description: "Your lab profile has been saved successfully.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to save lab profile.",
        variant: "destructive",
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
        <SelectValue placeholder="Select lab profile" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="clinical">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4" />
            <span>Clinical Lab</span>
          </div>
        </SelectItem>
        <SelectItem value="drug-discovery">
          <div className="flex items-center gap-2">
            <Microscope className="w-4 h-4" />
            <span>AI Drug Discovery</span>
          </div>
        </SelectItem>
        <SelectItem value="synthetic-bio">
          <div className="flex items-center gap-2">
            <Dna className="w-4 h-4" />
            <span>Synthetic Bio</span>
          </div>
        </SelectItem>
        <SelectItem value="computational-genomics">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4" />
            <span>Computational Genomics</span>
          </div>
        </SelectItem>
        <SelectItem value="university">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            <span>University Research</span>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
};
