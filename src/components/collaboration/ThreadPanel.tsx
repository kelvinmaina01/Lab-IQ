import { useState, useRef, useEffect } from "react";
import { X, MessageSquare, Send, Loader2, Sparkles, Activity, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { useUnifiedChat } from "@/hooks/useUnifiedChat";
import { ChatMessage } from "@/core/interfaces";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface ThreadPanelProps {
    parentMessage: ChatMessage;
    channelId: string;
    onClose: () => void;
}

export const ThreadPanel = ({ parentMessage, channelId, onClose }: ThreadPanelProps) => {
    const { messages, loading, sendMessage } = useUnifiedChat(channelId, 'channel');
    const [reply, setReply] = useState("");
    const [isSending, setIsSending] = useState(false);

    // Filter messages that belong to this thread
    const threadMessages = messages.filter(m => (m as ChatMessage).parent_id === parentMessage.id);

    const handleSendReply = async () => {
        if (!reply.trim() || isSending) return;
        try {
            setIsSending(true);
            await sendMessage(reply.trim(), parentMessage.id);
            setReply("");
        } catch (error) {
            console.error("Failed to send reply:", error);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="w-[400px] border-l border-border/40 bg-background/95 backdrop-blur-xl flex flex-col h-full animate-in slide-in-from-right duration-500 shadow-2xl z-20">
            {/* Thread Header */}
            <div className="p-6 border-b border-border/30 flex items-center justify-between bg-muted/5">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                        <Activity className="h-4 w-4 text-primary animate-pulse" />
                    </div>
                    <div>
                        <h4 className="font-black text-[11px] uppercase tracking-[0.2em] text-foreground/80">Synapse Thread</h4>
                        <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter">Deep Analysis Node</p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="h-8 w-8 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-6 space-y-8">
                    {/* Root Intelligence (Parent Message) */}
                    <div className="relative group p-4 rounded-2xl bg-primary/[0.03] border border-primary/10 shadow-sm overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary/40" />
                        <div className="flex gap-4">
                            <Avatar className="h-10 w-10 border border-border/50 rounded-xl">
                                <AvatarImage src={parentMessage.user?.avatar_url} />
                                <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-black">{parentMessage.user?.display_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="font-black text-[13px] tracking-tight">{parentMessage.user?.display_name}</span>
                                    <span className="text-[10px] font-bold text-muted-foreground/40 italic">{format(new Date(parentMessage.created_at), 'h:mm a')}</span>
                                    <Badge variant="outline" className="ml-auto text-[8px] font-black bg-background/50">ROOT</Badge>
                                </div>
                                <p className="text-[14px] text-foreground/90 leading-relaxed font-medium">{parentMessage.content}</p>
                            </div>
                        </div>
                    </div>

                    {/* Scientific Continuity (Replies) */}
                    <div className="space-y-6 relative ml-4 pl-4 border-l border-border/30">
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles className="h-3.5 w-3.5 text-primary/50" />
                            <p className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">
                                {threadMessages.length} Insight{threadMessages.length === 1 ? '' : 's'} Logged
                            </p>
                        </div>

                        {threadMessages.map((msg: any) => (
                            <div key={msg.id} className="group relative flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="absolute -left-[21px] top-4 w-4 h-[1px] bg-border/30 group-hover:bg-primary/40 transition-colors" />
                                <Avatar className="h-9 w-9 border border-border/40 rounded-2xl bg-background group-hover:scale-105 transition-transform">
                                    <AvatarImage src={msg.user?.avatar_url} />
                                    <AvatarFallback className="text-[10px] font-black bg-muted/30">{msg.user?.display_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0 bg-muted/5 group-hover:bg-muted/10 p-3 rounded-2xl transition-colors">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span className="font-black text-[12px] tracking-tight">{msg.user?.display_name}</span>
                                        <span className="text-[9px] font-bold text-muted-foreground/40">{format(new Date(msg.created_at), 'h:mm a')}</span>
                                    </div>
                                    <p className="text-[13px] text-foreground/80 font-medium leading-relaxed">{msg.content}</p>
                                </div>
                            </div>
                        ))}

                        {threadMessages.length === 0 && !loading && (
                            <div className="text-center py-12 opacity-50">
                                <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground italic">Awaiting Scientific Input...</p>
                            </div>
                        )}
                    </div>
                </div>
            </ScrollArea>

            {/* Input Vector (Reply Input) */}
            <div className="p-6 border-t border-border/30 bg-muted/5">
                <div className="relative group/input">
                    <textarea
                        rows={3}
                        placeholder="Contribute to this analysis..."
                        className="w-full bg-background border border-border/60 rounded-2xl p-4 text-[13px] font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary/40 focus:outline-none resize-none transition-all shadow-sm"
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendReply())}
                    />
                    <div className="absolute right-3 bottom-3 flex items-center gap-2">
                        <p className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-tighter mr-2 group-focus-within/input:opacity-100 opacity-0 transition-opacity">Press Enter to Transmit</p>
                        <Button
                            size="icon"
                            className={cn(
                                "h-9 w-9 rounded-xl shadow-lg transition-all",
                                reply.trim() ? "bg-primary hover:bg-primary/90 scale-100" : "bg-muted text-muted-foreground scale-90"
                            )}
                            disabled={!reply.trim() || isSending}
                            onClick={handleSendReply}
                        >
                            {isSending ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Send className="h-4 w-4 text-white" />}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
