import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { useState, useRef, useCallback, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Smile, Send, Loader2, Hash, Bell, BellOff, MoreVertical, Upload, Bold, Italic, Code, Link as LinkIcon } from "lucide-react";
import { formatDistanceToNow, format, isToday, isYesterday, isSameDay } from "date-fns";
import { LinkPreviewCard } from "@/components/collaboration/LinkPreviewCard";
import { useServices } from "@/core/ServiceProvider";
import { useRealtimeChat } from "@/hooks/useRealtimeChat";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import { toast } from "sonner";
import { debounce } from "@/utils/debounce";
import { cn } from "@/lib/utils";

const EXTRACT_LINK_REGEX = /(https?:\/\/[^\s]+)/g;

interface ChatPanelProps {
  channelId: string | null;
  projectName?: string;
}

// Date separator component
const DateSeparator = ({ date }: { date: Date }) => {
  let dateLabel = format(date, 'MMMM d, yyyy');
  if (isToday(date)) {
    dateLabel = 'Today';
  } else if (isYesterday(date)) {
    dateLabel = 'Yesterday';
  }

  return (
    <div className="flex items-center gap-4 my-4 px-4">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs font-medium text-muted-foreground px-3 py-1 bg-muted rounded-full">
        {dateLabel}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
};

// Loading skeleton for messages
const MessageSkeleton = () => (
  <div className="space-y-3 py-2 pr-2">
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex items-start gap-3 animate-pulse">
        <Skeleton className="w-8 h-8 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    ))}
  </div>
);

// Rich text formatting helper
const formatRichText = (text: string) => {
  // Support **bold**, *italic*, `code`, and [link](url)
  let formatted = text;

  // Bold: **text**
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold">$1</strong>');

  // Italic: *text*
  formatted = formatted.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');

  // Code: `text`
  formatted = formatted.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 bg-muted rounded text-sm font-mono">$1</code>');

  // Links: [text](url)
  formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary underline hover:text-primary/80" target="_blank" rel="noopener noreferrer">$1</a>');

  return formatted;
};

export const ChatPanel = ({ channelId, projectName = "Project Discussion" }: ChatPanelProps) => {
  const { messages, loading, error, sendMessage, addReaction } = useRealtimeChat(channelId);
  const { typingUsers, startTyping, stopTyping } = useTypingIndicator(channelId);
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  // State
  const [isDragging, setIsDragging] = useState(false);
  const { collaboration, auth } = useServices();
  const [newMessage, setNewMessage] = useState("");
  const [muted, setMuted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showFormatting, setShowFormatting] = useState(false);

  // Debounced typing indicator - Performance Optimization
  const debouncedStartTyping = useMemo(
    () => debounce(() => {
      startTyping();
    }, 300),
    [startTyping]
  );

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: { date: Date; messages: any[] }[] = [];
    let currentDate: Date | null = null;
    let currentGroup: any[] = [];

    messages.forEach((message) => {
      const messageDate = new Date(message.created_at);
      messageDate.setHours(0, 0, 0, 0);

      if (!currentDate || !isSameDay(currentDate, messageDate)) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate!, messages: currentGroup });
        }
        currentDate = messageDate;
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }
    });

    if (currentGroup.length > 0 && currentDate) {
      groups.push({ date: currentDate, messages: currentGroup });
    }

    return groups;
  }, [messages]);

  // Handler: Handle Reaction
  const handleReaction = useCallback(async (messageId: string, emoji: string) => {
    try {
      await addReaction(messageId, emoji);
    } catch (error) {
      console.error('Error adding reaction:', error);
      toast.error('Failed to add reaction');
    }
  }, [addReaction]);

  // Handler: Handle Typing
  const handleTyping = useCallback(() => {
    debouncedStartTyping();
  }, [debouncedStartTyping]);

  // Handler: Handle Key Press (Enter to send)
  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [newMessage, isSending, channelId]);

  // Handler: Handle Send Message
  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || isSending || !channelId) return;

    try {
      setIsSending(true);
      await sendMessage(newMessage.trim());
      setNewMessage("");
      stopTyping();

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
  }, [newMessage, isSending, channelId, sendMessage, stopTyping, messages.length]);

  // Format helpers for input
  const insertFormatting = (before: string, after: string = before) => {
    const input = document.querySelector('input[placeholder*="Type a message"]') as HTMLInputElement;
    if (!input) return;

    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const text = input.value;
    const selectedText = text.substring(start, end);

    const newText = text.substring(0, start) + before + selectedText + after + text.substring(end);
    setNewMessage(newText);

    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  // Handler: Drag Over
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  // Handler: Drag Leave
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  // Handler: Handle Drop (File Upload)
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    try {
      const user = await auth.getUser();
      if (!user) {
        toast.error('You must be logged in to upload files');
        return;
      }

      const labId = '00000000-0000-0000-0000-000000000001';

      for (const file of files) {
        if (file.size > 50 * 1024 * 1024) {
          toast.error(`File ${file.name} is too large (max 50MB)`);
          continue;
        }

        toast.info(`Uploading ${file.name}...`);

        const { data: uploadData, error: uploadError } = await collaboration.uploadFile(
          file,
          channelId || 'default-project',
          labId
        );

        if (uploadError) {
          toast.error(`Failed to upload ${file.name}`);
          console.error(uploadError);
        } else {
          toast.success(`${file.name} uploaded successfully!`);
          await sendMessage(`📎 Uploaded file: ${file.name}`);
        }
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Failed to upload files');
    }
  }, [channelId, collaboration, auth, sendMessage]);

  // Memoized MessageItem for performance with animations
  const MessageItem = useCallback(({ message }: { message: any }) => (
    <div className="space-y-2 group py-2 pr-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-start gap-3 hover:bg-muted/30 rounded-lg p-2 -ml-2 transition-colors">
        <Avatar className="w-8 h-8 mt-1 ring-2 ring-background">
          <AvatarImage src={message.user?.avatar_url} />
          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5">
            {message.user?.display_name?.substring(0, 2).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm truncate">
              {message.user?.display_name || 'Unknown User'}
            </span>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
            </span>
            {message.edited_at && (
              <span className="text-xs text-muted-foreground italic">(edited)</span>
            )}
          </div>

          <div
            className="text-sm whitespace-pre-wrap break-words prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: formatRichText(message.content) }}
          />

          {/* Link Preview */}
          {(() => {
            const links = message.content.match(EXTRACT_LINK_REGEX);
            if (links && links.length > 0) {
              return <LinkPreviewCard url={links[0]} />;
            }
            return null;
          })()}

          <div className="flex items-center gap-2 mt-2">
            {/* Reactions */}
            {message.reactions && Object.keys(message.reactions).length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {Object.entries(message.reactions).map(([emoji, users]: [string, any]) => (
                  <Badge
                    key={emoji}
                    variant="secondary"
                    className="text-xs cursor-pointer hover:bg-secondary/80 px-2 py-0.5 h-6 transition-all hover:scale-110"
                    onClick={() => handleReaction(message.id, emoji)}
                  >
                    {emoji} <span className="ml-1 text-[10px] font-semibold">{users.length}</span>
                  </Badge>
                ))}
              </div>
            )}

            {/* Add Reaction Button */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-muted opacity-0 group-hover:opacity-100 transition-all">
                  <Smile className="w-4 h-4 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" align="start">
                <div className="flex gap-1">
                  {['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '✅'].map((emoji) => (
                    <Button
                      key={emoji}
                      variant="ghost"
                      size="sm"
                      className="h-10 w-10 p-0 hover:scale-125 transition-transform"
                      onClick={() => handleReaction(message.id, emoji)}
                    >
                      <span className="text-xl">{emoji}</span>
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </div>
  ), [handleReaction]);

  return (
    <Card
      className={cn(
        "flex flex-col h-[600px] relative transition-all duration-300",
        isDragging && "border-primary bg-primary/5 shadow-lg shadow-primary/20"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg border-2 border-primary border-dashed animate-in fade-in zoom-in-95 duration-200">
          <div className="text-center">
            <Upload className="w-12 h-12 mx-auto text-primary mb-2 animate-bounce" />
            <h3 className="text-xl font-bold text-primary">Drop to Upload</h3>
            <p className="text-muted-foreground">Share file with #{projectName}</p>
          </div>
        </div>
      )}

      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-border shrink-0 bg-gradient-to-r from-background to-muted/20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Hash className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">{projectName}</h3>
            <p className="text-xs text-muted-foreground">{messages.length} messages</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMuted(!muted)}
            title={muted ? "Unmute notifications" : "Mute notifications"}
            className="hover:bg-muted transition-colors"
          >
            {muted ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="hover:bg-muted transition-colors">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden min-h-0 relative bg-gradient-to-b from-background to-muted/5">
        {loading ? (
          <MessageSkeleton />
        ) : groupedMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="p-4 bg-muted/20 rounded-full mb-4">
              <Hash className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Start the conversation! Be the first to send a message in #{projectName}
            </p>
          </div>
        ) : (
          <Virtuoso
            ref={virtuosoRef}
            data={groupedMessages.flatMap(group => [
              { type: 'date', date: group.date },
              ...group.messages.map(msg => ({ type: 'message', message: msg }))
            ])}
            totalCount={groupedMessages.reduce((acc, g) => acc + g.messages.length + 1, 0)}
            initialTopMostItemIndex={groupedMessages.reduce((acc, g) => acc + g.messages.length + 1, 0) - 1}
            followOutput="auto"
            alignToBottom
            itemContent={(index, item: any) => {
              if (item.type === 'date') {
                return <DateSeparator date={item.date} />;
              }
              return <MessageItem message={item.message} />;
            }}
            className="h-full px-2 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent"
          />
        )}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="absolute bottom-2 left-4 z-10 bg-muted/90 backdrop-blur-sm px-3 py-2 rounded-lg text-xs text-muted-foreground flex items-center gap-2 shadow-md animate-in slide-in-from-bottom-2">
            <Loader2 className="w-3 h-3 animate-spin text-primary" />
            {typingUsers.length === 1
              ? `${typingUsers[0]} is typing...`
              : `${typingUsers.length} users typing...`}
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-border shrink-0 bg-background z-20">
        {/* Formatting toolbar */}
        {showFormatting && (
          <div className="flex items-center gap-1 mb-2 pb-2 border-b animate-in slide-in-from-bottom-2 duration-200">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertFormatting('**', '**')}
              title="Bold"
              className="h-8 px-2"
            >
              <Bold className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertFormatting('*', '*')}
              title="Italic"
              className="h-8 px-2"
            >
              <Italic className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertFormatting('`', '`')}
              title="Code"
              className="h-8 px-2"
            >
              <Code className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertFormatting('[text](url)')}
              title="Link"
              className="h-8 px-2"
            >
              <LinkIcon className="w-4 h-4" />
            </Button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowFormatting(!showFormatting)}
            title="Text formatting"
            className="shrink-0"
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Input
            placeholder="Type a message... Use **bold**, *italic*, `code`"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={handleKeyPress}
            disabled={isSending}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            size="icon"
            disabled={isSending || !newMessage.trim()}
            className="shrink-0 transition-all hover:scale-105"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send • Drag and drop files to upload
        </p>
      </div>
    </Card>
  );
};
