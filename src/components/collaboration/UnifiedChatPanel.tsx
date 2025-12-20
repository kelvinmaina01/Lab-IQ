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
    Database, FileText, TestTube, ExternalLink
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
    const { messages, loading, sendMessage } = useUnifiedChat(id!, isChatType ? type : 'channel');
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

    const renderMessageContent = (content: string) => {
        // Sanitize user input to prevent XSS
        let formatted = sanitizeText(content);

        // Apply @LabAI mentions highlighting (safe after sanitization)
        formatted = formatted.replace(/@LabAI/gi, '<span class="bg-primary/20 text-primary px-1 rounded font-bold">@LabAI</span>');

        // Handle AI response prefix
        if (content.startsWith('[AI]')) {
            formatted = '<span class="flex items-center gap-1 text-primary font-bold mb-1">🤖 LabAI Response</span><br>' + formatted.replace('[AI]', '');
        }

        return formatted;
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
                    {metadata.description || "Interactive scientific asset linked from Lab-IQ core."}
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

    const renderChat = () => (
        <div className="flex flex-col h-full bg-background overflow-hidden relative">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b shrink-0 bg-muted/10">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                        {type === 'channel' ? <Hash className="w-5 h-5 text-primary" /> : <User className="w-5 h-5 text-primary" />}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-base">{title || (type === 'channel' ? 'General' : 'Direct Message')}</h3>
                            {type === 'channel' && <ShieldCheck className="h-3 w-3 text-primary" title="Certified Channel" />}
                        </div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                            {type === 'channel' ? 'Project Workspace' : 'Private Conversation'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
                        <Search className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
                        <Bell className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-hidden relative">
                {loading ? (
                    <div className="p-4 space-y-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="flex gap-3">
                                <Skeleton className="h-8 w-8 rounded-full" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-12 w-full" />
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
                            <div className="group px-4 py-2 hover:bg-muted/30 transition-colors">
                                <div className="flex items-start gap-4">
                                    <Avatar className="h-9 w-9 mt-0.5 border border-border shrink-0">
                                        <AvatarImage src={msg.user?.avatar_url} />
                                        <AvatarFallback className="bg-primary/5 text-primary font-bold text-xs">
                                            {msg.user?.display_name?.substring(0, 2).toUpperCase() || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline gap-2 mb-1">
                                            <span className="font-bold text-sm hover:underline cursor-pointer">{msg.user?.display_name || 'Anonymous'}</span>
                                            <span className="text-[10px] text-muted-foreground">{format(new Date(msg.created_at), 'h:mm a')}</span>
                                        </div>
                                        <div
                                            className="text-sm leading-relaxed whitespace-pre-wrap break-words prose prose-sm dark:prose-invert max-w-none"
                                            dangerouslySetInnerHTML={{ __html: renderMessageContent(msg.content) }}
                                        />
                                        {msg.metadata?.isResourceCard && renderResourceCard(msg.metadata)}
                                        {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                            <div className="flex gap-1.5 mt-2 flex-wrap">
                                                {Object.entries(msg.reactions).map(([emoji, users]: [string, any]) => (
                                                    <Badge key={emoji} variant="outline" className="h-6 px-1.5 py-0 bg-muted/50 text-[10px] font-medium hover:bg-muted border-muted/50 cursor-pointer">
                                                        {emoji} {users.length}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center bg-background border rounded-lg shadow-sm p-0.5 mt-[-10px] mr-2">
                                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-sm hover:bg-muted"><Smile className="h-4 w-4 text-muted-foreground" /></Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-sm hover:bg-muted" onClick={() => onThreadOpen?.(msg)}><MessageSquare className="h-4 w-4 text-muted-foreground" /></Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-sm hover:bg-muted"><MoreVertical className="h-4 w-4 text-muted-foreground" /></Button>
                                    </div>
                                </div>
                            </div>
                        )}
                        className="h-full scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent"
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
