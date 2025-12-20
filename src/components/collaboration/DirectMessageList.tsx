import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Search, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useServices } from "@/core/ServiceProvider";
import { TeamMember, DirectMessage } from "@/core/interfaces";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Conversation {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
}

interface DirectMessageListProps {
  labId: string;
  selectedUserId: string | null;
  onSelectUser: (userId: string) => void;
  currentUserId: string;
}

export const DirectMessageList = ({
  labId,
  selectedUserId,
  onSelectUser,
  currentUserId,
}: DirectMessageListProps) => {
  const { collaboration } = useServices();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewDMOpen, setIsNewDMOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
    loadTeamMembers();
  }, [labId, currentUserId]);

  const loadTeamMembers = async () => {
    const { data } = await collaboration.getTeamMembers(labId);
    if (data) {
      // Filter out current user
      setTeamMembers(data.filter(m => m.user_id !== currentUserId));
    }
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      const { data: members } = await collaboration.getTeamMembers(labId);
      if (!members) return;

      const convs: Conversation[] = [];

      // Load DM history with each team member
      for (const member of members) {
        if (member.user_id === currentUserId) continue;

        const { data: messages } = await collaboration.getDirectMessages(member.user_id);
        if (messages && messages.length > 0) {
          const lastMsg = messages[messages.length - 1];
          const unreadCount = messages.filter(
            m => m.recipient_id === currentUserId && !m.is_read
          ).length;

          convs.push({
            userId: member.user_id,
            displayName: member.display_name,
            avatarUrl: member.avatar_url,
            lastMessage: lastMsg.content,
            lastMessageTime: lastMsg.created_at,
            unreadCount,
            isOnline: member.status === 'online',
          });
        }
      }

      // Sort by last message time
      convs.sort((a, b) =>
        new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      );

      setConversations(convs);
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartNewDM = (userId: string) => {
    setIsNewDMOpen(false);
    onSelectUser(userId);

    // Add to conversations if not already there
    const member = Array.isArray(teamMembers) ? teamMembers.find(m => m.user_id === userId) : null;
    if (member && !conversations.find(c => c.userId === userId)) {
      setConversations(prev => [{
        userId: member.user_id,
        displayName: member.display_name,
        avatarUrl: member.avatar_url,
        lastMessage: '',
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
        isOnline: member.status === 'online',
      }, ...prev]);
    }
  };

  const filteredMembers = Array.isArray(teamMembers)
    ? teamMembers.filter(m => m.display_name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            Direct Messages
          </h3>
          <Dialog open={isNewDMOpen} onOpenChange={setIsNewDMOpen}>
            <DialogTrigger asChild>
              <Button size="icon" variant="ghost" className="h-7 w-7">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>New Direct Message</DialogTitle>
                <DialogDescription>
                  Select a team member to start a conversation
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search team members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-1">
                    {filteredMembers.map(member => (
                      <button
                        key={member.id}
                        onClick={() => handleStartNewDM(member.user_id)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-muted rounded-lg transition-colors text-left"
                      >
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={member.avatar_url} />
                            <AvatarFallback>{member.display_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          {member.status === 'online' && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{member.display_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {member.status === 'online' ? 'Active now' : `Last active ${formatTime(member.last_active)}`}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                <div className="h-10 w-10 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-muted rounded w-24" />
                  <div className="h-2 bg-muted rounded w-32" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground mb-2">No conversations yet</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsNewDMOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Start a conversation
            </Button>
          </div>
        ) : (
          <div className="p-2">
            {conversations.map(conv => (
              <button
                key={conv.userId}
                onClick={() => onSelectUser(conv.userId)}
                className={cn(
                  "w-full flex items-start gap-3 p-3 rounded-lg transition-colors text-left hover:bg-muted/50",
                  selectedUserId === conv.userId && "bg-muted"
                )}
              >
                <div className="relative flex-shrink-0">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={conv.avatarUrl} />
                    <AvatarFallback>{conv.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  {conv.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className={cn(
                      "font-medium text-sm truncate",
                      conv.unreadCount > 0 && "font-bold"
                    )}>
                      {conv.displayName}
                    </p>
                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                      {formatTime(conv.lastMessageTime)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn(
                      "text-xs text-muted-foreground truncate",
                      conv.unreadCount > 0 && "font-semibold text-foreground"
                    )}>
                      {conv.lastMessage}
                    </p>
                    {conv.unreadCount > 0 && (
                      <Badge variant="default" className="h-5 min-w-[20px] px-1.5 text-xs">
                        {conv.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
