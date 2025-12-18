import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Hash,
  Lock,
  Plus,
  ChevronDown,
  ChevronRight,
  Megaphone,
  FolderKanban,
  Search,
  Star,
  Settings,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useServices } from "@/core/ServiceProvider";
import { ChatChannel } from "@/core/interfaces";
import { ChannelDialog } from "./ChannelDialog";
import { toast } from "sonner";

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
  const { collaboration } = useServices();
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState({
    favorites: true,
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

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem(`channel-favorites-${labId}`);
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)));
    }
  }, [labId]);

  const loadChannels = async () => {
    try {
      setLoading(true);
      const { data, error } = await collaboration.getChannels(labId);

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
    const subscription = collaboration.subscribeToChannels(
      labId,
      (newChannel) => setChannels((prev) => [...prev, newChannel]),
      (updatedChannel) => setChannels((prev) => prev.map((ch) => ch.id === updatedChannel.id ? updatedChannel : ch)),
      (deletedId) => setChannels((prev) => prev.filter((ch) => ch.id !== deletedId))
    );

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

  const toggleFavorite = (channelId: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(channelId)) {
        newFavorites.delete(channelId);
        toast.success("Removed from favorites");
      } else {
        newFavorites.add(channelId);
        toast.success("Added to favorites");
      }
      localStorage.setItem(`channel-favorites-${labId}`, JSON.stringify(Array.from(newFavorites)));
      return newFavorites;
    });
  };

  const getChannelIcon = (type: ChatChannel["type"], isPrivate: boolean) => {
    if (isPrivate) return <Lock className="h-4 w-4" />;
    if (type === "announcement") return <Megaphone className="h-4 w-4" />;
    if (type === "project") return <FolderKanban className="h-4 w-4" />;
    return <Hash className="h-4 w-4" />;
  };

  // Filter and group channels
  const filteredChannels = useMemo(() => {
    return channels.filter(ch =>
      ch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ch.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [channels, searchQuery]);

  const groupedChannels = useMemo(() => {
    return {
      favorites: filteredChannels.filter((ch) => favorites.has(ch.id)),
      general: filteredChannels.filter((ch) => ch.type === "general" && !favorites.has(ch.id)),
      project: filteredChannels.filter((ch) => ch.type === "project" && !favorites.has(ch.id)),
      announcement: filteredChannels.filter((ch) => ch.type === "announcement" && !favorites.has(ch.id)),
    };
  }, [filteredChannels, favorites]);

  const renderChannelGroup = (
    title: string,
    channels: ChatChannel[],
    sectionKey: keyof typeof expandedSections
  ) => {
    if (channels.length === 0) return null;

    const isExpanded = expandedSections[sectionKey];

    return (
      <div className="mb-3 animate-in fade-in slide-in-from-left-2 duration-300">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all rounded-md hover:bg-muted/50 group"
        >
          <span className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronDown className="h-3 w-3 transition-transform" />
            ) : (
              <ChevronRight className="h-3 w-3 transition-transform" />
            )}
            <span className="uppercase tracking-wider">{title}</span>
          </span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
            {channels.length}
          </Badge>
        </button>

        {isExpanded && (
          <div className="mt-1 space-y-0.5 animate-in slide-in-from-top-1 duration-200">
            {channels.map((channel) => (
              <div
                key={channel.id}
                className={cn(
                  "group/item relative flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-all cursor-pointer",
                  selectedChannelId === channel.id
                    ? "bg-primary/10 text-primary font-medium shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground hover:shadow-sm"
                )}
                onClick={() => onChannelSelect(channel.id)}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className={cn(
                    "transition-all",
                    selectedChannelId === channel.id && "text-primary"
                  )}>
                    {getChannelIcon(channel.type, channel.is_private)}
                  </div>
                  <span className="truncate flex-1">
                    {channel.display_name || channel.name}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {channel.unread_count && channel.unread_count > 0 && (
                    <Badge
                      variant="default"
                      className="h-5 min-w-[20px] px-1.5 text-[10px] font-bold animate-in zoom-in-50"
                    >
                      {channel.unread_count > 99 ? "99+" : channel.unread_count}
                    </Badge>
                  )}

                  {/* Hover actions */}
                  <div className="opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(channel.id);
                      }}
                    >
                      <Star
                        className={cn(
                          "h-3 w-3",
                          favorites.has(channel.id) && "fill-yellow-500 text-yellow-500"
                        )}
                      />
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                        >
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => toggleFavorite(channel.id)}>
                          <Star className="h-4 w-4 mr-2" />
                          {favorites.has(channel.id) ? "Remove from favorites" : "Add to favorites"}
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Settings className="h-4 w-4 mr-2" />
                          Channel settings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          Leave channel
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={cn("border-r bg-gradient-to-b from-muted/30 to-muted/10 backdrop-blur-sm", className)}>
        <div className="p-4 space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-2/3" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={cn("border-r bg-gradient-to-b from-muted/30 to-muted/10 backdrop-blur-sm flex flex-col", className)}>
        {/* Header */}
        <div className="p-3 border-b space-y-2">
          <Button
            onClick={() => setIsDialogOpen(true)}
            variant="default"
            size="sm"
            className="w-full gap-2 justify-start shadow-sm hover:shadow-md transition-all"
          >
            <Plus className="h-4 w-4" />
            Create Channel
          </Button>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-background/50"
            />
          </div>
        </div>

        {/* Channels List */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {renderChannelGroup("Favorites", groupedChannels.favorites, "favorites")}
            {renderChannelGroup("General", groupedChannels.general, "general")}
            {renderChannelGroup("Projects", groupedChannels.project, "project")}
            {renderChannelGroup("Announcements", groupedChannels.announcement, "announcement")}

            {filteredChannels.length === 0 && (
              <div className="text-center py-8 px-4 animate-in fade-in duration-300">
                {searchQuery ? (
                  <>
                    <Search className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      No channels match "{searchQuery}"
                    </p>
                  </>
                ) : (
                  <>
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
                  </>
                )}
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
          onChannelSelect(channel.id);
          toast.success(`Channel #${channel.name} created!`);
        }}
      />
    </>
  );
};
