import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, Mail, Github, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { OnboardingQuestion } from "./OnboardingQuestion";

// Google Icon SVG
const GoogleIcon = () => (
    <svg role="img" viewBox="0 0 24 24" className="w-4 h-4 mr-2" fill="currentColor">
        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .533 5.333.533 12S5.867 24 12.48 24c3.44 0 6.027-1.133 8.12-3.32 2.147-2.147 2.813-5.28 2.813-7.933 0-.747-.067-1.48-.187-2.173l-10.747-.006z" />
    </svg>
);

export const AuthCard = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    // In a real app, this would be determined by whether the user just signed up
    const [showOnboarding, setShowOnboarding] = useState(false);
    const navigate = useNavigate();
    const { signIn, signUp, signInWithGoogle, signInWithGithub } = useAuth();
    const { toast } = useToast();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;
        setLoading(true);
        try {
            const { error } = await signIn(email, password);
            if (error) throw error;
            toast({ title: "Welcome back!", description: "Successfully logged in." });
            navigate("/dashboard");
        } catch (error: any) {
            toast({ title: "Login failed", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;
        setLoading(true);
        try {
            const { error } = await signUp(email, password);
            if (error) throw error;
            toast({ title: "Account created!", description: "Please check your email to verify." });
            // Simulate transition to onboarding for demo purposes
            setShowOnboarding(true);
        } catch (error: any) {
            toast({ title: "Signup failed", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleMagicLink = async () => {
        if (!email) {
            toast({ title: "Email required", description: "Please enter your email to send a magic link.", variant: "destructive" });
            return;
        }
        setLoading(true);
        // Simulate magic link for V1 demo
        setTimeout(() => {
            toast({ title: "Magic Link Sent", description: `Check ${email} for your login link.` });
            setLoading(false);
        }, 1500);
    };

    const handleOnboardingComplete = (mode: string) => {
        toast({ title: "Workspace Ready", description: `Setting up ${mode} mode environment...` });
        // In real app: Update user profile here
        setTimeout(() => {
            navigate("/dashboard");
        }, 1000);
    };

    if (showOnboarding) {
        return <OnboardingQuestion onComplete={handleOnboardingComplete} />;
    }

    return (
        <div className="w-full space-y-6">
            <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-transparent mb-8">
                    <TabsTrigger
                        value="login"
                        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none h-12 text-slate-500 font-medium text-base transition-all"
                    >
                        Sign In
                    </TabsTrigger>
                    <TabsTrigger
                        value="signup"
                        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none h-12 text-slate-500 font-medium text-base transition-all"
                    >
                        Create Account
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-8 animate-fade-in-up">
                    <div className="space-y-2 text-center">
                        <h1 className="text-3xl font-bold tracking-tight text-white">Welcome back</h1>
                        <p className="text-slate-400">Sign in to continue your journey</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="sr-only">Email</Label>
                                <Input
                                    id="email"
                                    placeholder="name@example.com"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={loading}
                                    className="h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:bg-white/10 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password" className="sr-only">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
                                    className="h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:bg-white/10 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all"
                                />
                                <div className="flex justify-end">
                                    <Button variant="link" className="px-0 h-auto text-sm text-blue-400 hover:text-blue-300 font-normal">
                                        Forgot password?
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <Button type="submit" className="w-full h-12 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all text-base hover:scale-[1.02]" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                            Sign In
                        </Button>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-white/10" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-[#030712] px-2 text-slate-500 font-medium">
                                    Or
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Button variant="outline" type="button" disabled={loading} onClick={signInWithGithub} className="h-11 bg-white/5 border-white/10 hover:bg-white/10 text-white transition-all">
                                <Github className="mr-2 h-4 w-4" />
                                GitHub
                            </Button>
                            <Button variant="outline" type="button" disabled={loading} onClick={signInWithGoogle} className="h-11 bg-white/5 border-white/10 hover:bg-white/10 text-white transition-all">
                                <GoogleIcon />
                                Google
                            </Button>
                        </div>
                    </form>
                </TabsContent>

                <TabsContent value="signup" className="space-y-8 animate-fade-in-up">
                    <div className="space-y-2 text-center">
                        <h1 className="text-3xl font-bold tracking-tight text-white">Get Started</h1>
                        <p className="text-slate-400">Create your free account today</p>
                    </div>

                    <form onSubmit={handleSignup} className="space-y-5">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email-signup" className="sr-only">Email</Label>
                                <Input
                                    id="email-signup"
                                    placeholder="name@example.com"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={loading}
                                    className="h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:bg-white/10 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password-signup" className="sr-only">Password</Label>
                                <Input
                                    id="password-signup"
                                    type="password"
                                    placeholder="Create a password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
                                    className="h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:bg-white/10 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all"
                                />
                                <p className="text-xs text-slate-400 px-1">At least 8 characters</p>
                            </div>
                        </div>

                        <Button type="submit" className="w-full h-12 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all text-base hover:scale-[1.02]" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                            Create Account
                        </Button>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-white/10" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-[#030712] px-2 text-slate-500 font-medium">
                                    Or
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Button variant="outline" type="button" disabled={loading} onClick={signInWithGithub} className="h-11 bg-white/5 border-white/10 hover:bg-white/10 text-white transition-all">
                                <Github className="mr-2 h-4 w-4" />
                                GitHub
                            </Button>
                            <Button variant="outline" type="button" disabled={loading} onClick={signInWithGoogle} className="h-11 bg-white/5 border-white/10 hover:bg-white/10 text-white transition-all">
                                <GoogleIcon />
                                Google
                            </Button>
                        </div>
                    </form>
                </TabsContent>
            </Tabs>
        </div>
    );
};
