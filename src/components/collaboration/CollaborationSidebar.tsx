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
    Atom,
    Microscope,
    FlaskConical,
    Dna,
    Activity,
    Users,
    Waves
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
import { supabase } from "@/integrations/supabase/client";

import { InviteModal } from "./InviteModal";
import { HuddleBar } from "./HuddleBar";

interface CollaborationSidebarProps {
    labId: string;
    selectedId: string | null;
    selectedType: 'channel' | 'dm' | 'app' | 'activity' | 'canvas' | 'list' | 'project' | 'file';
    onSelect: (id: string, type: 'channel' | 'dm' | 'app' | 'activity' | 'canvas' | 'list' | 'project' | 'file') => void;
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
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    const [isCollapsed, setIsCollapsed] = useState(() => {
        const saved = localStorage.getItem(`collab-sidebar-collapsed-${labId}`);
        return saved ? JSON.parse(saved) : false;
    });

    // Unread counts
    const { channelUnreadCounts, dmUnreadCount } = useUnreadCounts(labId, currentUser?.user_id || null);

    const [expandedSections, setExpandedSections] = useState({
        channels: true,
        projects: true,
        dms: true,
        apps: true,
        notebooks: false, // Renamed from canvases
        inventories: false, // Renamed from lists
    });

    useEffect(() => {
        if (labId) {
            loadData();
            const cleanup = subscribeToChannels();
            return () => {
                cleanup();
            };
        }
    }, [labId]);

    const [labName, setLabName] = useState("Research Workspace");

    const [recentDMs, setRecentDMs] = useState<string[]>([]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [chRes, tmRes, meRes, canvRes, listRes, labRes, dmRes] = await Promise.all([
                collaboration.getChannels(labId),
                collaboration.getTeamMembers(labId),
                auth.getUser(),
                collaboration.getCanvases(labId),
                collaboration.getLists(labId),
                supabase.from('labs' as any).select('name').eq('id', labId).single(),
                collaboration.getRecentConversations()
            ]);

            setChannels(chRes.data || []);
            setTeamMembers(tmRes.data || []);
            setCanvases(canvRes.data || []);
            setLists(listRes.data || []);
            if (labRes.data) setLabName((labRes.data as any).name);

            if (meRes) {
                const me = (tmRes.data || []).find(m => m.user_id === meRes.id);
                if (me) {
                    setCurrentUser(me);
                    setRecentDMs(dmRes.data || []);
                }
            }

            const savedFavorites = localStorage.getItem(`collab-favorites-${labId}`);
            if (savedFavorites) setFavorites(new Set(JSON.parse(savedFavorites)));
        } catch (error) {
            console.error("Error loading collaboration data:", error);
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
        return () => subscription.unsubscribe();
    };

    const handleCreateAction = (action: string) => {
        switch (action) {
            case 'channel': setIsDialogOpen(true); break;
            case 'invite': setIsInviteOpen(true); break;
            case 'canvas': handleCreateCanvas(); break;
            case 'list': handleCreateList(); break;
            case 'huddle': setIsHuddleActive(true); break;
            default: onSearchOpen?.();
        }
    };

    const handleCreateCanvas = async () => {
        const { data } = await collaboration.createCanvas("Scientific Notebook", labId);
        if (data) { setCanvases(prev => [data, ...prev]); onSelect(data.id, 'canvas'); }
    };

    const handleCreateList = async () => {
        const { data } = await collaboration.createList("Inventory Protocol", labId);
        if (data) { setLists(prev => [data, ...prev]); onSelect(data.id, 'list'); }
    };

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
    };

    const toggleFavorite = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setFavorites((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            localStorage.setItem(`collab-favorites-${labId}`, JSON.stringify(Array.from(next)));
            return next;
        });
    };

    const getChannelIcon = (type: ChatChannel["type"], isPrivate: boolean) => {
        if (isPrivate) return <Lock className="h-3.5 w-3.5" />;
        if (type === "project") return <Dna className="h-3.5 w-3.5 text-cyan-400" />;
        if (type === "announcement") return <Megaphone className="h-3.5 w-3.5 text-amber-400" />;
        return <Atom className="h-3.5 w-3.5 text-primary/70" />;
    };

    const renderSidebarItem = (
        id: string,
        label: string,
        icon: React.ReactNode,
        type: 'channel' | 'dm' | 'app' | 'activity' | 'canvas' | 'list',
        metadata?: { unread?: number; status?: TeamMember['status']; isFavorite?: boolean }
    ) => {
        const isActive = selectedId === id && selectedType === type;

        return (
            <div
                key={id}
                className={cn(
                    "group relative flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-all cursor-pointer mx-2 mb-0.5",
                    isActive
                        ? "bg-primary/15 text-primary font-semibold shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)] border-l-2 border-primary"
                        : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                )}
                onClick={() => onSelect(id, type)}
            >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className={cn("shrink-0 transition-transform group-hover:scale-110 duration-200", isActive && "text-primary")}>
                        {icon}
                    </div>
                    <span className="truncate flex-1 tracking-tight">
                        {label}
                    </span>
                    {metadata?.unread && metadata.unread > 0 && (
                        <div className="h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-black animate-in zoom-in duration-300">
                            {metadata.unread}
                        </div>
                    )}
                    {type === 'dm' && metadata?.status && (
                        <div className={cn(
                            "h-2 w-2 rounded-full",
                            metadata.status === 'online' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-muted-foreground/30"
                        )} />
                    )}
                </div>

                {(type === 'channel' || type === 'dm') && (
                    <Star
                        onClick={(e) => toggleFavorite(id, e)}
                        className={cn(
                            "h-3 w-3 opacity-0 group-hover:opacity-100 transition-all hover:scale-125",
                            metadata?.isFavorite && "opacity-100 fill-yellow-500 text-yellow-500"
                        )}
                    />
                )}
            </div>
        );
    };

    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [isHuddleActive, setIsHuddleActive] = useState(false);

    return (
        <TooltipProvider>
            <div className={cn(
                "border-r border-border/40 bg-background/80 backdrop-blur-xl flex flex-col h-full transition-all duration-300 relative",
                isCollapsed ? "w-20" : "w-[280px]",
                className
            )}>
                {/* Visual Accent - Science Gradient Line */}
                <div className="absolute left-0 top-0 w-[2px] h-full bg-gradient-to-b from-primary/50 via-cyan-500/30 to-transparent opacity-20" />

                {/* Workspace Identity Section */}
                <div className="p-5 border-b border-border/30 flex items-center justify-between group cursor-pointer hover:bg-muted/20 transition-all">
                    {!isCollapsed ? (
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 border border-primary/20 shadow-lg shadow-primary/5">
                                <FlaskConical className="h-5 w-5 text-primary animate-pulse" />
                            </div>
                            <div className="overflow-hidden">
                                <h2 className="font-bold text-[15px] truncate leading-tight tracking-tight text-foreground/90">{labName}</h2>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.05em]">Operational</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner mx-auto">
                            <FlaskConical className="h-5 w-5 text-primary" />
                        </div>
                    )}
                    {!isCollapsed && (
                        <UnifiedCreateMenu
                            onAction={handleCreateAction}
                            trigger={
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            }
                        />
                    )}
                </div>

                {/* Search Bar Refined */}
                <div className="px-4 py-4">
                    {!isCollapsed ? (
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start gap-2.5 bg-muted/20 border-border/30 hover:bg-muted/40 hover:border-primary/30 text-muted-foreground text-xs font-medium transition-all rounded-xl h-10 shadow-sm"
                            onClick={onSearchOpen}
                        >
                            <Search className="h-3.5 w-3.5 text-primary/50" />
                            <span className="opacity-70">Search Brain...</span>
                            <span className="ml-auto text-[9px] bg-background border border-border/50 px-1.5 py-0.5 rounded-md font-bold tracking-tighter">⌘K</span>
                        </Button>
                    ) : (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="w-12 h-12 mx-auto bg-muted/20 border-border/30 rounded-xl"
                                    onClick={onSearchOpen}
                                >
                                    <Search className="h-4 w-4 text-primary" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right">Quick Search (⌘K)</TooltipContent>
                        </Tooltip>
                    )}
                </div>

                {!isCollapsed ? (
                    <ScrollArea className="flex-1">
                        <div className="py-2 space-y-5">

                            {/* Intelligence Streams */}
                            <div className="space-y-1">
                                <p className="px-5 text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.15em] mb-2">Activity Monitor</p>
                                {renderSidebarItem('activity', 'Global Feed', <Activity className="h-4 w-4 text-emerald-400" />, 'activity' as any)}
                                {renderSidebarItem('mentions', 'Mentions', <AtSign className="h-4 w-4 text-primary/70" />, 'activity' as any)}
                                {renderSidebarItem('saved', 'Bookmarks', <Bookmark className="h-4 w-4 text-amber-500/70" />, 'activity' as any)}
                            </div>

                            {/* Research Units (Channels) */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between px-5 mb-2 group/section">
                                    <button
                                        onClick={() => toggleSection('channels')}
                                        className="flex items-center gap-2 text-[10px] font-black text-muted-foreground/80 hover:text-foreground uppercase tracking-[0.15em] transition-colors"
                                    >
                                        {expandedSections.channels ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                        Research Units
                                    </button>
                                    <Plus onClick={() => setIsDialogOpen(true)} className="h-3.5 w-3.5 text-muted-foreground hover:text-primary cursor-pointer transition-colors opacity-0 group-hover/section:opacity-100" />
                                </div>
                                {expandedSections.channels && (
                                    <div className="space-y-0.5">
                                        {channels.filter(ch => ch.type !== 'project').map(ch => renderSidebarItem(
                                            ch.id,
                                            ch.display_name || ch.name,
                                            getChannelIcon(ch.type, ch.is_private),
                                            'channel',
                                            { unread: channelUnreadCounts[ch.id] || 0, isFavorite: favorites.has(ch.id) }
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Active Experiments (Projects) */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between px-5 mb-2 group/section">
                                    <button
                                        onClick={() => toggleSection('projects')}
                                        className="flex items-center gap-2 text-[10px] font-black text-muted-foreground/80 hover:text-foreground uppercase tracking-[0.15em] transition-colors"
                                    >
                                        {expandedSections.projects ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                        Active Experiments
                                    </button>
                                </div>
                                {expandedSections.projects && (
                                    <div className="space-y-0.5 text-xs">
                                        {channels.filter(ch => ch.type === 'project').map(ch => renderSidebarItem(
                                            ch.id,
                                            ch.display_name || ch.name,
                                            <Dna className="h-4 w-4 text-cyan-400/70" />,
                                            'channel',
                                            { unread: channelUnreadCounts[ch.id] || 0, isFavorite: favorites.has(ch.id) }
                                        ))}
                                        {channels.filter(ch => ch.type === 'project').length === 0 && (
                                            <p className="text-[10px] text-muted-foreground/50 px-8 py-2 italic font-medium">No active streams...</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Autonomous Agents (Bot Apps) */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between px-5 mb-2 group/section text-primary/60">
                                    <button
                                        onClick={() => toggleSection('apps')}
                                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] transition-colors"
                                    >
                                        {expandedSections.apps ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                        Autonomous Agents
                                    </button>
                                    <Sparkles className="h-3 w-3 animate-pulse" />
                                </div>
                                {expandedSections.apps && (
                                    <div className="space-y-0.5">
                                        {renderSidebarItem('bioexpert', 'BioExpert AI', <Bot className="h-4 w-4 text-emerald-500" />, 'app')}
                                        {renderSidebarItem('pharma', 'PharmaBot', <Microscope className="h-4 w-4 text-blue-500" />, 'app')}
                                        {renderSidebarItem('clinical', 'Scribe-IQ', <Waves className="h-4 w-4 text-purple-500" />, 'app')}
                                    </div>
                                )}
                            </div>

                            {/* Collaborator Sync (DMs) */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between px-5 mb-2 group/section">
                                    <button
                                        onClick={() => toggleSection('dms')}
                                        className="flex items-center gap-2 text-[10px] font-black text-muted-foreground/80 hover:text-foreground uppercase tracking-[0.15em] transition-colors"
                                    >
                                        {expandedSections.dms ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                        Recent Syncs
                                        {dmUnreadCount > 0 && <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />}
                                    </button>
                                    <Users className="h-3.5 w-3.5 text-muted-foreground/50" />
                                </div>
                                {expandedSections.dms && (
                                    <div className="space-y-0.5">
                                        {Array.isArray(teamMembers) && teamMembers
                                            .filter(m => (recentDMs.includes(m.user_id) || selectedId === m.user_id) && m.user_id !== currentUser?.user_id)
                                            .map(m => renderSidebarItem(
                                                m.user_id,
                                                m.display_name,
                                                <Avatar className="h-5 w-5 border border-border/50">
                                                    <AvatarImage src={m.avatar_url} />
                                                    <AvatarFallback className="text-[8px] bg-primary/20">{m.display_name.substring(0, 2)}</AvatarFallback>
                                                </Avatar>,
                                                'dm',
                                                { status: m.status, isFavorite: favorites.has(m.user_id) }
                                            ))
                                        }
                                        {recentDMs.length === 0 && (
                                            <p className="text-[10px] text-muted-foreground/50 px-8 py-2 italic">Connect with collaborators...</p>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-full justify-start px-8 text-[10px] font-bold text-primary/60 hover:text-primary hover:bg-primary/5 transition-all mt-1"
                                            onClick={onSearchOpen}
                                        >
                                            <Plus className="h-3 w-3 mr-2" /> Find Collaborator
                                        </Button>
                                    </div>
                                )}
                            </div>

                        </div>
                    </ScrollArea>
                ) : (
                    <div className="flex-1 pt-4 space-y-4 flex flex-col items-center">
                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="group"><Activity className="h-5 w-5 text-emerald-400 transition-transform group-hover:scale-110" /></Button></TooltipTrigger><TooltipContent side="right">Feed</TooltipContent></Tooltip>
                        <div className="w-10 h-px bg-border/30" />
                        {channels.slice(0, 5).map(ch => (
                            <Tooltip key={ch.id}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant={selectedId === ch.id ? 'default' : 'ghost'}
                                        size="icon"
                                        className="rounded-xl h-11 w-11 relative"
                                        onClick={() => onSelect(ch.id, 'channel')}
                                    >
                                        {getChannelIcon(ch.type, ch.is_private)}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="right">{ch.display_name || ch.name}</TooltipContent>
                            </Tooltip>
                        ))}
                    </div>
                )}

                {/* Core User Status - Scientific Themed Footer */}
                <div className="p-4 border-t border-border/30 bg-muted/10 backdrop-blur-md">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-all cursor-pointer group border border-transparent hover:border-primary/20">
                                <div className="relative shrink-0">
                                    <Avatar className="h-9 w-9 border border-border transition-all group-hover:border-primary">
                                        <AvatarImage src={currentUser?.avatar_url} />
                                        <AvatarFallback className="bg-primary/10 text-primary font-bold">{currentUser?.display_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className={cn(
                                        "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background shadow-lg",
                                        currentUser?.status === 'online' ? "bg-emerald-500" : "bg-muted-foreground/50"
                                    )} />
                                </div>
                                {!isCollapsed && (
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold truncate tracking-tight text-foreground/90">{currentUser?.display_name || 'Computing...'}</p>
                                        <p className="text-[10px] text-primary/70 uppercase font-black tracking-widest leading-none mt-1">{currentUser?.role || 'Researcher'}</p>
                                    </div>
                                )}
                                {!isCollapsed && <Settings className="h-3.5 w-3.5 text-muted-foreground group-hover:rotate-90 transition-transform duration-500" />}
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" side="top" className="w-64 mb-4 border-primary/20 backdrop-blur-xl bg-background/90 p-2 shadow-2xl">
                            <div className="p-3 mb-2 bg-primary/5 rounded-lg border border-primary/10">
                                <p className="text-[10px] font-black uppercase text-primary/60 tracking-widest mb-1">Current Sync</p>
                                <p className="text-xs font-semibold text-foreground/80">{currentUser?.display_name}</p>
                            </div>
                            <DropdownMenuItem className="gap-2.5 rounded-lg">
                                <div className="h-2 w-2 rounded-full bg-emerald-500" /> Operational Status: Active
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="gap-2.5 rounded-lg">
                                <Settings className="h-4 w-4 opacity-70" /> System Preferences
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2.5 rounded-lg text-destructive">
                                <LayoutGrid className="h-4 w-4 opacity-70" /> Terminate Session
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Sub-modals */}
                <ChannelDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} labId={labId} onChannelCreated={(ch) => onSelect(ch.id, 'channel')} />
                <InviteModal open={isInviteOpen} onOpenChange={setIsInviteOpen} labId={labId} />
                <HuddleBar isActive={isHuddleActive} channelName="Sync Hub" onLeave={() => setIsHuddleActive(false)} />
            </div>
        </TooltipProvider>
    );
};
