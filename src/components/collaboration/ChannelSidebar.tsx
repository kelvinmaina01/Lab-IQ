import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Hash,
  Lock,
  Plus,
  ChevronDown,
  ChevronRight,
  Volume2,
  Megaphone,
  FolderKanban,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useServices } from "@/core/ServiceProvider";
import { ChatChannel } from "@/core/interfaces";
import { ChannelDialog } from "./ChannelDialog";

interface ChannelSidebarProps {
  labId: string;
  selectedChannelId: string | null;
  onChannelSelect: (channelId: string) => void;
  className?: string;
}

export const ChannelSidebar = ({
  labId,
  selectedChannelId,
  onChannelSelect,
  className,
}: ChannelSidebarProps) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    general: true,
    project: true,
    announcement: true,
  });

  // Load channels
  useEffect(() => {
    if (labId) {
      loadChannels();
      subscribeToChannels();
    }
  }, [labId]);

  const loadChannels = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("chat_channels")
        .select("*")
        .eq("lab_id", labId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading channels:", error);
        return;
      }

      setChannels(data || []);
    } catch (error) {
      console.error("Error loading channels:", error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToChannels = () => {
    const subscription = supabase
      .channel(`channels:${labId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_channels",
          filter: `lab_id=eq.${labId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setChannels((prev) => [...prev, payload.new as Channel]);
          } else if (payload.eventType === "UPDATE") {
            setChannels((prev) =>
              prev.map((ch) =>
                ch.id === payload.new.id ? (payload.new as Channel) : ch
              )
            );
          } else if (payload.eventType === "DELETE") {
            setChannels((prev) => prev.filter((ch) => ch.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const getChannelIcon = (type: ChatChannel["type"], isPrivate: boolean) => {
    if (isPrivate) return <Lock className="h-4 w-4" />;
    if (type === "announcement") return <Megaphone className="h-4 w-4" />;
    if (type === "project") return <FolderKanban className="h-4 w-4" />;
    return <Hash className="h-4 w-4" />;
  };

  const groupedChannels = {
    general: channels.filter((ch) => ch.type === "general"),
    project: channels.filter((ch) => ch.type === "project"),
    announcement: channels.filter((ch) => ch.type === "announcement"),
  };

  const renderChannelGroup = (
    title: string,
    channels: ChatChannel[],
    sectionKey: keyof typeof expandedSections
  ) => {
    if (channels.length === 0) return null;

    const isExpanded = expandedSections[sectionKey];

    return (
      <div className="mb-4">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="flex items-center justify-between w-full px-2 py-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="flex items-center gap-1">
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            {title}
          </span>
          <span className="text-xs">{channels.length}</span>
        </button>

        {isExpanded && (
          <div className="mt-1 space-y-0.5">
            {channels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => onChannelSelect(channel.id)}
                className={cn(
                  "flex items-center justify-between w-full px-2 py-1.5 rounded text-sm transition-colors",
                  selectedChannelId === channel.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {getChannelIcon(channel.type, channel.is_private)}
                  <span className="truncate">
                    {channel.display_name || channel.name}
                  </span>
                </div>
                {channel.unread_count && channel.unread_count > 0 && (
                  <Badge
                    variant="default"
                    className="h-5 min-w-[20px] px-1 text-xs"
                  >
                    {channel.unread_count > 99 ? "99+" : channel.unread_count}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={cn("border-r bg-muted/30", className)}>
        <div className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-muted rounded" />
            <div className="h-6 bg-muted rounded" />
            <div className="h-6 bg-muted rounded" />
            <div className="h-6 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={cn("border-r bg-muted/30 flex flex-col", className)}>
        {/* Header */}
        <div className="p-4 border-b">
          <Button
            onClick={() => setIsDialogOpen(true)}
            variant="outline"
            size="sm"
            className="w-full gap-2 justify-start"
          >
            <Plus className="h-4 w-4" />
            Create Channel
          </Button>
        </div>

        {/* Channels List */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {renderChannelGroup("General", groupedChannels.general, "general")}
            {renderChannelGroup("Projects", groupedChannels.project, "project")}
            {renderChannelGroup(
              "Announcements",
              groupedChannels.announcement,
              "announcement"
            )}

            {channels.length === 0 && (
              <div className="text-center py-8 px-4">
                <Hash className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-4">
                  No channels yet. Create your first channel to start collaborating!
                </p>
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  size="sm"
                  className="gap-2"
                >
                  <Plus className="h-3 w-3" />
                  Create Channel
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Channel Creation Dialog */}
      <ChannelDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        labId={labId}
        onChannelCreated={(channel) => {
          // Channel will be added via real-time subscription
          // Auto-select the newly created channel
          onChannelSelect(channel.id);
        }}
      />
    </>
  );
};
