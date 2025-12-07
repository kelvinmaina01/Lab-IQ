import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, MoreVertical, Hash, Bell, BellOff, Loader2 } from "lucide-react";
import { useRealtimeChat } from "@/hooks/useRealtimeChat";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface ChatPanelProps {
  channelId: string | null;
  projectName?: string;
}

export const ChatPanel = ({ channelId, projectName = "Project Discussion" }: ChatPanelProps) => {
  const { messages, loading, error, sendMessage } = useRealtimeChat(channelId);
  const { typingUsers, startTyping, stopTyping } = useTypingIndicator(channelId);

  const [newMessage, setNewMessage] = useState("");
  const [muted, setMuted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle typing indicator
  const handleTyping = () => {
    startTyping();
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !channelId) return;

    setIsSending(true);
    try {
      await sendMessage(newMessage);
      setNewMessage("");
      stopTyping();
      toast.success("Message sent");
    } catch (err) {
      console.error("Failed to send message:", err);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Show loading state
  if (loading) {
    return (
      <Card className="flex flex-col h-[600px] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground mt-2">Loading messages...</p>
      </Card>
    );
  }

  // Show error state
  if (error) {
    return (
      <Card className="flex flex-col h-[600px] items-center justify-center">
        <p className="text-sm text-destructive">Failed to load messages</p>
        <p className="text-xs text-muted-foreground mt-2">{error.message}</p>
      </Card>
    );
  }

  // Show no channel selected state
  if (!channelId) {
    return (
      <Card className="flex flex-col h-[600px] items-center justify-center">
        <Hash className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">Select a channel to start chatting</p>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-[600px]">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Hash className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold">{projectName}</h3>
          <Badge variant="secondary" className="text-xs">{messages.length} messages</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMuted(!muted)}
            title={muted ? "Unmute notifications" : "Mute notifications"}
          >
            {muted ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Hash className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">No messages yet</p>
            <p className="text-xs text-muted-foreground mt-1">Be the first to start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="space-y-2">
                <div className="flex items-start gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={message.user?.avatar_url} />
                    <AvatarFallback>
                      {message.user?.display_name?.substring(0, 2).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">
                        {message.user?.display_name || 'Unknown User'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                      </span>
                      {message.edited_at && (
                        <span className="text-xs text-muted-foreground italic">(edited)</span>
                      )}
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    {message.reactions && Object.keys(message.reactions).length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {Object.entries(message.reactions).map(([emoji, users]) => (
                          <Badge
                            key={emoji}
                            variant="secondary"
                            className="text-xs cursor-pointer hover:bg-secondary/80"
                          >
                            {emoji} {users.length}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span className="italic">
              {typingUsers.length === 1
                ? `${typingUsers[0]} is typing...`
                : `${typingUsers.length} people are typing...`}
            </span>
          </div>
        )}
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Type a message... Use @ to mention someone"
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
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </Card>
  );
};