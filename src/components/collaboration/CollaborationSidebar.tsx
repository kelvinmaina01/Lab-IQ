import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
    MessageSquare,
    AtSign,
    Bookmark,
    LayoutGrid,
    Sparkles,
    Bot,
    Circle,
    Clock,
    SquarePen,
    Book,
    CheckSquare,
    Headphones,
    PanelLeftClose,
    PanelLeft,
} from "lucide-react";
import { UnifiedCreateMenu } from "./UnifiedCreateMenu";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useServices } from "@/core/ServiceProvider";
import { ChatChannel, TeamMember, SharedCanvas, SharedList } from "@/core/interfaces";
import { ChannelDialog } from "./ChannelDialog";
import { toast } from "sonner";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";

import { InviteModal } from "./InviteModal";
import { HuddleBar } from "./HuddleBar";

interface CollaborationSidebarProps {
    labId: string;
    selectedId: string | null;
    selectedType: 'channel' | 'dm' | 'app' | 'activity' | 'canvas' | 'list';
    onSelect: (id: string, type: 'channel' | 'dm' | 'app' | 'activity' | 'canvas' | 'list') => void;
    onSearchOpen?: () => void;
    className?: string;
}

export const CollaborationSidebar = ({
    labId,
    selectedId,
    selectedType,
    onSelect,
    onSearchOpen,
    className,
}: CollaborationSidebarProps) => {
    const { collaboration, auth } = useServices();
    const [channels, setChannels] = useState<ChatChannel[]>([]);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [canvases, setCanvases] = useState<SharedCanvas[]>([]);
    const [lists, setLists] = useState<SharedList[]>([]);
    const [currentUser, setCurrentUser] = useState<TeamMember | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    const [isCollapsed, setIsCollapsed] = useState(() => {
        const saved = localStorage.getItem(`collab-sidebar-collapsed-${labId}`);
        return saved ? JSON.parse(saved) : false;
    });

    // Unread counts
    const { channelUnreadCounts, dmUnreadCount } = useUnreadCounts(labId, currentUser?.user_id || null);

    const [expandedSections, setExpandedSections] = useState({
        channels: true,
        dms: true,
        apps: true,
        canvases: true,
        lists: true,
    });

    // Load Initial Data
    useEffect(() => {
        if (labId) {
            loadData();
            const chSub = subscribeToChannels();
            return () => {
                chSub();
            };
        }
    }, [labId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [chRes, tmRes, meRes, canvRes, listRes] = await Promise.all([
                collaboration.getChannels(labId),
                collaboration.getTeamMembers(labId),
                auth.getUser(),
                collaboration.getCanvases(labId),
                collaboration.getLists(labId),
            ]);

            setChannels(chRes.data || []);
            setTeamMembers(tmRes.data || []);
            setCanvases(canvRes.data || []);
            setLists(listRes.data || []);

            if (meRes) {
                const me = (tmRes.data || []).find(m => m.user_id === meRes.id);
                if (me) setCurrentUser(me);
            }

            // Load favorites
            const savedFavorites = localStorage.getItem(`collab-favorites-${labId}`);
            if (savedFavorites) setFavorites(new Set(JSON.parse(savedFavorites)));

        } catch (error) {
            console.error("Error loading collaboration data:", error);
        } finally {
            setLoading(false);
        }
    };

    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [isHuddleActive, setIsHuddleActive] = useState(false);
    const [activeHuddleChannel, setActiveHuddleChannel] = useState("");

    const handleCreateAction = (action: string) => {
        switch (action) {
            case 'channel':
                setIsDialogOpen(true);
                break;
            case 'invite':
                setIsInviteOpen(true);
                break;
            case 'message':
                onSearchOpen?.();
                break;
            case 'huddle':
                const currentChannel = Array.isArray(channels) ? channels.find(c => c.id === selectedId) : null;
                setActiveHuddleChannel(currentChannel?.display_name || currentChannel?.name || "General");
                setIsHuddleActive(true);
                toast.success("Huddle started", {
                    description: "Scientific voice channel is now active.",
                    icon: <Headphones className="h-4 w-4 text-emerald-500" />
                });
                break;
            case 'canvas':
                handleCreateCanvas();
                break;
            case 'list':
                handleCreateList();
                break;
            default:
                toast("Feature coming soon", {
                    description: `${action.charAt(0).toUpperCase() + action.slice(1)} integration is being synchronized.`
                });
        }
    };

    const handleCreateCanvas = async () => {
        try {
            const { data, error } = await collaboration.createCanvas("Untitled Notebook", labId);
            if (error) throw error;
            if (data) {
                setCanvases(prev => [data, ...prev]);
                onSelect(data.id, 'canvas');
                toast.success("Canvas created");
            }
        } catch (err) {
            toast.error("Failed to create canvas");
        }
    };

    const handleCreateList = async () => {
        try {
            const { data, error } = await collaboration.createList("New Inventory List", labId);
            if (error) throw error;
            if (data) {
                setLists(prev => [data, ...prev]);
                onSelect(data.id, 'list');
                toast.success("List created");
            }
        } catch (err) {
            toast.error("Failed to create list");
        }
    };

    const subscribeToChannels = () => {
        const subscription = collaboration.subscribeToChannels(
            labId,
            (newChannel) => setChannels((prev) => [...prev, newChannel]),
            (updatedChannel) => setChannels((prev) => prev.map((ch) => ch.id === updatedChannel.id ? updatedChannel : ch)),
            (deletedId) => setChannels((prev) => prev.filter((ch) => ch.id !== deletedId))
        );
        return () => subscription.unsubscribe();
    };

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
    };

    const toggleFavorite = (id: string) => {
        setFavorites((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            localStorage.setItem(`collab-favorites-${labId}`, JSON.stringify(Array.from(next)));
            return next;
        });
    };

    const toggleCollapse = () => {
        const nextCollapsed = !isCollapsed;
        setIsCollapsed(nextCollapsed);
        localStorage.setItem(`collab-sidebar-collapsed-${labId}`, JSON.stringify(nextCollapsed));
    };

    const getChannelIcon = (type: ChatChannel["type"], isPrivate: boolean) => {
        if (isPrivate) return <Lock className="h-4 w-4" />;
        if (type === "announcement") return <Megaphone className="h-4 w-4" />;
        if (type === "project") return <FolderKanban className="h-4 w-4" />;
        return <Hash className="h-4 w-4" />;
    };

    const getStatusColor = (status: TeamMember['status']) => {
        switch (status) {
            case 'online': return 'text-green-500 fill-green-500';
            case 'away': return 'text-yellow-500 fill-yellow-500';
            case 'busy': return 'text-red-500 fill-red-500';
            default: return 'text-muted-foreground';
        }
    };

    // Sections rendering
    const renderSidebarItem = (
        id: string,
        label: string,
        icon: React.ReactNode,
        type: 'channel' | 'dm' | 'app',
        metadata?: { unread?: number; status?: TeamMember['status']; isFavorite?: boolean }
    ) => {
        const isActive = selectedId === id && selectedType === type;

        return (
            <div
                key={id}
                className={cn(
                    "group relative flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-all cursor-pointer mx-1",
                    isActive
                        ? "bg-primary/20 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
                onClick={() => onSelect(id, type)}
            >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className={cn("shrink-0", isActive && "text-primary")}>
                        {icon}
                    </div>
                    <span className="truncate flex-1">
                        {label}
                    </span>
                    {metadata?.unread && metadata.unread > 0 && (
                        <Badge variant="default" className="h-4 min-w-[16px] px-1 text-[9px] font-bold">
                            {metadata.unread}
                        </Badge>
                    )}
                    {type === 'dm' && metadata?.status && (
                        <Circle className={cn("h-2 w-2", getStatusColor(metadata.status))} />
                    )}
                </div>

                {/* Star for channels/dms */}
                {(type === 'channel' || type === 'dm') && (
                    <Star
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(id); }}
                        className={cn(
                            "h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity",
                            metadata?.isFavorite && "opacity-100 fill-yellow-500 text-yellow-500"
                        )}
                    />
                )}
            </div>
        );
    };

    return (
        <TooltipProvider>
        <div className={cn(
            "border-r bg-background flex flex-col h-full transition-all duration-300 relative",
            isCollapsed ? "w-16" : "w-72",
            className
        )}>
            {/* Collapse Toggle Button */}
            <Button
                variant="ghost"
                size="icon"
                onClick={toggleCollapse}
                className="absolute -right-3 top-4 z-50 h-6 w-6 rounded-full border bg-background shadow-md hover:bg-muted"
            >
                {isCollapsed ? <PanelLeft className="h-3 w-3" /> : <PanelLeftClose className="h-3 w-3" />}
            </Button>

            {/* Workspace Header */}
            {!isCollapsed ? (
                <div className="p-4 border-b flex items-center justify-between hover:bg-muted/30 cursor-pointer transition-colors group">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 shadow-inner">
                            <Sparkles className="h-5 w-5 text-primary" />
                        </div>
                        <div className="overflow-hidden">
                            <h2 className="font-bold text-sm truncate leading-tight">Lab-IQ Global</h2>
                            <p className="text-[10px] text-muted-foreground truncate">Enterprise Workspace</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <UnifiedCreateMenu
                            onAction={(action) => handleCreateAction(action)}
                            trigger={
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
                                    <SquarePen className="h-4 w-4" />
                                </Button>
                            }
                        />
                        <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                </div>
            ) : (
                <div className="p-4 border-b flex items-center justify-center">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                        <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                </div>
            )}

            {/* Global Search Button */}
            {!isCollapsed ? (
                <div className="px-3 py-3">
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start gap-2 bg-muted/30 border-muted hover:border-primary/30 text-muted-foreground text-xs font-normal transition-all rounded-lg"
                        onClick={onSearchOpen}
                    >
                        <Search className="h-3 w-3" />
                        <span>Search workspace...</span>
                        <span className="ml-auto text-[10px] bg-muted px-1.5 py-0.5 rounded border border-border">⌘K</span>
                    </Button>
                </div>
            ) : (
                <div className="px-3 py-3">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="w-10 h-10 bg-muted/30 border-muted hover:border-primary/30"
                                onClick={onSearchOpen}
                            >
                                <Search className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">Search workspace (⌘K)</TooltipContent>
                    </Tooltip>
                </div>
            )}

            {!isCollapsed && (
                <ScrollArea className="flex-1 px-1">
                <div className="py-2 space-y-4">

                    {/* Top Actions */}
                    <div className="space-y-0.5 px-2">
                        {renderSidebarItem('activity', 'All Activity', <Clock className="h-4 w-4" />, 'activity' as any)}
                        {renderSidebarItem('mentions', 'Mentions & Reactions', <AtSign className="h-4 w-4" />, 'activity' as any)}
                        {renderSidebarItem('saved', 'Saved Items', <Bookmark className="h-4 w-4" />, 'activity' as any)}
                    </div>

                    {/* Channels Section */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between px-3 mb-1 group/section">
                            <button
                                onClick={() => toggleSection('channels')}
                                className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground hover:text-foreground uppercase tracking-wider transition-colors"
                            >
                                {expandedSections.channels ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                Channels
                            </button>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Plus
                                        onClick={() => setIsDialogOpen(true)}
                                        className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-pointer opacity-0 group-hover/section:opacity-100 transition-opacity"
                                    />
                                </TooltipTrigger>
                                <TooltipContent>Create Channel</TooltipContent>
                            </Tooltip>
                        </div>

                        {expandedSections.channels && (
                            <div className="space-y-0.5">
                                {Array.isArray(channels) && channels.map(ch => renderSidebarItem(
                                    ch.id,
                                    ch.display_name || ch.name,
                                    getChannelIcon(ch.type, ch.is_private),
                                    'channel',
                                    { unread: channelUnreadCounts[ch.id] || 0, isFavorite: favorites.has(ch.id) }
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Canvases Section */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between px-3 mb-1 group/section">
                            <button
                                onClick={() => toggleSection('canvases')}
                                className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground hover:text-foreground uppercase tracking-wider transition-colors"
                            >
                                {expandedSections.canvases ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                Canvases
                            </button>
                            <Plus
                                onClick={() => handleCreateCanvas()}
                                className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-pointer opacity-0 group-hover/section:opacity-100 transition-opacity"
                            />
                        </div>

                        {expandedSections.canvases && (
                            <div className="space-y-0.5">
                                {Array.isArray(canvases) && canvases.map(canv => renderSidebarItem(
                                    canv.id,
                                    canv.title,
                                    <Book className="h-4 w-4 text-amber-500/70" />,
                                    'canvas',
                                    { isFavorite: favorites.has(canv.id) }
                                ))}
                                {Array.isArray(canvases) && canvases.length === 0 && (
                                    <p className="text-[10px] text-muted-foreground px-4 py-1 italic">No active canvases</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Lists Section */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between px-3 mb-1 group/section">
                            <button
                                onClick={() => toggleSection('lists')}
                                className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground hover:text-foreground uppercase tracking-wider transition-colors"
                            >
                                {expandedSections.lists ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                Lists
                            </button>
                            <Plus
                                onClick={() => handleCreateList()}
                                className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-pointer opacity-0 group-hover/section:opacity-100 transition-opacity"
                            />
                        </div>

                        {expandedSections.lists && (
                            <div className="space-y-0.5">
                                {Array.isArray(lists) && lists.map(list => renderSidebarItem(
                                    list.id,
                                    list.title,
                                    <CheckSquare className="h-4 w-4 text-emerald-500/70" />,
                                    'list',
                                    { isFavorite: favorites.has(list.id) }
                                ))}
                                {Array.isArray(lists) && lists.length === 0 && (
                                    <p className="text-[10px] text-muted-foreground px-4 py-1 italic">No active lists</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Direct Messages Section */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between px-3 mb-1 group/section">
                            <button
                                onClick={() => toggleSection('dms')}
                                className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground hover:text-foreground uppercase tracking-wider transition-colors"
                            >
                                {expandedSections.dms ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                Direct Messages
                                {dmUnreadCount > 0 && (
                                    <Badge variant="default" className="h-4 min-w-[16px] px-1 text-[9px] font-bold">
                                        {dmUnreadCount}
                                    </Badge>
                                )}
                            </button>
                            <Plus className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-pointer opacity-0 group-hover/section:opacity-100 transition-opacity" />
                        </div>

                        {expandedSections.dms && (
                            <div className="space-y-0.5">
                                {Array.isArray(teamMembers) && teamMembers
                                    .filter(m => m.user_id !== currentUser?.user_id)
                                    .map(m => renderSidebarItem(
                                        m.user_id,
                                        m.display_name,
                                        <Avatar className="h-4 w-4">
                                            <AvatarImage src={m.avatar_url} />
                                            <AvatarFallback className="text-[8px] bg-primary/20">{m.display_name.substring(0, 2)}</AvatarFallback>
                                        </Avatar>,
                                        'dm',
                                        { status: m.status, isFavorite: favorites.has(m.user_id) }
                                    ))
                                }
                            </div>
                        )}
                    </div>

                    {/* Apps / AI Agents Section */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between px-3 mb-1 group/section">
                            <button
                                onClick={() => toggleSection('apps')}
                                className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground hover:text-foreground uppercase tracking-wider transition-colors"
                            >
                                {expandedSections.apps ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                Specialized Apps
                            </button>
                            <LayoutGrid className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-pointer opacity-0 group-hover/section:opacity-100 transition-opacity" />
                        </div>

                        {expandedSections.apps && (
                            <div className="space-y-0.5">
                                {renderSidebarItem('bioexpert', 'BioExpert AI', <Bot className="h-4 w-4 text-emerald-500" />, 'app')}
                                {renderSidebarItem('pharma', 'PharmaBot', <Bot className="h-4 w-4 text-blue-500" />, 'app')}
                                {renderSidebarItem('clinical', 'ClinicalScribe', <Bot className="h-4 w-4 text-purple-500" />, 'app')}
                            </div>
                        )}
                    </div>

                </div>
                </ScrollArea>
            )}

            {/* Collapsed Icon View */}
            {isCollapsed && (
                <ScrollArea className="flex-1">
                    <div className="flex flex-col items-center gap-2 py-4">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant={selectedType === 'activity' && selectedId === 'activity' ? 'default' : 'ghost'}
                                    size="icon"
                                    className="h-10 w-10"
                                    onClick={() => onSelect('activity', 'activity' as any)}
                                >
                                    <Clock className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right">All Activity</TooltipContent>
                        </Tooltip>

                        <div className="w-8 border-t my-2" />

                        {Array.isArray(channels) && channels.slice(0, 5).map(ch => (
                            <Tooltip key={ch.id}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant={selectedId === ch.id ? 'default' : 'ghost'}
                                        size="icon"
                                        className="h-10 w-10 relative"
                                        onClick={() => onSelect(ch.id, 'channel')}
                                    >
                                        {getChannelIcon(ch.type, ch.is_private)}
                                        {channelUnreadCounts[ch.id] > 0 && (
                                            <div className="absolute -top-1 -right-1 h-4 w-4 bg-primary rounded-full flex items-center justify-center">
                                                <span className="text-[8px] text-primary-foreground font-bold">
                                                    {channelUnreadCounts[ch.id] > 9 ? '9+' : channelUnreadCounts[ch.id]}
                                                </span>
                                            </div>
                                        )}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="right">{ch.display_name || ch.name}</TooltipContent>
                            </Tooltip>
                        ))}

                        <div className="w-8 border-t my-2" />

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 relative"
                                >
                                    <MessageSquare className="h-4 w-4" />
                                    {dmUnreadCount > 0 && (
                                        <div className="absolute -top-1 -right-1 h-4 w-4 bg-primary rounded-full flex items-center justify-center">
                                            <span className="text-[8px] text-primary-foreground font-bold">
                                                {dmUnreadCount > 9 ? '9+' : dmUnreadCount}
                                            </span>
                                        </div>
                                    )}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right">Direct Messages</TooltipContent>
                        </Tooltip>
                    </div>
                </ScrollArea>
            )}

            {/* User Footer */}
            <div className="p-3 border-t bg-muted/20">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        {!isCollapsed ? (
                            <div className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer group">
                                <div className="relative shrink-0">
                                    <Avatar className="h-8 w-8 border border-border shadow-sm group-hover:border-primary/50 transition-colors">
                                        <AvatarImage src={currentUser?.avatar_url} />
                                        <AvatarFallback className="bg-primary/10 text-primary">{currentUser?.display_name?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                                    </Avatar>
                                    <div className={cn(
                                        "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background shadow-sm",
                                        currentUser?.status === 'online' ? "bg-green-500" : "bg-muted-foreground"
                                    )} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate leading-none mb-1">{currentUser?.display_name || 'Anonymous'}</p>
                                    <p className="text-[10px] text-muted-foreground truncate">{currentUser?.role || 'Researcher'}</p>
                                </div>
                                <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                        ) : (
                            <div className="flex justify-center">
                                <div className="relative">
                                    <Avatar className="h-10 w-10 border border-border shadow-sm hover:border-primary/50 transition-colors cursor-pointer">
                                        <AvatarImage src={currentUser?.avatar_url} />
                                        <AvatarFallback className="bg-primary/10 text-primary">{currentUser?.display_name?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                                    </Avatar>
                                    <div className={cn(
                                        "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background shadow-sm",
                                        currentUser?.status === 'online' ? "bg-green-500" : "bg-muted-foreground"
                                    )} />
                                </div>
                            </div>
                        )}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" side="top" className="w-56 mb-2">
                        <div className="p-2 flex items-center gap-3 border-b mb-1">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={currentUser?.avatar_url} />
                                <AvatarFallback>{currentUser?.display_name?.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="text-sm font-bold">{currentUser?.display_name}</p>
                                <p className="text-[10px] text-muted-foreground">Set a status message</p>
                            </div>
                        </div>
                        <DropdownMenuItem className="gap-2">
                            <Circle className="h-2 w-2 text-green-500 fill-green-500" /> Set as Active
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                            <Circle className="h-2 w-2 text-yellow-500 fill-yellow-500" /> Set as Away
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                            <Circle className="h-2 w-2 text-red-500 fill-red-500" /> Do not disturb
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2">
                            <Settings className="h-4 w-4" /> Preferences
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-destructive">
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Channel Invite Dialog */}
            <ChannelDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                labId={labId}
                onChannelCreated={(ch) => onSelect(ch.id, 'channel')}
            />

            <InviteModal
                open={isInviteOpen}
                onOpenChange={setIsInviteOpen}
                labId={labId}
            />

            <HuddleBar
                isActive={isHuddleActive}
                channelName={activeHuddleChannel}
                onLeave={() => {
                    setIsHuddleActive(false);
                    toast.info("Left Huddle", {
                        description: "Voice session ended."
                    });
                }}
            />
        </div>
        </TooltipProvider>
    );
};
