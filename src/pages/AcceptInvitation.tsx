import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useServices } from '@/core/ServiceProvider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
    FlaskConical,
    ShieldCheck,
    ArrowRight,
    UserPlus,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Atom,
    Zap,
    Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AcceptInvitation = () => {
    const { collaboration, auth } = useServices();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);
    const [invitation, setInvitation] = useState<any>(null);
    const [lab, setLab] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        if (!token) {
            setError("No invitation token found in the URL.");
            setLoading(false);
            return;
        }
        checkStatus();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const checkStatus = async () => {
        try {
            console.log('[AcceptInvitation] Starting invitation check for token:', token);
            setLoading(true);

            // 1. Check if user is logged in
            console.log('[AcceptInvitation] Checking authentication status...');
            const currentUser = await auth.getUser();
            console.log('[AcceptInvitation] Current user:', currentUser?.email || 'Not logged in');
            setUser(currentUser);

            // 2. Fetch invitation
            console.log('[AcceptInvitation] Fetching invitation from database...');
            const { data: invite, error: inviteError } = await supabase
                .from('team_invitations')
                .select('*, labs(name)')
                .or(`invitation_token.eq.${token},token.eq.${token}`)
                .single();

            if (inviteError || !invite) {
                console.error('[AcceptInvitation] ❌ Invite fetch error:', inviteError);
                setError("Invitation not found or has expired.");
                setLoading(false);
                return;
            }

            console.log('[AcceptInvitation] ✅ Invitation found:', { email: invite.email, role: invite.role, lab: invite.labs?.name });

            if (invite.accepted_at) {
                console.log('[AcceptInvitation] ⚠️ Invitation already accepted at:', invite.accepted_at);
                toast.info("This invitation has already been accepted.");
                navigate('/collaboration');
                return;
            }

            setInvitation(invite);
            setLab(invite.labs);
            console.log('[AcceptInvitation] ✅ Ready for acceptance');
            setLoading(false);
        } catch (err: any) {
            console.error('[AcceptInvitation] ❌ Status check error:', err);
            setError("Failed to verify invitation status.");
            setLoading(false);
        }
    };

    const handleAccept = async () => {
        if (!user) {
            console.log('[AcceptInvitation] User not logged in, redirecting to login...');
            navigate(`/login?token=${token}&redirect=/accept-invitation`);
            return;
        }

        try {
            console.log('[AcceptInvitation] Starting acceptance process...');
            setVerifying(true);

            console.log('[AcceptInvitation] Calling acceptInvitation service...');
            const { error: joinError } = await (collaboration as any).acceptInvitation(token);

            if (joinError) {
                console.error('[AcceptInvitation] ❌ Join error:', joinError);
                throw joinError;
            }

            console.log('[AcceptInvitation] ✅ Successfully joined lab:', lab?.name);
            toast.success("Welcome aboard!", {
                description: `You have successfully joined ${lab?.name || 'the lab'}.`
            });

            // Redirect to collaboration
            console.log('[AcceptInvitation] Redirecting to collaboration page...');
            setTimeout(() => {
                navigate('/collaboration');
            }, 1500);

        } catch (err: any) {
            console.error('[AcceptInvitation] ❌ Accept error:', err);
            toast.error("Failed to accept invitation", {
                description: err.message
            });
            setVerifying(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-cyan-500/5" />
                <div className="relative z-10 w-full max-w-md p-8 text-center space-y-6">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
                        <Atom className="w-8 h-8 text-primary animate-spin-slow" />
                    </div>
                    <div className="space-y-3">
                        <Skeleton className="h-8 w-64 mx-auto bg-muted/60" />
                        <Skeleton className="h-4 w-48 mx-auto bg-muted/60" />
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 via-background to-orange-500/5" />
                <Card className="relative z-10 w-full max-w-md p-8 text-center space-y-6 border-destructive/20 shadow-2xl backdrop-blur-xl bg-background/60">
                    <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto text-destructive">
                        <AlertCircle className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black tracking-tight text-foreground">Protocol Interrupted</h2>
                        <p className="text-muted-foreground text-sm leading-relaxed">{error}</p>
                    </div>
                    <Button variant="outline" className="w-full h-11" onClick={() => navigate('/')}>Return to Base</Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
            {/* Science Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-cyan-500/5" />
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] opacity-50" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative z-10 w-full max-w-[500px] px-6"
            >
                <Card className="overflow-hidden border-primary/20 shadow-[0_32px_64px_-12px_rgba(var(--primary-rgb),0.15)] backdrop-blur-xl bg-background/80">
                    {/* Header Banner */}
                    <div className="bg-primary/10 p-8 border-b border-primary/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Zap className="w-24 h-24 text-primary" />
                        </div>
                        <div className="flex items-center gap-4 mb-6 relative z-10">
                            <div className="h-14 w-14 rounded-2xl bg-background shadow-lg flex items-center justify-center border border-primary/20">
                                <FlaskConical className="w-7 h-7 text-primary" />
                            </div>
                            <div className="h-0.5 w-8 bg-primary/30 rounded-full" />
                            <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center border-2 border-white/50">
                                <Users className="w-7 h-7 text-primary" />
                            </div>
                        </div>
                        <Badge className="mb-4 bg-primary text-primary-foreground font-black px-3 py-1 uppercase tracking-widest text-[10px]">Security Clearance Pending</Badge>
                        <h1 className="text-3xl font-black tracking-tighter text-foreground mb-2 leading-none uppercase">You've Been Selected</h1>
                        <p className="text-muted-foreground text-sm font-medium">Invitation to join <span className="text-foreground font-bold">{lab?.name || "Premium Laboratory"}</span></p>
                    </div>

                    {/* Content */}
                    <div className="p-8 space-y-8">
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-muted/30 border border-border/40 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Assigned Role</span>
                                    <Badge variant="outline" className="text-primary font-bold border-primary/30 bg-primary/5 uppercase">{invitation?.role}</Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Verified Target</span>
                                    <span className="text-xs font-bold font-mono">{invitation?.email}</span>
                                </div>
                            </div>

                            <p className="text-sm text-muted-foreground leading-relaxed italic">
                                "Collaborate on high-intelligence research projects, synchronize experimental data via quantum-safe channels, and leverage our proprietary AI Context Engine."
                            </p>
                        </div>

                        <div className="space-y-4 pt-4">
                            {user ? (
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Identified as</p>
                                        <p className="text-sm font-black">{user.email}</p>
                                    </div>
                                    <Button variant="ghost" size="sm" className="text-[10px] h-7" onClick={() => navigate('/login')}>Switch</Button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                                    <AlertCircle className="h-5 w-5 text-amber-500" />
                                    <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Authentication Required to Proceed</p>
                                </div>
                            )}

                            <Button
                                onClick={handleAccept}
                                disabled={verifying}
                                className="w-full h-14 rounded-2xl font-black text-lg uppercase tracking-tight shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {verifying ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Authorizing...
                                    </>
                                ) : (
                                    <>
                                        {user ? "Initialize Synchronization" : "Authenticate & Join"}
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </>
                                )}
                            </Button>

                            <p className="text-center text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] pt-2">
                                <ShieldCheck className="h-3 w-3 inline mr-1 mb-0.5" /> End-to-End Encrypted Protocol
                            </p>
                        </div>
                    </div>
                </Card>
            </motion.div>
        </div>
    );
};

export default AcceptInvitation;
