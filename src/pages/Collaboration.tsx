import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { CollaborationSidebar } from "@/components/collaboration/CollaborationSidebar";
import { UnifiedChatPanel } from "@/components/collaboration/UnifiedChatPanel";
import { AppPanel } from "@/components/collaboration/AppPanel";
import { WorkspaceActivityLogs } from "@/components/collaboration/WorkspaceActivityLogs";
import { ThreadPanel } from "@/components/collaboration/ThreadPanel";
import { WorkspaceSearch } from "@/components/collaboration/WorkspaceSearch";
import { useServices } from "@/core/ServiceProvider";
import { useLab } from "@/contexts/LabContext";
import { ChatChannel, TeamMember, ChatMessage } from "@/core/interfaces";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Settings, Zap, Users, Info, Shield } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const Collaboration = () => {
  const { collaboration } = useServices();
  const { labId, loading: labLoading, error: labError } = useLab();
  const [selectedItem, setSelectedItem] = useState<{ id: string | null; type: 'channel' | 'dm' | 'app' | 'activity' | 'canvas' | 'list' }>({
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
      const [chRes, tmRes, canvRes, listRes] = await Promise.all([
        collaboration.getChannels(labId!),
        collaboration.getTeamMembers(labId!),
        collaboration.getCanvases(labId!),
        collaboration.getLists(labId!)
      ]);

      setChannels(chRes.data || []);
      setTeamMembers(tmRes.data || []);
      setCanvases(canvRes.data || []);
      setLists(listRes.data || []);

      if (chRes.data && chRes.data.length > 0 && !selectedItem.id) {
        setSelectedItem({ id: chRes.data[0].id, type: 'channel' });
      }
    } catch (error) {
      console.error("Load error:", error);
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
              <p className="text-muted-foreground">Loading your lab workspace...</p>
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
              <h2 className="text-2xl font-bold">Lab Access Required</h2>
              <p className="text-muted-foreground">
                {labError || "You don't have access to any lab workspace. Please contact your administrator to get invited to a lab."}
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
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-background">
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

              {/* Info Sidebar */}
              {showInfoSidebar && !activeThread && (
                <aside className="w-80 hidden xl:flex flex-col animate-in fade-in slide-in-from-right-5 duration-500">
                  <div className="p-4 border-b flex items-center justify-between bg-muted/10">
                    <h4 className="font-bold text-sm flex items-center gap-2"><Info className="h-4 w-4 text-primary" /> Project Context</h4>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><Settings className="h-4 w-4" /></Button>
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="p-5 space-y-8">
                      {selectedItem.type === 'channel' && (
                        <>
                          <div className="space-y-3">
                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest border-b pb-2">Topic</p>
                            <p className="text-sm font-medium leading-relaxed">
                              {channels.find(c => c.id === selectedItem.id)?.description || 'Exploring new pathways for mRNA delivery systems.'}
                            </p>
                          </div>
                          <div className="space-y-4">
                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest border-b pb-2">Security & Compliance</p>
                            <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                              <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                                <Shield className="h-3 w-3" /> HIPAA Compliant
                              </div>
                              <p className="text-[10px] text-emerald-600/70 leading-normal">This channel is audited for 21 CFR Part 11. All interactions are immutable.</p>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest border-b pb-2 flex items-center justify-between">
                              Active Members <Users className="h-3 w-3" />
                            </p>
                            <div className="flex -space-x-2 overflow-hidden">
                              {Array.isArray(teamMembers) && teamMembers.slice(0, 5).map(m => (
                                <Avatar key={m.id} className="inline-block h-8 w-8 ring-2 ring-background">
                                  <AvatarImage src={m.avatar_url} />
                                  <AvatarFallback>{m.display_name.substring(0, 2)}</AvatarFallback>
                                </Avatar>
                              ))}
                              {Array.isArray(teamMembers) && teamMembers.length > 5 && (
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted ring-2 ring-background text-[10px] font-bold">
                                  +{teamMembers.length - 5}
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      )}
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
