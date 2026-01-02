import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { CollaborationSidebar } from "@/components/collaboration/CollaborationSidebar";
import { UnifiedChatPanel } from "@/components/collaboration/UnifiedChatPanel";
import { AppPanel } from "@/components/collaboration/AppPanel";
import { WorkspaceActivityLogs } from "@/components/collaboration/WorkspaceActivityLogs";
import { ThreadPanel } from "@/components/collaboration/ThreadPanel";
import { WorkspaceSearch } from "@/components/collaboration/WorkspaceSearch";
import { FileSharing } from "@/components/collaboration/FileSharing";
import { useServices } from "@/core/ServiceProvider";
import { useLab } from "@/contexts/LabContext";
import { ChatChannel, ChatMessage } from "@/core/interfaces";
import { teamService, TeamMember } from "@/lib/services/teamService";
import { auditService } from "@/lib/services/auditService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Settings, Zap, Users, Shield, Activity, Atom } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const Collaboration = () => {
  const { collaboration } = useServices();
  const { labId, loading: labLoading, error: labError } = useLab();
  const [selectedItem, setSelectedItem] = useState<{ id: string | null; type: 'channel' | 'dm' | 'app' | 'activity' | 'canvas' | 'list' | 'project' | 'file' }>({
    id: null,
    type: 'channel'
  });

  // UI States
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeThread, setActiveThread] = useState<ChatMessage | null>(null);
  const [showInfoSidebar, setShowInfoSidebar] = useState(true);

  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [canvases, setCanvases] = useState<any[]>([]);
  const [lists, setLists] = useState<any[]>([]);

  useEffect(() => {
    // Command+K listener
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (labId) loadInitialData();
  }, [labId]);

  const loadInitialData = async () => {
    try {
      console.log('[Collaboration] Loading initial data for labId:', labId);

      const [chRes, tmRes, canvRes, listRes] = await Promise.all([
        collaboration.getChannels(labId!),
        teamService.getMembers(), // Use new Service
        collaboration.getCanvases(labId!),
        collaboration.getLists(labId!)
      ]);

      // Log access for compliance
      await auditService.logAction('view_collaboration', 'workspace', labId!);

      console.log('[Collaboration] API Responses:', {
        channels: { data: chRes.data, isArray: Array.isArray(chRes.data), type: typeof chRes.data },
        teamMembers: { data: tmRes.data, isArray: Array.isArray(tmRes.data), type: typeof tmRes.data },
        canvases: { data: canvRes.data, isArray: Array.isArray(canvRes.data), type: typeof canvRes.data },
        lists: { data: listRes.data, isArray: Array.isArray(listRes.data), type: typeof listRes.data }
      });

      // Ensure all data is properly formatted as arrays
      const channelsArray = Array.isArray(chRes.data) ? chRes.data : [];
      // teamService returns array directly
      const teamMembersArray = Array.isArray(tmRes) ? tmRes : (Array.isArray(tmRes.data) ? tmRes.data : []); // Handle both if type confusion
      const canvasesArray = Array.isArray(canvRes.data) ? canvRes.data : [];
      const listsArray = Array.isArray(listRes.data) ? listRes.data : [];

      console.log('[Collaboration] Processed arrays:', {
        channels: channelsArray.length,
        teamMembers: teamMembersArray.length,
        canvases: canvasesArray.length,
        lists: listsArray.length
      });

      setChannels(channelsArray);
      setTeamMembers(teamMembersArray);
      setCanvases(canvasesArray);
      setLists(listsArray);

      if (chRes.data && Array.isArray(chRes.data) && chRes.data.length > 0 && !selectedItem.id) {
        console.log('[Collaboration] Auto-selecting first channel:', chRes.data[0].id);
        setSelectedItem({ id: chRes.data[0].id, type: 'channel' });
      } else {
        console.log('[Collaboration] No channels to auto-select or item already selected');
      }

      console.log('[Collaboration] ✅ Initial data loaded successfully');
    } catch (error) {
      console.error('[Collaboration] ❌ Load error:', error);
      toast.error("Failed to load collaboration data");
    }
  };

  const handleSelect = (id: string, type: any) => {
    setSelectedItem({ id, type });
    setActiveThread(null); // Clear thread on navigation
  };

  const getTitle = () => {
    if (selectedItem.type === 'channel') return channels.find(c => c.id === selectedItem.id)?.display_name || 'Channel';
    if (selectedItem.type === 'dm') return teamMembers.find(m => m.user_id === selectedItem.id)?.display_name || 'Direct Message';
    if (selectedItem.type === 'canvas') return canvases.find(c => c.id === selectedItem.id)?.title || 'Scientific Canvas';
    if (selectedItem.type === 'list') return lists.find(l => l.id === selectedItem.id)?.title || 'Task List';
    if (selectedItem.type === 'project') return 'Research Project';
    if (selectedItem.type === 'file') return 'Scientific Asset';
    if (selectedItem.type === 'app') return selectedItem.id === 'bioexpert' ? 'BioExpert AI' : selectedItem.id === 'pharma' ? 'PharmaBot' : 'ClinicalScribe';
    return 'Activity';
  };

  // Loading state
  if (labLoading) {
    return (
      <AuthGuard>
        <MainLayout>
          <div className="flex items-center justify-center h-[calc(100vh-64px)]">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
              <p className="text-muted-foreground">Loading your workspace...</p>
            </div>
          </div>
        </MainLayout>
      </AuthGuard>
    );
  }

  // Error state
  if (labError || !labId) {
    return (
      <AuthGuard>
        <MainLayout>
          <div className="flex items-center justify-center h-[calc(100vh-64px)]">
            <div className="text-center space-y-4 max-w-md">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                <Shield className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="text-2xl font-bold">Workspace Access Required</h2>
              <p className="text-muted-foreground">
                {labError || "You don't have access to any workspace. Please contact your administrator to get invited."}
              </p>
              <Button onClick={() => window.location.reload()} variant="outline">
                Retry
              </Button>
            </div>
          </div>
        </MainLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <MainLayout>
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-background" data-tour="team-section">
          {/* Sidebar */}
          {labId && (
            <CollaborationSidebar
              labId={labId}
              selectedId={selectedItem.id}
              selectedType={selectedItem.type}
              onSelect={handleSelect}
              onSearchOpen={() => setIsSearchOpen(true)}
              className="w-72 shrink-0 hidden md:flex border-r-0 bg-muted/5 shadow-[1px_0_0_0_rgba(0,0,0,0.05)]"
            />
          )}

          {/* Content Section */}
          <div className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden">
            <div className="flex-1 flex overflow-hidden">
              <main className="flex-1 flex flex-col min-w-0 border-r">
                {['channel', 'dm', 'canvas', 'list'].includes(selectedItem.type) ? (
                  <UnifiedChatPanel
                    key={`${selectedItem.type}-${selectedItem.id}`}
                    id={selectedItem.id}
                    labId={labId!}
                    type={selectedItem.type as any}
                    title={getTitle()}
                    onThreadOpen={(msg) => setActiveThread(msg)}
                  />
                ) : selectedItem.type === 'app' ? (
                  <AppPanel appId={selectedItem.id as any} key={selectedItem.id} />
                ) : selectedItem.type === 'project' ? (
                  <div className="flex-1 overflow-auto bg-background p-6">
                    <FileSharing projectId={selectedItem.id!} />
                  </div>
                ) : selectedItem.type === 'file' ? (
                  <div className="flex-1 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm p-12 text-center space-y-4">
                    <Atom className="h-12 w-12 text-primary/40 animate-pulse" />
                    <h3 className="text-xl font-bold">Scientific Asset View</h3>
                    <p className="text-muted-foreground text-sm max-w-sm">This file is being prepared for the quantum previewer. Use the search to locate its parent project for full access.</p>
                    <Button variant="outline" size="sm" onClick={() => setSelectedItem({ id: null, type: 'activity' })}>Back to Stream</Button>
                  </div>
                ) : (
                  <WorkspaceActivityLogs labId={labId!} />
                )}
              </main>

              {/* Thread Panel */}
              {activeThread && selectedItem.id && (
                <ThreadPanel
                  parentMessage={activeThread}
                  channelId={selectedItem.id}
                  onClose={() => setActiveThread(null)}
                />
              )}

              {/* Research Context Ribbon */}
              {showInfoSidebar && !activeThread && (
                <aside className="w-80 hidden xl:flex flex-col animate-in fade-in slide-in-from-right-5 duration-700 bg-muted/5 border-l border-border/40">
                  <div className="p-6 border-b border-border/30 bg-muted/10 backdrop-blur-md">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-black text-[11px] uppercase tracking-[0.2em] text-primary/70 flex items-center gap-2">
                        <Activity className="h-3 w-3 animate-pulse text-emerald-500" />
                        Context Engine
                      </h4>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-primary/10 hover:text-primary transition-all"><Settings className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold tracking-tight text-foreground/90 truncate">{getTitle()}</h3>
                  </div>

                  <ScrollArea className="flex-1">
                    <div className="p-6 space-y-10">

                      {/* Operational Status */}
                      <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-[0.15em] border-b border-border/30 pb-2">Stream Parameters</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-muted/30 p-3 rounded-xl border border-border/20">
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Signal Strength</p>
                            <p className="text-sm font-black text-emerald-500">OPTIMAL</p>
                          </div>
                          <div className="bg-muted/30 p-3 rounded-xl border border-border/20">
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Audit Protocol</p>
                            <p className="text-sm font-black text-primary/80">L3-ACTIVE</p>
                          </div>
                        </div>
                      </div>

                      {/* Scientific Topic / Mission */}
                      <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-[0.15em] border-b border-border/30 pb-2">Research Directive</p>
                        <div className="relative p-0.5 rounded-2xl bg-gradient-to-br from-primary/20 via-transparent to-cyan-500/10">
                          <div className="bg-background/40 backdrop-blur-sm p-4 rounded-2xl border border-border/30">
                            <p className="text-sm font-medium leading-relaxed text-foreground/80 italic">
                              "{selectedItem.type === 'channel'
                                ? channels.find(c => c.id === selectedItem.id)?.description || 'Analyzing molecular interaction patterns for high-throughput screening initiatives.'
                                : 'Direct intelligence exchange between research collaborators.'}"
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Compliance & Security */}
                      <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-[0.15em] border-b border-border/30 pb-2">Security Vector</p>
                        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)]">
                          <div className="flex items-center gap-2 text-[11px] font-black text-emerald-600 dark:text-emerald-400 mb-2">
                            <Shield className="h-3.5 w-3.5" /> ISO-27001 SECURE
                          </div>
                          <p className="text-[10px] text-muted-foreground/80 leading-relaxed font-medium">
                            End-to-end encrypted research environment. All data is protected with enterprise-grade security.
                          </p>
                        </div>
                      </div>

                      {/* Collaborator Grid */}
                      <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-[0.15em] border-b border-border/30 pb-2 flex items-center justify-between">
                          Synapse Network <Users className="h-3 w-3 text-primary/50" />
                        </p>
                        <div className="flex flex-wrap gap-2.5">
                          {teamMembers.slice(0, 12).map(m => (
                            <Tooltip key={m.id}>
                              <TooltipTrigger asChild>
                                <div className="relative group cursor-pointer">
                                  <Avatar className="h-9 w-9 border-2 border-background ring-1 ring-border shadow-sm transition-all group-hover:scale-110 group-hover:ring-primary/50 group-hover:z-10">
                                    <AvatarImage src={m.avatar_url} />
                                    <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-black">{m.display_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                  {m.status === 'online' && (
                                    <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-background shadow-emerald-500/50 shadow-sm" />
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>{m.display_name} • {m.role}</TooltipContent>
                            </Tooltip>
                          ))}
                          {teamMembers.length > 12 && (
                            <div className="h-9 w-9 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-black text-muted-foreground ring-1 ring-border">
                              +{teamMembers.length - 12}
                            </div>
                          )}
                        </div>
                        <Button variant="outline" className="w-full text-[10px] font-black uppercase tracking-widest h-9 rounded-xl border-border/40 hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-all">
                          Manage Team Directory
                        </Button>
                      </div>

                      {/* Diagnostic Footprint */}
                      <div className="pt-6 mt-6 border-t border-border/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Atom className="h-3 w-3 text-primary/40 animate-spin-slow" />
                          <p className="text-[9px] font-black text-muted-foreground/40 tracking-widest">LABIQ HEALTH SYNC v4.2</p>
                        </div>
                        <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                          <div className="w-2/3 h-full bg-gradient-to-r from-primary/50 to-cyan-500/50" />
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </aside>
              )}
            </div>
          </div>
        </div>

        {/* Global Overlays */}
        {labId && (
          <WorkspaceSearch
            open={isSearchOpen}
            onOpenChange={setIsSearchOpen}
            labId={labId}
            onSelect={handleSelect}
          />
        )}
      </MainLayout>
    </AuthGuard>
  );
};

export default Collaboration;
