import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { MainLayout } from "@/components/layout/MainLayout";
import { ChevronRight, User, Bell, Shield, Cloud, CreditCard, LogOut, Moon, HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";

export default function Settings() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {
        // Sync with document class and local storage
        const isDark = document.documentElement.classList.contains('dark');
        setDarkMode(isDark);
    }, []);

    const toggleDarkMode = (checked: boolean) => {
        setDarkMode(checked);
        if (checked) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    const handleSignOut = async () => {
        try {
            await supabase.auth.signOut();
            toast({
                title: "Signed out",
                description: "You have been successfully signed out.",
            });
            navigate("/");
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to sign out.",
                variant: "destructive"
            });
        }
    };

    const handleComingSoon = () => {
        toast({
            title: "Coming Soon",
            description: "This feature is currently under development.",
        });
    }

    const settingsGroups = [
        {
            title: "Account",
            items: [
                {
                    icon: User,
                    label: "Profile Information",
                    description: "Update your name, bio, and avatar",
                    path: "/settings/profile"
                },
                {
                    icon: Shield,
                    label: "Security & Authentication",
                    description: "Manage password and active sessions",
                    action: handleComingSoon
                }
            ]
        },
        {
            title: "Preferences",
            items: [
                {
                    icon: Bell,
                    label: "Notifications",
                    description: "Configure email and push alerts",
                    path: "/settings/notifications"
                },
                {
                    icon: Moon,
                    label: "Appearance",
                    description: "Toggle dark mode and display settings",
                    customAction: (
                        <div className="flex items-center gap-2">
                            <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
                        </div>
                    )
                }
            ]
        },
        {
            title: "Workspace",
            items: [
                {
                    icon: Cloud,
                    label: "Storage & Data",
                    description: "Manage your datasets and storage limits",
                    path: "/datasets"
                },
                {
                    icon: CreditCard,
                    label: "Billing & Plans",
                    description: "View subscription and payment methods",
                    path: "/pricing"
                }
            ]
        },
        {
            title: "Support",
            items: [
                {
                    icon: HelpCircle,
                    label: "Help & Documentation",
                    description: "Guides, tutorials, and support",
                    action: handleComingSoon
                }
            ]
        }
    ];

    return (
        <AuthGuard>
            <MainLayout>
                <main className="p-4 md:p-8 space-y-8 max-w-5xl mx-auto w-full">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                        <p className="text-muted-foreground">Manage your account, preferences, and workspace settings.</p>
                    </div>

                    <div className="grid gap-8">
                        {settingsGroups.map((group, groupIdx) => (
                            <div key={groupIdx} className="space-y-4">
                                <h2 className="text-lg font-semibold">{group.title}</h2>
                                <div className="grid gap-4 md:grid-cols-2">
                                    {group.items.map((item, itemIdx) => {
                                        const Icon = item.icon;
                                        return (
                                            <Card
                                                key={itemIdx}
                                                className={`hover:bg-muted/40 transition-colors ${item.path || item.action ? 'cursor-pointer' : ''}`}
                                                onClick={() => {
                                                    if (item.path) navigate(item.path);
                                                    else if (item.action) item.action();
                                                }}
                                            >
                                                <div className="p-6 flex items-start gap-4">
                                                    <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                                                        <Icon className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div className="flex-1 space-y-1">
                                                        <div className="flex items-center justify-between">
                                                            <h3 className="font-medium leading-none">{item.label}</h3>
                                                            {item.customAction ? item.customAction : (
                                                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                                            {item.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        <div className="pt-8">
                            <Button variant="destructive" className="w-full md:w-auto" onClick={handleSignOut}>
                                <LogOut className="mr-2 h-4 w-4" />
                                Sign Out
                            </Button>
                        </div>
                    </div>
                </main>
            </MainLayout>
        </AuthGuard>
    );
}
