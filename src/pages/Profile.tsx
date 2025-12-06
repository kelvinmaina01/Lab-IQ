import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
    User,
    Settings,
    MapPin,
    Globe,
    Building,
    Save,
    Camera,
    Briefcase,
    Mail,
    Shield,
    Loader2
} from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { MainLayout } from "@/components/layout/MainLayout";
import { LabProfileSelector } from "@/components/dashboard/LabProfileSelector";

interface UserProfile {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
    job_title?: string;
    organization?: string;
    bio?: string;
    website?: string;
    location?: string;
}

export default function ProfilePage() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // In this app, we are storing some metadata in auth.users user_metadata
            // But we will also check if a profiles table exists or we just use metadata.
            // Based on previous checks, we don't have a visible 'profiles' table for these details, 
            // so we will primarily use user_metadata which is standard for simple profiles.

            const { user_metadata } = user;

            setProfile({
                id: user.id,
                email: user.email || "",
                full_name: user_metadata?.full_name || "",
                avatar_url: user_metadata?.avatar_url || "",
                job_title: user_metadata?.job_title || "",
                organization: user_metadata?.organization || "",
                bio: user_metadata?.bio || "",
                website: user_metadata?.website || "",
                location: user_metadata?.location || "",
            });

            if (user_metadata?.avatar_url) {
                setPreviewUrl(user_metadata.avatar_url);
            }

        } catch (error) {
            console.error("Error fetching profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const saveProfile = async () => {
        if (!profile) return;
        setSaving(true);
        try {
            let avatar_url = profile.avatar_url;

            // Upload avatar if changed
            if (avatarFile) {
                const fileExt = avatarFile.name.split('.').pop();
                const filePath = `${profile.id}/avatar.${fileExt}`;

                // Ensure bucket exists (handling if logic fails normally)
                // We'll try to upload to 'avatars' bucket
                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, avatarFile, { upsert: true });

                if (!uploadError) {
                    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
                    avatar_url = data.publicUrl;
                } else {
                    console.log("Avatar upload failed (bucket might not exist), proceeding with metadata update only.");
                }
            }

            // Update Auth Metadata
            const { data, error } = await supabase.auth.updateUser({
                data: {
                    full_name: profile.full_name,
                    avatar_url: avatar_url,
                    job_title: profile.job_title,
                    organization: profile.organization,
                    bio: profile.bio,
                    website: profile.website,
                    location: profile.location,
                }
            });

            if (error) throw error;

            toast({
                title: "Profile Updated",
                description: "Your profile information has been saved successfully.",
            });

        } catch (error) {
            console.error("Error saving profile:", error);
            toast({
                title: "Error",
                description: "Failed to save profile changes.",
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
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </AuthGuard>
        )
    }



    return (
        <AuthGuard>
            <MainLayout>
                <main className="p-4 md:p-8 max-w-6xl mx-auto w-full space-y-8">

                    {/* Header Section */}
                    <div className="relative mb-12">
                        {/* Cover Image Placeholder */}
                        <div className="h-48 w-full bg-gradient-to-r from-primary/20 via-primary/5 to-secondary/20 rounded-xl border border-border/50"></div>

                        {/* Profile Card Header */}
                        <div className="absolute -bottom-10 left-8 flex items-end gap-6">
                            <div className="relative group">
                                <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                                    <AvatarImage src={previewUrl || ""} />
                                    <AvatarFallback className="text-4xl bg-primary/10 text-primary">
                                        {profile?.full_name ? profile.full_name[0].toUpperCase() : <User />}
                                    </AvatarFallback>
                                </Avatar>
                                <label
                                    htmlFor="avatar-upload"
                                    className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-lg cursor-pointer hover:bg-primary/90 transition-colors"
                                >
                                    <Camera className="h-4 w-4" />
                                    <input
                                        id="avatar-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                </label>
                            </div>
                            <div className="mb-4 space-y-1">
                                <h1 className="text-3xl font-bold">{profile?.full_name || "User Profile"}</h1>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Briefcase className="h-4 w-4" />
                                    <span>{profile?.job_title || "Researcher"}</span>
                                    {profile?.organization && (
                                        <>
                                            <span>•</span>
                                            <Building className="h-4 w-4" />
                                            <span>{profile.organization}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Top Actions */}
                        <div className="absolute bottom-4 right-4 flex gap-2">
                            <Button variant="outline" className="gap-2" onClick={() => navigate('/settings')}>
                                <Settings className="h-4 w-4" /> Settings
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
                        {/* Left Column: Info & Lab Type */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Lab Profile</CardTitle>
                                    <CardDescription>Select your research environment</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <LabProfileSelector />
                                    <p className="text-xs text-muted-foreground mt-4">
                                        This customizes your experience and available tools.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Contact Info</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-3 text-sm">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <span className="truncate">{profile?.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <Globe className="h-4 w-4 text-muted-foreground" />
                                        <Input
                                            className="h-8"
                                            placeholder="Website URL"
                                            value={profile?.website || ""}
                                            onChange={(e) => setProfile(prev => prev ? { ...prev, website: e.target.value } : null)}
                                        />
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                        <Input
                                            className="h-8"
                                            placeholder="Location"
                                            value={profile?.location || ""}
                                            onChange={(e) => setProfile(prev => prev ? { ...prev, location: e.target.value } : null)}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column: Edit Form */}
                        <div className="md:col-span-2 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Personal Information</CardTitle>
                                    <CardDescription>Update your personal details and bio.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Full Name</Label>
                                            <Input
                                                value={profile?.full_name || ""}
                                                onChange={(e) => setProfile(prev => prev ? { ...prev, full_name: e.target.value } : null)}
                                                placeholder="Dr. Jane Doe"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Job Title</Label>
                                            <Input
                                                value={profile?.job_title || ""}
                                                onChange={(e) => setProfile(prev => prev ? { ...prev, job_title: e.target.value } : null)}
                                                placeholder="Principal Investigator"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Organization / Lab Name</Label>
                                        <Input
                                            value={profile?.organization || ""}
                                            onChange={(e) => setProfile(prev => prev ? { ...prev, organization: e.target.value } : null)}
                                            placeholder="Research Institute of Technology"
                                            prefix={<Building className="h-4 w-4 text-muted-foreground" />}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Bio</Label>
                                        <Textarea
                                            value={profile?.bio || ""}
                                            onChange={(e) => setProfile(prev => prev ? { ...prev, bio: e.target.value } : null)}
                                            placeholder="Tell us about your research interests..."
                                            className="min-h-[120px]"
                                        />
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-between border-t px-6 py-4">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Shield className="h-4 w-4" />
                                        <span>Your data is secure</span>
                                    </div>
                                    <Button onClick={saveProfile} disabled={saving}>
                                        {saving ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="mr-2 h-4 w-4" />
                                                Save Changes
                                            </>
                                        )}
                                    </Button>
                                </CardFooter>
                            </Card>
                        </div>
                    </div>

                </main>
            </MainLayout>
        </AuthGuard>
    );
}
