import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useServices } from "@/core/ServiceProvider";
import { toast } from "sonner";
import { UserPlus, Mail, Shield, CheckCircle2, Loader2 } from "lucide-react";
import { sanitizeEmail } from "@/utils/sanitize";

interface InviteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    labId: string;
}

export const InviteModal = ({ open, onOpenChange, labId }: InviteModalProps) => {
    const { collaboration } = useServices();
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("researcher");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();

        // Sanitize email to prevent XSS and validate format
        const sanitizedEmail = sanitizeEmail(email);
        if (!sanitizedEmail) {
            toast.error("Valid email is required");
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(sanitizedEmail)) {
            toast.error("Please enter a valid email address");
            return;
        }

        try {
            setLoading(true);
            const { error } = await collaboration.inviteMember(sanitizedEmail, role, labId);

            if (error) throw error;

            setSent(true);
            toast.success("Invitation dispatched!", {
                description: `A secure link has been sent to ${sanitizedEmail}.`
            });

            // Reset after 3 seconds or on close
            setTimeout(() => {
                if (!open) {
                    setSent(false);
                    setEmail("");
                }
            }, 3000);

        } catch (error: any) {
            console.error("Invite error:", error);
            toast.error("Failed to send invitation", {
                description: error.message || "Please check your network connection and try again."
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            onOpenChange(val);
            if (!val) {
                setTimeout(() => setSent(false), 300);
            }
        }}>
            <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl">
                {!sent ? (
                    <form onSubmit={handleInvite}>
                        <div className="bg-primary/5 p-6 border-b border-primary/10">
                            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                                <UserPlus className="h-6 w-6 text-primary" />
                            </div>
                            <DialogTitle className="text-2xl font-bold tracking-tight">Invite to Laboratory</DialogTitle>
                            <DialogDescription className="mt-1.5 text-muted-foreground">
                                Add a collaborator to this workspace. They will receive an email with an access link.
                            </DialogDescription>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="colleague@institute.edu"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10 h-11 border-muted hover:border-primary/50 transition-colors bg-muted/20 focus-visible:bg-background"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="role" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Workspace Role</Label>
                                <Select value={role} onValueChange={setRole}>
                                    <SelectTrigger id="role" className="h-11 border-muted bg-muted/20">
                                        <div className="flex items-center gap-2">
                                            <Shield className="h-4 w-4 text-muted-foreground" />
                                            <SelectValue placeholder="Select a role" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="researcher">
                                            <div className="flex flex-col py-0.5">
                                                <span className="font-semibold">Researcher</span>
                                                <span className="text-[10px] text-muted-foreground">Can chat, share files, and run experiments.</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="lead">
                                            <div className="flex flex-col py-0.5">
                                                <span className="font-semibold">Lab Lead</span>
                                                <span className="text-[10px] text-muted-foreground">Can manage projects and review drafts.</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="admin">
                                            <div className="flex flex-col py-0.5">
                                                <span className="font-semibold">Administrator</span>
                                                <span className="text-[10px] text-muted-foreground">Full access to billing and workspace settings.</span>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <DialogFooter className="p-6 bg-muted/10 border-t border-border mt-0 sm:justify-between items-center">
                            <p className="text-[10px] text-muted-foreground italic sm:block hidden max-w-[180px]">
                                Invitations are valid for 7 days.
                            </p>
                            <div className="flex gap-3">
                                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                                <Button type="submit" className="px-8 font-bold shadow-lg shadow-primary/20" disabled={loading || !email}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Sending...
                                        </>
                                    ) : "Send Invite"}
                                </Button>
                            </div>
                        </DialogFooter>
                    </form>
                ) : (
                    <div className="p-12 flex flex-col items-center text-center space-y-4 animate-in fade-in zoom-in duration-300">
                        <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center mb-2">
                            <CheckCircle2 className="h-10 w-10 text-green-500" />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">Invitation Sent!</h2>
                        <p className="text-muted-foreground max-w-[280px]">
                            We've sent an invitation specifically for <span className="text-foreground font-semibold">{email}</span>.
                        </p>
                        <Button
                            className="mt-4 w-full h-11 font-bold"
                            onClick={() => onOpenChange(false)}
                        >
                            Got it
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
