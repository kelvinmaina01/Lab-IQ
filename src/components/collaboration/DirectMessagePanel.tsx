import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Smile, MoreVertical, Phone, Video, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useServices } from "@/core/ServiceProvider";
import { DirectMessage, TeamMember } from "@/core/interfaces";
import { toast } from "sonner";
import { format } from "date-fns";

interface DirectMessagePanelProps {
  otherUserId: string;
  currentUserId: string;
  labId: string;
}

export const DirectMessagePanel = ({
  otherUserId,
  currentUserId,
  labId,
}: DirectMessagePanelProps) => {
  const { collaboration } = useServices();
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [otherUser, setOtherUser] = useState<TeamMember | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMessages();
    loadOtherUser();

    // Subscribe to new DMs
    const channel = collaboration.subscribeToDirectMessages(currentUserId, handleNewMessage);
    channel.subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [otherUserId, currentUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadOtherUser = async () => {
    const member = await collaboration.getTeamMember(otherUserId, labId);
    if (member) {
      setOtherUser(member);
    }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await collaboration.getDirectMessages(otherUserId);
      if (error) {
        console.error("Error loading DMs:", error);
        toast.error("Failed to load messages");
        return;
      }
      if (data) {
        setMessages(data);
        // Mark messages as read
        markMessagesAsRead(data);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async (msgs: DirectMessage[]) => {
    // Mark unread messages from other user as read
    const unreadIds = msgs
      .filter(m => m.recipient_id === currentUserId && !m.is_read)
      .map(m => m.id);

    // TODO: Implement batch mark as read in service
    for (const id of unreadIds) {
      // This would call a markDirectMessageAsRead method
      // await collaboration.markDirectMessageAsRead(id);
    }
  };

  const handleNewMessage = (msg: DirectMessage) => {
    // Only add if it's from/to the current conversation
    if (
      (msg.sender_id === otherUserId && msg.recipient_id === currentUserId) ||
      (msg.sender_id === currentUserId && msg.recipient_id === otherUserId)
    ) {
      setMessages(prev => [...prev, msg]);
      if (msg.recipient_id === currentUserId) {
        // Mark as read immediately
        // await collaboration.markDirectMessageAsRead(msg.id);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      const { data, error } = await collaboration.sendDirectMessage(otherUserId, newMessage.trim());

      if (error) {
        toast.error("Failed to send message");
        console.error("Send error:", error);
        return;
      }

      if (data) {
        setMessages(prev => [...prev, data]);
      }

      setNewMessage("");
      inputRef.current?.focus();
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = new Date(now.getTime() - 86400000).toDateString() === date.toDateString();

    if (isToday) return format(date, 'HH:mm');
    if (isYesterday) return `Yesterday ${format(date, 'HH:mm')}`;
    return format(date, 'MMM d, HH:mm');
  };

  const groupedMessages = messages.reduce((acc, msg, idx) => {
    const prevMsg = messages[idx - 1];
    const isSameSender = prevMsg && prevMsg.sender_id === msg.sender_id;
    const timeDiff = prevMsg ? new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() : 0;
    const isGrouped = isSameSender && timeDiff < 60000; // Group if within 1 minute

    if (!isGrouped) {
      acc.push([msg]);
    } else {
      acc[acc.length - 1].push(msg);
    }
    return acc;
  }, [] as DirectMessage[][]);

  if (!otherUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherUser.avatar_url} />
              <AvatarFallback>{otherUser.display_name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            {otherUser.status === 'online' && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
            )}
          </div>
          <div>
            <h3 className="font-semibold">{otherUser.display_name}</h3>
            <p className="text-xs text-muted-foreground">
              {otherUser.status === 'online' ? 'Active now' : 'Offline'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost">
            <Phone className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost">
            <Video className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost">
            <Info className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground">Loading messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
            <Avatar className="h-16 w-16">
              <AvatarImage src={otherUser.avatar_url} />
              <AvatarFallback className="text-2xl">{otherUser.display_name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-semibold mb-1">{otherUser.display_name}</h4>
              <p className="text-sm text-muted-foreground">
                This is the beginning of your direct message history with {otherUser.display_name}.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {groupedMessages.map((group, groupIdx) => {
              const isFromMe = group[0].sender_id === currentUserId;
              return (
                <div
                  key={groupIdx}
                  className={cn("flex gap-3", isFromMe ? "flex-row-reverse" : "flex-row")}
                >
                  {!isFromMe && (
                    <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                      <AvatarImage src={otherUser.avatar_url} />
                      <AvatarFallback>{otherUser.display_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className={cn("flex flex-col gap-1 max-w-[70%]", isFromMe && "items-end")}>
                    {group.map((msg, msgIdx) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "px-4 py-2 rounded-2xl",
                          isFromMe
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted",
                          msgIdx === 0 && !isFromMe && "rounded-tl-sm",
                          msgIdx === 0 && isFromMe && "rounded-tr-sm"
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                      </div>
                    ))}
                    <span className="text-xs text-muted-foreground px-2">
                      {formatMessageTime(group[group.length - 1].created_at)}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={scrollRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t bg-background">
        <div className="flex items-end gap-2">
          <Button size="icon" variant="ghost" className="flex-shrink-0">
            <Smile className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <Input
              ref={inputRef}
              placeholder={`Message ${otherUser.display_name}...`}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={sending}
              className="resize-none"
            />
          </div>
          <Button
            size="icon"
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            className="flex-shrink-0"
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
