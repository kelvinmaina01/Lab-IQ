import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Hash, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useServices } from "@/core/ServiceProvider";

interface ChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labId: string;
  onChannelCreated?: (channel: any) => void;
}

export const ChannelDialog = ({ open, onOpenChange, labId, onChannelCreated }: ChannelDialogProps) => {
  const { collaboration } = useServices();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"general" | "project" | "announcement">("general");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Channel name is required");
      return;
    }

    // Validate channel name format
    const channelName = name.trim().toLowerCase().replace(/\s+/g, '-');
    if (channelName.length < 2) {
      toast.error("Channel name must be at least 2 characters");
      return;
    }

    try {
      setIsCreating(true);

      // Create channel via service
      const newChannel = {
        name: channelName,
        display_name: name.trim(),
        description: description.trim() || undefined,
        type,
        is_private: isPrivate,
        lab_id: labId,
      };

      const { data: channel, error } = await collaboration.createChannel(newChannel);

      if (error) {
        console.error("Error creating channel:", error);
        toast.error("Failed to create channel");
        return;
      }

      toast.success(`Channel #${channelName} created successfully!`);

      // Call callback if provided
      if (onChannelCreated && channel) {
        onChannelCreated(channel);
      }

      // Reset form and close dialog
      setName("");
      setDescription("");
      setType("general");
      setIsPrivate(false);
      onOpenChange(false);

    } catch (error) {
      console.error("Error creating channel:", error);
      toast.error("Something went wrong");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Create a Channel
          </DialogTitle>
          <DialogDescription>
            Channels are where your team communicates. They're best organized around a topic — #marketing, for example.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Channel Name */}
          <div className="space-y-2">
            <Label htmlFor="channel-name">
              Channel Name <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">#</span>
              <Input
                id="channel-name"
                placeholder="e.g. team-updates"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1"
                disabled={isCreating}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Names must be lowercase, without spaces or periods, and can't be longer than 80 characters.
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="channel-description">Description (optional)</Label>
            <Textarea
              id="channel-description"
              placeholder="What's this channel about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              disabled={isCreating}
            />
          </div>

          {/* Channel Type */}
          <div className="space-y-2">
            <Label htmlFor="channel-type">Channel Type</Label>
            <Select value={type} onValueChange={(value: any) => setType(value)} disabled={isCreating}>
              <SelectTrigger id="channel-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">General</span>
                    <span className="text-xs text-muted-foreground">For everyday team discussions</span>
                  </div>
                </SelectItem>
                <SelectItem value="project">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Project</span>
                    <span className="text-xs text-muted-foreground">Dedicated to a specific project</span>
                  </div>
                </SelectItem>
                <SelectItem value="announcement">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Announcement</span>
                    <span className="text-xs text-muted-foreground">Important team announcements</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Privacy Toggle */}
          <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="is-private" className="font-medium cursor-pointer">
                  Make Private
                </Label>
                <p className="text-xs text-muted-foreground">
                  Only invited members can access this channel
                </p>
              </div>
            </div>
            <Switch
              id="is-private"
              checked={isPrivate}
              onCheckedChange={setIsPrivate}
              disabled={isCreating}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isCreating || !name.trim()}>
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Channel"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
