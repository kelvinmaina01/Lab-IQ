import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, MoreVertical, Hash, Bell, BellOff } from "lucide-react";

interface Message {
  id: number;
  user: string;
  avatar: string;
  content: string;
  timestamp: string;
  thread?: Message[];
  mentions?: string[];
}

interface ChatPanelProps {
  projectName?: string;
}

export const ChatPanel = ({ projectName = "Project Discussion" }: ChatPanelProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      user: "Dr. Sarah Chen",
      avatar: "/placeholder.svg",
      content: "I've uploaded the latest protein analysis results. The binding affinity looks promising!",
      timestamp: "10:30 AM",
      thread: [
        {
          id: 11,
          user: "John Smith",
          avatar: "/placeholder.svg",
          content: "Great! I'll review the data this afternoon.",
          timestamp: "10:35 AM"
        }
      ]
    },
    {
      id: 2,
      user: "Emma Wilson",
      avatar: "/placeholder.svg",
      content: "@Dr. Mike Ross Can you check the methodology section? I think we need to add more details about the temperature control.",
      timestamp: "11:15 AM",
      mentions: ["Dr. Mike Ross"]
    },
    {
      id: 3,
      user: "Dr. Mike Ross",
      avatar: "/placeholder.svg",
      content: "Good catch @Emma Wilson. I'll update it with the specific temperature ranges and monitoring intervals.",
      timestamp: "11:20 AM",
      mentions: ["Emma Wilson"]
    },
  ]);

  const [newMessage, setNewMessage] = useState("");
  const [muted, setMuted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: messages.length + 1,
      user: "You",
      avatar: "/placeholder.svg",
      content: newMessage,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages([...messages, message]);
    setNewMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="flex flex-col h-[600px]">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Hash className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold">{projectName}</h3>
          <Badge variant="secondary" className="text-xs">3 online</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setMuted(!muted)}
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
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="space-y-2">
              <div className="flex items-start gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={message.avatar} alt={message.user} />
                  <AvatarFallback>{message.user.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{message.user}</span>
                    <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                  </div>
                  <p className="text-sm">{message.content}</p>
                  {message.thread && message.thread.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mt-2 text-xs text-primary"
                    >
                      {message.thread.length} {message.thread.length === 1 ? 'reply' : 'replies'}
                    </Button>
                  )}
                </div>
              </div>
              {message.thread && (
                <div className="ml-11 pl-4 border-l-2 border-muted space-y-3">
                  {message.thread.map((reply) => (
                    <div key={reply.id} className="flex items-start gap-3">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={reply.avatar} alt={reply.user} />
                        <AvatarFallback className="text-xs">{reply.user.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-xs">{reply.user}</span>
                          <span className="text-xs text-muted-foreground">{reply.timestamp}</span>
                        </div>
                        <p className="text-xs">{reply.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Type a message... Use @ to mention someone"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button onClick={handleSendMessage} size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </Card>
  );
};