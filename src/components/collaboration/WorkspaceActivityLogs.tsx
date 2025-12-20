import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  MessageSquare,
  Share2,
  UserPlus,
  TestTube,
  FileText,
  Database,
  TrendingUp,
  Bell,
  Zap,
  CheckCircle2,
  AlertCircle,
  Info,
  Sparkles
} from 'lucide-react';
import { useServices } from '@/core/ServiceProvider';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ActivityLog {
  id: string;
  user_id: string;
  action_type: string;
  entity_type?: string;
  entity_id?: string;
  description: string;
  metadata?: any;
  created_at: string;
  user?: {
    display_name: string;
    avatar_url?: string;
  };
}

interface WorkspaceActivityLogsProps {
  labId: string;
}

export const WorkspaceActivityLogs = ({ labId }: WorkspaceActivityLogsProps) => {
  const { collaboration } = useServices();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'datasets' | 'experiments' | 'reports' | 'messages'>('all');

  useEffect(() => {
    if (labId) {
      loadActivities();
    }
  }, [labId]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const { data, error } = await collaboration.getActivities(labId);

      if (error) {
        console.error('Error loading activities:', error);
        return;
      }

      if (data) {
        setActivities(data as ActivityLog[]);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (actionType: string, entityType?: string) => {
    switch (actionType) {
      case 'upload':
      case 'file_upload':
        return <Upload className="h-4 w-4 text-blue-500" />;
      case 'message':
      case 'comment':
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case 'share':
        return <Share2 className="h-4 w-4 text-purple-500" />;
      case 'invite':
        return <UserPlus className="h-4 w-4 text-orange-500" />;
      case 'experiment':
      case 'experiment_created':
        return <TestTube className="h-4 w-4 text-cyan-500" />;
      case 'report':
      case 'report_generated':
        return <FileText className="h-4 w-4 text-indigo-500" />;
      case 'dataset':
      case 'dataset_uploaded':
        return <Database className="h-4 w-4 text-emerald-500" />;
      case 'insight':
      case 'insight_generated':
        return <Sparkles className="h-4 w-4 text-yellow-500" />;
      case 'success':
      case 'workflow_success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'warning':
      case 'workflow_warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'automation':
      case 'workflow_started':
        return <Zap className="h-4 w-4 text-amber-500" />;
      default:
        return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActivityColor = (actionType: string) => {
    switch (actionType) {
      case 'upload':
      case 'file_upload':
        return 'bg-blue-500/10 border-blue-500/20';
      case 'message':
      case 'comment':
        return 'bg-green-500/10 border-green-500/20';
      case 'share':
        return 'bg-purple-500/10 border-purple-500/20';
      case 'invite':
        return 'bg-orange-500/10 border-orange-500/20';
      case 'experiment':
      case 'experiment_created':
        return 'bg-cyan-500/10 border-cyan-500/20';
      case 'report':
      case 'report_generated':
        return 'bg-indigo-500/10 border-indigo-500/20';
      case 'dataset':
      case 'dataset_uploaded':
        return 'bg-emerald-500/10 border-emerald-500/20';
      case 'insight':
      case 'insight_generated':
        return 'bg-yellow-500/10 border-yellow-500/20';
      case 'success':
      case 'workflow_success':
        return 'bg-green-500/10 border-green-500/20';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/20';
      case 'automation':
        return 'bg-amber-500/10 border-amber-500/20';
      default:
        return 'bg-muted/50 border-border';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return format(date, 'MMM d, HH:mm');
  };

  const filteredActivities = activities.filter(activity => {
    if (filter === 'all') return true;
    if (filter === 'datasets') return activity.action_type?.includes('dataset');
    if (filter === 'experiments') return activity.action_type?.includes('experiment');
    if (filter === 'reports') return activity.action_type?.includes('report');
    if (filter === 'messages') return activity.action_type === 'message' || activity.action_type === 'comment';
    return true;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Workspace Activity</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time activity feed from your team
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          {[
            { value: 'all', label: 'All Activity' },
            { value: 'datasets', label: 'Datasets' },
            { value: 'experiments', label: 'Experiments' },
            { value: 'reports', label: 'Reports' },
            { value: 'messages', label: 'Messages' }
          ].map(tab => (
            <Badge
              key={tab.value}
              variant={filter === tab.value ? 'default' : 'outline'}
              className={cn(
                "cursor-pointer transition-all",
                filter === tab.value ? 'shadow-sm' : 'hover:bg-muted'
              )}
              onClick={() => setFilter(tab.value as any)}
            >
              {tab.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Activity Feed */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="h-10 w-10 bg-muted rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[400px] p-8 text-center">
            <Bell className="h-16 w-16 text-muted-foreground opacity-50 mb-4" />
            <h3 className="font-semibold text-lg mb-2">No activity yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Team activity will appear here as members upload datasets, run experiments, share reports, and collaborate.
            </p>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {filteredActivities.map((activity, idx) => (
              <div
                key={activity.id}
                className="flex gap-4 group hover:bg-muted/30 p-4 rounded-lg transition-colors"
              >
                {/* Icon */}
                <div className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center border flex-shrink-0",
                  getActivityColor(activity.action_type)
                )}>
                  {getActivityIcon(activity.action_type, activity.entity_type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {activity.user && (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={activity.user.avatar_url} />
                            <AvatarFallback className="text-xs">
                              {activity.user.display_name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm">{activity.user.display_name}</span>
                        </div>
                      )}
                      <span className="text-sm text-muted-foreground">{activity.description}</span>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formatTime(activity.created_at)}
                    </span>
                  </div>

                  {/* Metadata */}
                  {activity.metadata && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {activity.metadata.resourceName && (
                        <Badge variant="outline" className="text-xs">
                          {activity.metadata.resourceName}
                        </Badge>
                      )}
                      {activity.metadata.channelName && (
                        <Badge variant="outline" className="text-xs">
                          #{activity.metadata.channelName}
                        </Badge>
                      )}
                      {activity.metadata.tags && Array.isArray(activity.metadata.tags) && (
                        activity.metadata.tags.slice(0, 3).map((tag: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Load More (if needed) */}
            {activities.length >= 50 && (
              <div className="text-center py-4">
                <p className="text-xs text-muted-foreground">
                  Showing last 50 activities
                </p>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
