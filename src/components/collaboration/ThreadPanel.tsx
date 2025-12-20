import { useState, useRef, useEffect } from "react";
import { X, MessageSquare, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { useUnifiedChat } from "@/hooks/useUnifiedChat";
import { ChatMessage } from "@/core/interfaces";
import { cn } from "@/lib/utils";

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
        <div className="w-96 border-l bg-background flex flex-col h-full animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b flex items-center justify-between bg-muted/10">
                <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <h4 className="font-bold text-sm">Thread</h4>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-4 space-y-6">
                    {/* Parent Message */}
                    <div className="flex gap-3 pb-4 border-b">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={parentMessage.user?.avatar_url} />
                            <AvatarFallback>{parentMessage.user?.display_name?.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2 mb-1">
                                <span className="font-bold text-xs">{parentMessage.user?.display_name}</span>
                                <span className="text-[10px] text-muted-foreground">{format(new Date(parentMessage.created_at), 'h:mm a')}</span>
                            </div>
                            <p className="text-sm text-foreground/80 leading-relaxed">{parentMessage.content}</p>
                        </div>
                    </div>

                    {/* Replies */}
                    <div className="space-y-4">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                            {threadMessages.length} {threadMessages.length === 1 ? 'Reply' : 'Replies'}
                        </p>
                        {threadMessages.map((msg: any) => (
                            <div key={msg.id} className="flex gap-3 animate-in fade-in slide-in-from-bottom-1">
                                <Avatar className="h-7 w-7">
                                    <AvatarImage src={msg.user?.avatar_url} />
                                    <AvatarFallback className="text-[10px]">{msg.user?.display_name?.substring(0, 2)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex items-baseline gap-2 mb-0.5">
                                        <span className="font-bold text-[11px]">{msg.user?.display_name}</span>
                                        <span className="text-[9px] text-muted-foreground">{format(new Date(msg.created_at), 'h:mm a')}</span>
                                    </div>
                                    <p className="text-xs text-foreground/90">{msg.content}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </ScrollArea>

            {/* Reply Input */}
            <div className="p-4 border-t">
                <div className="relative">
                    <textarea
                        rows={2}
                        placeholder="Reply to thread..."
                        className="w-full bg-muted/30 border border-muted-foreground/20 rounded-lg p-3 text-xs focus:ring-1 focus:ring-primary focus:outline-none resize-none"
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendReply())}
                    />
                    <Button
                        size="icon"
                        className="absolute right-2 bottom-2 h-7 w-7 rounded-md"
                        disabled={!reply.trim() || isSending}
                        onClick={handleSendReply}
                    >
                        {isSending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    </Button>
                </div>
            </div>
        </div>
    );
};
