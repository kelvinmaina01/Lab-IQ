import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { useState, useRef, useCallback, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Smile, Send, Loader2, Hash, Bell, MoreVertical,
    Bold, Italic, Code, Link as LinkIcon, Bot, User, ShieldCheck,
    Search, MessageSquare, AtSign, Plus,
    Database, FileText, TestTube, ExternalLink, Users
} from "lucide-react";
import { format } from "date-fns";
import { useServices } from "@/core/ServiceProvider";
import { useUnifiedChat } from "@/hooks/useUnifiedChat";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import { toast } from "sonner";
import { debounce } from "@/utils/debounce";
import { cn } from "@/lib/utils";
import { sanitizeText } from "@/utils/sanitize";
import { CanvasView } from "./CanvasView";
import { ListView } from "./ListView";
import { ResourceShareModal } from "./ResourceShareModal";
import { motion } from "framer-motion";

interface UnifiedChatPanelProps {
    id: string | null;
    labId: string;
    type: 'channel' | 'dm' | 'canvas' | 'list';
    title?: string;
    onThreadOpen?: (message: any) => void;
}

export const UnifiedChatPanel = ({ id, labId, type, title, onThreadOpen }: UnifiedChatPanelProps) => {
    const isChatType = type === 'channel' || type === 'dm';
    const { messages, loading, sendMessage } = useUnifiedChat(id || '', isChatType ? type : 'channel');
    const { typingUsers, startTyping, stopTyping } = useTypingIndicator(type === 'channel' ? id : null);
    const virtuosoRef = useRef<VirtuosoHandle>(null);
    const { auth } = useServices();

    const [newMessage, setNewMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);

    const debouncedStartTyping = useMemo(
        () => debounce(() => { if (type === 'channel') startTyping(); }, 300),
        [startTyping, type]
    );

    const handleSendMessage = useCallback(async () => {
        if (!newMessage.trim() || isSending || !id) return;

        try {
            setIsSending(true);
            await sendMessage(newMessage.trim());
            setNewMessage("");
            if (type === 'channel') stopTyping();

            setTimeout(() => {
                virtuosoRef.current?.scrollToIndex({
                    index: messages.length,
                    behavior: 'smooth'
                });
            }, 100);
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message');
        } finally {
            setIsSending(false);
        }
    }, [newMessage, isSending, id, type, sendMessage, stopTyping, messages.length]);

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const renderResourceCard = (metadata: any) => {
        if (!metadata || !metadata.isResourceCard) return null;

        const type = metadata.resourceType as 'dataset' | 'report' | 'experiment';
        const icons = {
            dataset: <Database className="w-5 h-5 text-blue-400" />,
            report: <FileText className="w-5 h-5 text-emerald-400" />,
            experiment: <TestTube className="w-5 h-5 text-amber-400" />
        };

        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 p-4 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-all group/card cursor-pointer max-w-sm"
            >
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        {icons[type] || <Database className="w-5 h-5" />}
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{type} Shared</span>
                    </div>
                    <Badge variant="outline" className="text-[9px] bg-background/50">NATIVE SYNC</Badge>
                </div>
                <h4 className="text-sm font-bold text-foreground mb-1 group-hover/card:text-primary transition-colors">
                    {metadata.name || `Scientific ${type}`}
                </h4>
                <p className="text-xs text-muted-foreground line-clamp-1 mb-3">
                    {metadata.description || "Interactive scientific asset linked from LabIQ Health core."}
                </p>
                <div className="flex items-center justify-between">
                    <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1.5 rounded-lg border-primary/20 hover:border-primary/50">
                        View Resource <ExternalLink className="w-3 h-3" />
                    </Button>
                    <span className="text-[10px] text-muted-foreground/50">ID: {metadata.resourceId?.substring(0, 8)}</span>
                </div>
            </motion.div>
        );
    };

    const renderMessageContent = (msg: any) => {
        let content = msg.content;
        // Sanitize user input to prevent XSS
        let formatted = sanitizeText(content);

        // Apply @LabAI mentions highlighting
        formatted = formatted.replace(/@LabAI/gi, '<span class="bg-primary/20 text-primary px-1 rounded font-bold">@LabAI</span>');

        return formatted;
    };

    const renderChat = () => (
        <div className="flex flex-col h-full bg-background overflow-hidden relative">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b shrink-0 bg-muted/5 backdrop-blur-xl z-10">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/5 to-cyan-500/10 flex items-center justify-center border border-primary/20 shadow-inner">
                        {type === 'channel' ? <Hash className="w-6 h-6 text-primary" /> : <User className="w-6 h-6 text-primary" />}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="font-extrabold text-lg tracking-tight">{title || (type === 'channel' ? 'General' : 'Direct Message')}</h3>
                            {type === 'channel' && (
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                    <ShieldCheck className="h-3 w-3 text-emerald-500" />
                                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wider">Verified Stream</span>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.1em]">
                                {type === 'channel' ? 'Active Project Node' : 'Encrypted Synapse'}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="hidden md:flex items-center gap-1 mr-4 px-3 py-1.5 rounded-xl bg-muted/30 border border-border/40">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-[11px] font-bold text-muted-foreground">{messages.length > 0 ? new Set(messages.map(m => m.user_id)).size : 0} Peers</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-primary/5 hover:text-primary transition-all">
                        <Search className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-primary/5 hover:text-primary transition-all">
                        <Bell className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-primary/5 hover:text-primary transition-all">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-hidden relative bg-gradient-to-b from-muted/5 to-transparent">
                {loading ? (
                    <div className="p-8 space-y-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="flex gap-4">
                                <Skeleton className="h-10 w-10 rounded-xl" />
                                <div className="space-y-3 flex-1">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-20 w-3/4 rounded-2xl" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <Virtuoso
                        ref={virtuosoRef}
                        data={messages}
                        followOutput="auto"
                        alignToBottom
                        itemContent={(index, msg: any) => (
                            <div className={cn(
                                "group px-6 py-4 transition-all border-l-2 border-transparent hover:border-primary/30",
                                msg.is_bot ? "bg-primary/5 border-l-primary/40" : "hover:bg-muted/20"
                            )}>
                                <div className="flex items-start gap-5">
                                    <div className="relative shrink-0">
                                        <Avatar className={cn(
                                            "h-10 w-10 border shadow-sm transition-transform group-hover:scale-105",
                                            msg.is_bot ? "border-primary/30 rounded-xl bg-primary/10" : "border-border/60 rounded-2xl bg-background"
                                        )}>
                                            <AvatarImage src={msg.user?.avatar_url} />
                                            <AvatarFallback className="bg-primary/5 text-primary font-black text-[10px]">
                                                {msg.is_bot ? <Bot className="h-5 w-5" /> : (msg.user?.display_name?.substring(0, 2).toUpperCase() || 'U')}
                                            </AvatarFallback>
                                        </Avatar>
                                        {!msg.is_bot && (
                                            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-background" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className={cn(
                                                "font-black text-[13px] tracking-tight hover:underline cursor-pointer",
                                                msg.is_bot ? "text-primary" : "text-foreground/90"
                                            )}>
                                                {msg.is_bot ? "LabAI Assistant" : (msg.user?.display_name || 'Anonymous Researcher')}
                                            </span>
                                            {msg.is_bot && (
                                                <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 text-[8px] font-black h-4 uppercase tracking-widest px-1.5">
                                                    AI AGENT
                                                </Badge>
                                            )}
                                            <span className="text-[10px] font-bold text-muted-foreground/50">{format(new Date(msg.created_at), 'h:mm a')}</span>
                                        </div>
                                        <div
                                            className={cn(
                                                "text-[14px] leading-relaxed whitespace-pre-wrap break-words prose prose-sm dark:prose-invert max-w-none font-medium",
                                                msg.is_bot ? "text-foreground" : "text-foreground/85"
                                            )}
                                            dangerouslySetInnerHTML={{ __html: renderMessageContent(msg) }}
                                        />
                                        {msg.metadata?.isResourceCard && renderResourceCard(msg.metadata)}
                                        {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                            <div className="flex gap-2 mt-3 flex-wrap">
                                                {Object.entries(msg.reactions).map(([emoji, users]: [string, any]) => (
                                                    <Badge key={emoji} variant="outline" className="h-7 px-2 py-0 bg-background/50 text-[11px] font-black hover:bg-primary/5 border-border/60 cursor-pointer shadow-sm transition-all hover:scale-105 active:scale-95">
                                                        {emoji} <span className="ml-1 text-muted-foreground">{users.length}</span>
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-all flex items-center bg-background/80 backdrop-blur-md border border-border/60 rounded-xl shadow-xl p-1 mt-[-8px] mr-2 scale-95 group-hover:scale-100">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"><Smile className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary" onClick={() => onThreadOpen?.(msg)}><MessageSquare className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"><MoreVertical className="h-4 w-4" /></Button>
                                    </div>
                                </div>
                            </div>
                        )}
                        className="h-full scrollbar-hidden"
                    />
                )}
            </div>

            {/* Input */}
            <div className="p-4 pt-1 shrink-0">
                <div className="border rounded-xl bg-background shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30 transition-all overflow-hidden group">
                    <div className="flex items-center gap-1 px-3 py-1 bg-muted/20 border-b border-border/50">
                        <Button variant="ghost" size="icon" className="h-7 w-7"><Bold className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><Italic className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><Code className="h-3.5 w-3.5" /></Button>
                        <div className="w-px h-4 bg-border mx-1" />
                        <Button variant="ghost" size="icon" className="h-7 w-7"><LinkIcon className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><AtSign className="h-3.5 w-3.5" /></Button>
                    </div>
                    <div className="flex items-end gap-2 p-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 shrink-0 opacity-40 hover:opacity-100"
                            onClick={() => setIsResourceModalOpen(true)}
                        >
                            <Plus className="h-5 w-5" />
                        </Button>
                        <textarea
                            rows={1}
                            placeholder={type === 'channel' ? `Message #${title || 'channel'}` : `Message ${title || 'user'}`}
                            className="flex-1 bg-transparent border-none focus:ring-0 resize-none text-sm py-2 min-h-[40px] max-h-[300px]"
                            value={newMessage}
                            onChange={(e) => {
                                setNewMessage(e.target.value);
                                if (type === 'channel') debouncedStartTyping();
                            }}
                            onKeyDown={handleKeyPress}
                        />
                        <Button
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim() || isSending}
                            size="icon"
                            className={cn("h-9 w-9 shrink-0 transition-all rounded-lg", newMessage.trim() ? "bg-primary text-primary-foreground shadow-md" : "bg-muted text-muted-foreground")}
                        >
                            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
                <div className="flex items-center justify-between mt-1 px-1">
                    <div className="flex items-center gap-2">
                        {typingUsers.length > 0 && (
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1 animate-pulse">
                                <span className="font-bold">{typingUsers[0]}</span> {typingUsers.length > 1 ? `and ${typingUsers.length - 1} others are` : 'is'} typing...
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <ResourceShareModal
                isOpen={isResourceModalOpen}
                onClose={() => setIsResourceModalOpen(false)}
                channelId={id || ''}
                labId={labId}
            />
        </div>
    );

    if (type === 'canvas') return <CanvasView id={id!} title={title || "Untitled Notebook"} />;
    if (type === 'list') return <ListView id={id!} title={title || "Inventory List"} />;

    return renderChat();
};
