import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Share2, Hash, Lock, CheckCircle2 } from 'lucide-react';
import { useServices } from '@/core/ServiceProvider';
import { useLab } from '@/contexts/LabContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ShareToChannelButtonProps {
  resourceId: string;
  resourceType: 'dataset' | 'experiment' | 'report' | 'workflow' | 'protocol';
  resourceName: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export const ShareToChannelButton = ({
  resourceId,
  resourceType,
  resourceName,
  variant = 'outline',
  size = 'sm',
  className
}: ShareToChannelButtonProps) => {
  const { collaboration } = useServices();
  const { labId } = useLab();
  const [isOpen, setIsOpen] = useState(false);
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);

  const loadChannels = async () => {
    if (!labId) return;

    setLoading(true);
    try {
      const { data, error } = await collaboration.getChannels(labId);
      if (error) throw error;
      if (data) setChannels(data);
    } catch (error) {
      console.error('Error loading channels:', error);
      toast.error('Failed to load channels');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (channelId: string) => {
    if (!labId) return;

    setSharing(true);
    setSelectedChannelId(channelId);

    try {
      const { error } = await collaboration.shareResource(resourceId, resourceType, channelId);

      if (error) throw error;

      // Log activity
      const channel = channels.find(c => c.id === channelId);
      await collaboration.getActivities(labId); // Refresh activities

      toast.success('Resource shared!', {
        description: `${resourceName} was shared to #${channel?.display_name || 'channel'}`,
        icon: <CheckCircle2 className="h-4 w-4 text-green-500" />
      });

      setIsOpen(false);
    } catch (error) {
      console.error('Error sharing resource:', error);
      toast.error('Failed to share resource');
    } finally {
      setSharing(false);
      setSelectedChannelId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn("gap-2", className)}
          onClick={loadChannels}
        >
          <Share2 className="h-4 w-4" />
          Share to Channel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share to Channel</DialogTitle>
          <DialogDescription>
            Share <span className="font-medium">{resourceName}</span> with your team
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Resource Info */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline" className="capitalize">
                {resourceType}
              </Badge>
              <span className="font-medium truncate">{resourceName}</span>
            </div>
          </div>

          {/* Channel List */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Select a channel:</p>
            <ScrollArea className="h-[300px] rounded-lg border">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Loading channels...</p>
                </div>
              ) : channels.length === 0 ? (
                <div className="p-8 text-center">
                  <Hash className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">No channels available</p>
                </div>
              ) : (
                <div className="p-2">
                  {channels.map(channel => (
                    <button
                      key={channel.id}
                      onClick={() => handleShare(channel.id)}
                      disabled={sharing}
                      className={cn(
                        "w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors text-left",
                        sharing && selectedChannelId === channel.id && "bg-primary/10"
                      )}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {channel.is_private ? (
                          <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {channel.display_name || channel.name}
                          </p>
                          {channel.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {channel.description}
                            </p>
                          )}
                        </div>
                      </div>
                      {sharing && selectedChannelId === channel.id ? (
                        <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin flex-shrink-0" />
                      ) : (
                        <Share2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          <p className="text-xs text-muted-foreground">
            The resource will be posted as a message in the channel with a preview card
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
