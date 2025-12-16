import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Smile, Send, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { LinkPreviewCard } from "@/components/collaboration/LinkPreviewCard";
import { useServices } from "@/core/ServiceProvider";
import { useRealtimeChat } from "@/hooks/useRealtimeChat";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";

const EXTRACT_LINK_REGEX = /(https?:\/\/[^\s]+)/g;

interface ChatPanelProps {
  channelId: string | null;
  projectName?: string;
}

export const ChatPanel = ({ channelId, projectName = "Project Discussion" }: ChatPanelProps) => {
  const { messages, loading, error, sendMessage } = useRealtimeChat(channelId);
  const { typingUsers, startTyping, stopTyping } = useTypingIndicator(channelId);
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  // Drag and Drop State and other existing state...
  const [isDragging, setIsDragging] = useState(false);
  const { collaboration } = useServices();
  const [newMessage, setNewMessage] = useState("");
  const [muted, setMuted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  // remove scrollRef, use virtuosoRef

  // Remove manual scroll effect, Virtuoso 'followOutput' handles this

  // ... (handleDragOver, handleDrop, handleSendMessage, etc. - keep as is)

  // ...

  const MessageItem = ({ message }: { message: any }) => (
    <div className="space-y-2 group py-2 pr-2">
      <div className="flex items-start gap-3">
        <Avatar className="w-8 h-8 mt-1">
          <AvatarImage src={message.user?.avatar_url} />
          <AvatarFallback>
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

          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content.split(EXTRACT_LINK_REGEX).map((part: string, i: number) => {
              if (part.match(EXTRACT_LINK_REGEX)) {
                return (
                  <span key={i} className="text-primary underline cursor-pointer break-all">
                    {part}
                  </span>
                );
              }
              return part;
            })}
          </p>

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
                    className="text-xs cursor-pointer hover:bg-secondary/80 px-1 py-0 h-6"
                    onClick={() => handleReaction(message.id, emoji)}
                  >
                    {emoji} <span className="ml-1 text-[10px]">{users.length}</span>
                  </Badge>
                ))}
              </div>
            )}

            {/* Add Reaction Button */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity">
                  <Smile className="w-4 h-4 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-1" align="start">
                <div className="flex gap-1">
                  {['👍', '❤️', '😂', '😮', '😢', '😡', '✅'].map((emoji) => (
                    <Button
                      key={emoji}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleReaction(message.id, emoji)}
                    >
                      <span className="text-lg">{emoji}</span>
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Card
      className={`flex flex-col h-[600px] relative transition-colors ${isDragging ? 'border-primary bg-primary/5' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag Overlay & Header (Keep same) */}
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg border-2 border-primary border-dashed">
          <div className="text-center">
            <Upload className="w-12 h-12 mx-auto text-primary mb-2" />
            <h3 className="text-xl font-bold text-primary">Drop to Upload</h3>
            <p className="text-muted-foreground">Share file with #{projectName}</p>
          </div>
        </div>
      )}

      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Hash className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold">{projectName}</h3>
          <Badge variant="secondary" className="text-xs">{messages.length} messages</Badge>
        </div>
        <div className="flex items-center gap-2">
          {/* ... buttons ... */}
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

      {/* Virtualized Messages */}
      <div className="flex-1 p-4 overflow-hidden min-h-0">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Hash className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">No messages yet</p>
          </div>
        ) : (
          <Virtuoso
            ref={virtuosoRef}
            data={messages}
            totalCount={messages.length}
            initialTopMostItemIndex={messages.length - 1} // Start at bottom
            followOutput="auto" // Stick to bottom on new messages
            alignToBottom // align content to bottom if few messages
            itemContent={(index, message) => <MessageItem message={message} />}
            className="h-full scrollbar-thin scrollbar-thumb-muted-foreground/20"
          />
        )}

        {/* Typing indicator overlay or footer */}
        {typingUsers.length > 0 && (
          <div className="absolute bottom-[80px] left-4 z-10 bg-background/80 px-2 py-1 rounded-md text-xs text-muted-foreground flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            {typingUsers.length === 1
              ? `${typingUsers[0]} is typing...`
              : `${typingUsers.length} users typing...`}
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-border shrink-0 bg-background z-20">
        {/* ... input area ... */}
        <div className="flex items-center gap-2">
          <Input
            placeholder="Type a message... Use @ to mention"
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
          Press Enter to send
        </p>
      </div>
    </Card>
  );
};