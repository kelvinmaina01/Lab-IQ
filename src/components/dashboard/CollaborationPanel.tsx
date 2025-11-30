import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, UserPlus, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface CollaborationPanelProps {
  bottleneckId: string;
  actionId?: string;
}

export const CollaborationPanel = ({ bottleneckId, actionId }: CollaborationPanelProps) => {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [assignments, setAssignments] = useState<any[]>([]);
  const [assignEmail, setAssignEmail] = useState("");
  const [assignNotes, setAssignNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchComments();
    if (actionId) fetchAssignments();
  }, [bottleneckId, actionId]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('bottleneck_comments')
        .select('*')
        .eq('bottleneck_id', bottleneckId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const fetchAssignments = async () => {
    if (!actionId) return;
    
    try {
      const { data, error } = await supabase
        .from('action_assignments')
        .select('*')
        .eq('action_id', actionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssignments(data || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('bottleneck_comments')
        .insert({
          bottleneck_id: bottleneckId,
          user_id: user.id,
          comment: newComment
        });

      if (error) throw error;

      setNewComment("");
      fetchComments();
      toast({
        title: "Comment Added",
        description: "Your comment has been posted.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!actionId || !assignEmail.trim()) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get action details
      const { data: action } = await supabase
        .from('next_actions')
        .select('title, description')
        .eq('id', actionId)
        .single();

      const { error } = await supabase
        .from('action_assignments')
        .insert({
          action_id: actionId,
          assigned_to_email: assignEmail,
          assigned_by: user.id,
          notes: assignNotes
        });

      if (error) throw error;

      // Send email notification
      try {
        await supabase.functions.invoke('send-notification-email', {
          body: {
            to: assignEmail,
            subject: `Action Assigned: ${action?.title || 'New Action'}`,
            type: 'action_assignment',
            data: {
              actionTitle: action?.title,
              actionDescription: action?.description,
              assignedBy: user.email || 'Team Member',
              notes: assignNotes
            }
          }
        });
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Don't fail the assignment if email fails
      }

      setAssignEmail("");
      setAssignNotes("");
      fetchAssignments();
      toast({
        title: "Action Assigned",
        description: `Successfully assigned to ${assignEmail}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Comments Section */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Comments
          </h3>
          <Badge variant="secondary">{comments.length}</Badge>
        </div>

        <div className="space-y-3 mb-4">
          {comments.map((comment) => (
            <div key={comment.id} className="p-3 bg-muted rounded-lg">
              <p className="text-sm">{comment.comment}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(comment.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={2}
          />
          <Button 
            size="icon" 
            onClick={handleAddComment}
            disabled={loading || !newComment.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {/* Assignment Section */}
      {actionId && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Assignments
            </h3>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Assign
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign Action</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Team Member Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="colleague@lab.com"
                      value={assignEmail}
                      onChange={(e) => setAssignEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Additional context or instructions..."
                      value={assignNotes}
                      onChange={(e) => setAssignNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <Button 
                    onClick={handleAssign} 
                    className="w-full"
                    disabled={loading || !assignEmail.trim()}
                  >
                    Assign Action
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-2">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{assignment.assigned_to_email}</p>
                  <Badge variant="outline">Assigned</Badge>
                </div>
                {assignment.notes && (
                  <p className="text-xs text-muted-foreground mt-1">{assignment.notes}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(assignment.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};