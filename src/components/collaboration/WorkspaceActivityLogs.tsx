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
  Sparkles,
  Search,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import { useServices } from '@/core/ServiceProvider';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

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

  const getActivityIcon = (actionType: string) => {
    const iconClass = "h-4 w-4";
    switch (actionType) {
      case 'upload':
      case 'file_upload':
        return <Upload className={cn(iconClass, "text-blue-500")} />;
      case 'message':
      case 'comment':
        return <MessageSquare className={cn(iconClass, "text-emerald-500")} />;
      case 'share':
        return <Share2 className={cn(iconClass, "text-purple-500")} />;
      case 'invite':
        return <UserPlus className={cn(iconClass, "text-orange-500")} />;
      case 'experiment':
      case 'experiment_created':
        return <TestTube className={cn(iconClass, "text-rose-500")} />;
      case 'report':
      case 'report_generated':
        return <FileText className={cn(iconClass, "text-indigo-500")} />;
      case 'dataset':
      case 'dataset_uploaded':
        return <Database className={cn(iconClass, "text-cyan-500")} />;
      case 'insight':
      case 'insight_generated':
        return <Sparkles className={cn(iconClass, "text-amber-500")} />;
      case 'automation':
      case 'workflow_started':
        return <Zap className={cn(iconClass, "text-primary")} />;
      default:
        return <Activity className={cn(iconClass, "text-muted-foreground")} />;
    }
  };

  const getActivityColor = (actionType: string) => {
    switch (actionType) {
      case 'upload': return 'bg-blue-500/10 border-blue-500/20';
      case 'message': return 'bg-emerald-500/10 border-emerald-500/20';
      case 'experiment': return 'bg-rose-500/10 border-rose-500/20';
      case 'report': return 'bg-indigo-500/10 border-indigo-500/20';
      case 'dataset': return 'bg-cyan-500/10 border-cyan-500/20';
      case 'insight': return 'bg-amber-500/10 border-amber-500/20';
      case 'automation': return 'bg-primary/10 border-primary/20';
      default: return 'bg-muted/50 border-border/40';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'JUST NOW';
    if (minutes < 60) return `${minutes}M AGO`;
    if (hours < 24) return `${hours}H AGO`;
    return format(date, 'MMM d').toUpperCase();
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
    <div className="flex flex-col h-full bg-background/50 overflow-hidden">
      {/* Premium Header */}
      <div className="p-8 border-b bg-muted/5 backdrop-blur-xl space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Activity className="h-24 w-24 text-primary" />
        </div>

        <div className="relative">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
            <h2 className="text-2xl font-black tracking-tight uppercase">Intelligence Stream</h2>
          </div>
          <p className="text-[10px] font-black text-muted-foreground/60 tracking-[0.3em] uppercase ml-5">
            Real-time Workspace Audit Node
          </p>
        </div>

        {/* Filter Matrix */}
        <div className="flex gap-2 flex-wrap ml-5">
          {[
            { value: 'all', label: 'All Signals' },
            { value: 'datasets', label: 'Data Ingestion' },
            { value: 'experiments', label: 'Research Nodes' },
            { value: 'reports', label: 'Scientific Outputs' },
            { value: 'messages', label: 'Synapses' }
          ].map(tab => (
            <Badge
              key={tab.value}
              variant="outline"
              className={cn(
                "cursor-pointer transition-all h-8 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest border-border/40",
                filter === tab.value
                  ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-105'
                  : 'hover:bg-primary/5 hover:border-primary/20 bg-background/50'
              )}
              onClick={() => setFilter(tab.value as any)}
            >
              {tab.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Activity Feed */}
      <ScrollArea className="flex-1 bg-gradient-to-b from-muted/5 to-transparent">
        <div className="p-8 relative">
          <div className="absolute left-[59px] top-8 bottom-8 w-[1px] bg-border/40" />

          <AnimatePresence mode="popLayout">
            {loading ? (
              <div className="space-y-8">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex gap-6 animate-pulse ml-4">
                    <div className="h-10 w-10 bg-muted/40 rounded-xl" />
                    <div className="flex-1 space-y-3">
                      <div className="h-4 bg-muted/40 rounded-lg w-1/3" />
                      <div className="h-12 bg-muted/20 rounded-2xl w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredActivities.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-[500px] text-center"
              >
                <div className="h-20 w-20 rounded-3xl bg-muted/10 border border-border/40 flex items-center justify-center mb-6">
                  <Bell className="h-10 w-10 text-muted-foreground/30" />
                </div>
                <h3 className="font-black text-xl tracking-tight mb-2">Zero Signals Detected</h3>
                <p className="text-[13px] text-muted-foreground max-w-xs mx-auto font-medium">
                  This workspace current is dormant. Initiate research or engage with team members to generate activity logs.
                </p>
              </motion.div>
            ) : (
              <div className="space-y-8">
                {filteredActivities.map((activity, idx) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex gap-6 group relative"
                  >
                    {/* Timestamp Ribbon */}
                    <div className="w-14 shrink-0 pt-3 flex flex-col items-end">
                      <span className="text-[9px] font-black text-muted-foreground/40 text-right leading-none tracking-tighter">
                        {formatTime(activity.created_at)}
                      </span>
                    </div>

                    {/* Node Connector */}
                    <div className={cn(
                      "h-11 w-11 rounded-2xl flex items-center justify-center border-2 shrink-0 z-10 bg-background shadow-sm transition-transform group-hover:scale-110",
                      getActivityColor(activity.action_type)
                    )}>
                      {getActivityIcon(activity.action_type)}
                    </div>

                    {/* Content Block */}
                    <div className="flex-1 min-w-0 bg-background/40 hover:bg-background/80 border border-border/40 p-5 rounded-3xl transition-all group-hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)] group-hover:border-primary/20">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            {activity.user && (
                              <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-muted/20 border border-border/20">
                                <Avatar className="h-5 w-5 border border-background">
                                  <AvatarImage src={activity.user.avatar_url} />
                                  <AvatarFallback className="text-[8px] font-black">
                                    {activity.user.display_name.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-black text-[11px] tracking-tight text-foreground/80">{activity.user.display_name}</span>
                              </div>
                            )}
                            <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest bg-primary/5 text-primary border-primary/10">
                              {activity.action_type.replace('_', ' ')}
                            </Badge>
                          </div>

                          <p className="text-[14px] font-bold text-foreground/90 leading-snug tracking-tight">
                            {activity.description}
                          </p>
                        </div>

                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                            <ArrowUpRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Metadata Matrix */}
                      {activity.metadata && (
                        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/20">
                          {activity.metadata.resourceName && (
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-muted/30 border border-border/20">
                              <ShieldCheck className="h-3 w-3 text-emerald-500" />
                              <span className="text-[10px] font-black text-muted-foreground uppercase">{activity.metadata.resourceName}</span>
                            </div>
                          )}
                          {activity.metadata.channelName && (
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/5 border border-primary/10">
                              <Cpu className="h-3 w-3 text-primary/50" />
                              <span className="text-[10px] font-black text-primary uppercase">node: {activity.metadata.channelName}</span>
                            </div>
                          )}
                          {activity.metadata.tags && Array.isArray(activity.metadata.tags) && (
                            <div className="flex gap-1">
                              {activity.metadata.tags.slice(0, 2).map((tag: string, i: number) => (
                                <Badge key={i} variant="secondary" className="text-[9px] font-bold bg-muted/50 rounded-md">
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>

          {/* Load Limit Stream */}
          {activities.length >= 50 && (
            <div className="text-center py-12 border-t border-border/20 mt-8">
              <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">
                Significance Buffer Reached (Last 50 Events)
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

