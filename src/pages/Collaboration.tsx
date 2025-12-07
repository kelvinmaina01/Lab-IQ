import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Users, Mail, Search, MoreVertical, FileText, MessageSquare, Activity, Upload, MessageCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ChatPanel } from "@/components/collaboration/ChatPanel";
import { ChannelSidebar } from "@/components/collaboration/ChannelSidebar";
import { CommentsSystem } from "@/components/collaboration/CommentsSystem";
import { FileSharing } from "@/components/collaboration/FileSharing";
import { ActivityTimeline } from "@/components/collaboration/ActivityTimeline";
import { TeamLeaderboard } from "@/components/collaboration/TeamLeaderboard";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradeDialog } from "@/components/UpgradeDialog";
import { usePresence } from "@/hooks/usePresence";
import { teamService } from "@/services/teamService";
import { supabase } from "@/integrations/supabase/client";
import { toast as sonnerToast } from "sonner";

const Collaboration = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "researcher" | "analyst" | "viewer">("researcher");

  // Real data state
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [sharedProjects, setSharedProjects] = useState<any[]>([]);
  const [labId, setLabId] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  const { toast } = useToast();
  const { subscription, loading } = useSubscription();

  // Track user presence (online/offline)
  usePresence();

  // Initialize collaboration data
  useEffect(() => {
    initializeCollaboration();
  }, []);

  const initializeCollaboration = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get or create user's team member record
      let { data: teamMember } = await teamService.getCurrentUserTeamMember();

      // If user doesn't have a team member record, create one
      if (!teamMember) {
        const defaultLabId = '00000000-0000-0000-0000-000000000001'; // Default lab for testing
        await teamService.upsertTeamMember({
          lab_id: defaultLabId,
          role: 'researcher',
          display_name: user.email?.split('@')[0] || 'User',
          status: 'online'
        });

        teamMember = (await teamService.getCurrentUserTeamMember()).data;
      }

      if (teamMember) {
        setLabId(teamMember.lab_id);

        // Load team members
        const { data: members } = await teamService.getTeamMembers(teamMember.lab_id);
        if (members) {
          setTeamMembers(members);
        }

        // Load chat channels
        const { data: channelsData } = await supabase
          .from('chat_channels')
          .select('*')
          .eq('lab_id', teamMember.lab_id)
          .order('created_at', { ascending: false });

        if (channelsData && channelsData.length > 0) {
          setChannels(channelsData);
          setSelectedChannelId(channelsData[0].id);
        } else {
          // Create a default General channel if none exists
          const { data: newChannel } = await supabase
            .from('chat_channels')
            .insert({
              name: 'General',
              description: 'General discussion channel',
              lab_id: teamMember.lab_id,
              type: 'general',
              created_by: user.id
            })
            .select()
            .single();

          if (newChannel) {
            setChannels([newChannel]);
            setSelectedChannelId(newChannel.id);
          }
        }
      }
    } catch (error) {
      console.error('Error initializing collaboration:', error);
      sonnerToast.error('Failed to load collaboration data');
    } finally {
      setLoadingData(false);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail || !labId) return;

    try {
      await teamService.inviteMember(inviteEmail, inviteRole, labId);
      sonnerToast.success("Invitation sent successfully!");
      setIsInviteDialogOpen(false);
      setInviteEmail("");
      setInviteRole("researcher");
    } catch (error) {
      console.error('Error inviting member:', error);
      sonnerToast.error("Failed to send invitation");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "bg-green-500";
      case "away": return "bg-orange-500";
      case "offline": return "bg-gray-500";
      default: return "bg-gray-500";
    }
  };

  const filteredMembers = teamMembers.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AuthGuard>
      <MainLayout>
        <main className="p-4 md:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Collaboration</h1>
              <p className="text-muted-foreground">Work together with your team members</p>
            </div>
            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" placeholder="colleague@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select>
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="researcher">Researcher</SelectItem>
                        <SelectItem value="analyst">Data Analyst</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleInviteMember} className="w-full gap-2">
                    <Mail className="w-4 h-4" />
                    Send Invitation
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search team members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Tabs defaultValue="team" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
              <TabsTrigger value="team">
                <Users className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Team</span>
              </TabsTrigger>
              <TabsTrigger value="projects">
                <FileText className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Projects</span>
              </TabsTrigger>
              <TabsTrigger value="chat">
                <MessageSquare className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Chat</span>
                {subscription?.tier === "free" && <Badge variant="secondary" className="ml-2 text-xs hidden lg:inline">Pro</Badge>}
              </TabsTrigger>
              <TabsTrigger value="comments">
                <MessageCircle className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Comments</span>
              </TabsTrigger>
              <TabsTrigger value="files">
                <Upload className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Files</span>
              </TabsTrigger>
              <TabsTrigger value="activity">
                <Activity className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Activity</span>
              </TabsTrigger>
            </TabsList>

            {/* Team Members Tab */}
            {/* Team Members Tab */}
            <TabsContent value="team" data-tour="team-section">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Member List (2 cols wide) */}
                <div className="xl:col-span-2 space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Team Members ({filteredMembers.length})</h3>
                  </div>
                  {filteredMembers.map((member) => (
                    <Card key={member.id} className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="relative">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={member.avatar} alt={member.name} />
                              <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(member.status)}`} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">{member.name}</h3>
                            <p className="text-sm text-muted-foreground mb-2">{member.role}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                              <span>{member.projects} projects</span>
                              <span>{member.lastActive}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" className="gap-2">
                                <MessageSquare className="w-3 h-3" />
                                Message
                              </Button>
                              <Button size="sm" variant="outline" className="gap-2">
                                <FileText className="w-3 h-3" />
                                View Work
                              </Button>
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Leaderboard (1 col wide) */}
                <div className="xl:col-span-1">
                  <TeamLeaderboard />
                </div>
              </div>
            </TabsContent>

            {/* Shared Projects Tab */}
            <TabsContent value="projects">
              <div className="space-y-4">
                {sharedProjects.map((project) => (
                  <Card key={project.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="p-3 rounded-lg bg-primary/10">
                          <FileText className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{project.name}</h3>
                            <Badge variant={project.status === "active" ? "default" : "secondary"}>
                              {project.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            <span>Owner: {project.owner}</span>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              {project.members} members
                            </div>
                            <span>Updated {project.lastUpdate}</span>
                          </div>
                        </div>
                      </div>
                      <Button>View Project</Button>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Real-Time Chat Tab */}
            <TabsContent value="chat">
              {false && subscription?.tier === "free" ? (
                <Card className="p-8 text-center">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">Real-Time Chat</h3>
                  <p className="text-muted-foreground mb-4">
                    Collaborate in real-time with your team members using our integrated chat feature.
                  </p>
                  <Button onClick={() => setUpgradeOpen(true)}>
                    Upgrade to Pro
                  </Button>
                </Card>
              ) : (
                <div className="flex gap-0 h-[calc(100vh-280px)] border rounded-lg overflow-hidden">
                  {loadingData ? (
                    <div className="flex items-center justify-center p-12 flex-1">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <p className="ml-4 text-muted-foreground">Loading chat...</p>
                    </div>
                  ) : (
                    <>
                      {/* Channel Sidebar */}
                      {labId && (
                        <ChannelSidebar
                          labId={labId}
                          selectedChannelId={selectedChannelId}
                          onChannelSelect={setSelectedChannelId}
                          className="w-64 flex-shrink-0"
                        />
                      )}

                      {/* Chat Panel */}
                      <div className="flex-1 min-w-0">
                        <ChatPanel
                          channelId={selectedChannelId}
                          projectName={channels.find(c => c.id === selectedChannelId)?.display_name || channels.find(c => c.id === selectedChannelId)?.name || "General"}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Comments Tab */}
            <TabsContent value="comments">
              <CommentsSystem
                entityId="project-1"
                entityType="experiment"
                entityName="Protein Structure Analysis"
              />
            </TabsContent>

            {/* File Sharing Tab */}
            <TabsContent value="files">
              <FileSharing
                projectId="project-1"
                projectName="Protein Structure Analysis"
              />
            </TabsContent>

            {/* Activity Feed Tab */}
            <TabsContent value="activity">
              <ActivityTimeline />
            </TabsContent>
          </Tabs>

          <UpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} />
        </main>
      </MainLayout>
    </AuthGuard>
  );
};

export default Collaboration;
