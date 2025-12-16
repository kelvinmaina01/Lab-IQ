import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Activity,
    MessageSquare,
    FlaskConical,
    Upload,
    UserPlus,
    CheckCircle2,
    AlertCircle,
    Bot
} from "lucide-react";
import { useServices } from "@/core/ServiceProvider";
import { ActivityItem } from "@/core/interfaces";

export const ActivityTimeline = () => {
    const { collaboration } = useServices();
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchActivities();
    }, []);

    const fetchActivities = async () => {
        setLoading(true);
        try {
            // Hardcoded labId for consistency with Collaboration.tsx
            // Ideally should be dynamic based on current lab
            const labId = '00000000-0000-0000-0000-000000000001';
            const { data } = await collaboration.getActivities(labId);
            if (data) setActivities(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getActivityIcon = (type: ActivityItem['type']) => {
        switch (type) {
            case 'upload': return <Upload className="h-4 w-4 text-blue-500" />;
            case 'comment': return <MessageSquare className="h-4 w-4 text-green-500" />;
            case 'experiment': return <FlaskConical className="h-4 w-4 text-purple-500" />;
            case 'invite': return <UserPlus className="h-4 w-4 text-orange-500" />;
            case 'success': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
            case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
            case 'automation': return <Bot className="h-4 w-4 text-pink-500" />;
            default: return <Activity className="h-4 w-4 text-gray-500" />;
        }
    };

    const getActionColor = (type: ActivityItem['type']) => {
        switch (type) {
            case 'upload': return 'text-blue-500';
            case 'comment': return 'text-green-500';
            case 'experiment': return 'text-purple-500';
            case 'invite': return 'text-orange-500';
            case 'automation': return 'text-pink-500';
            default: return 'text-foreground';
        }
    };

    if (loading && activities.length === 0) {
        return <div className="p-8 text-center text-muted-foreground">Loading activity...</div>;
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Activity Feed
                </h3>
                <Badge variant="outline">{activities.length} recent</Badge>
            </div>

            <ScrollArea className="flex-1 pr-4">
                <div className="relative border-l border-border ml-4 space-y-8">
                    {activities.length === 0 ? (
                        <div className="ml-6 text-muted-foreground text-sm">No recent activity</div>
                    ) : (
                        activities.map((item) => (
                            <div key={item.id} className="relative ml-6">
                                {/* Timeline Dot */}
                                <div className="absolute -left-[31px] top-1 h-2.5 w-2.5 rounded-full border border-primary bg-background ring-4 ring-background" />

                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src={item.userAvatar} />
                                                    <AvatarFallback className="text-[10px]">
                                                        {item.user.substring(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-sm font-medium">{item.user}</span>
                                            </div>
                                            <span className="text-sm text-muted-foreground">
                                                <span className={getActionColor(item.type)}>{item.action}</span>
                                                {' '}
                                                {item.target && <span className="font-medium text-foreground">{item.target}</span>}
                                            </span>
                                        </div>
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                            {item.timestamp}
                                        </span>
                                    </div>

                                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 text-sm">
                                        <div className="mt-0.5 p-1.5 rounded-md bg-background shadow-sm">
                                            {getActivityIcon(item.type)}
                                        </div>
                                        <div className="flex-1">
                                            {/* Placeholder description based on type - could come from metadata later */}
                                            <p className="text-muted-foreground text-xs">
                                                {item.type === 'comment' ? 'Posted a new comment' :
                                                    item.type === 'upload' ? 'Uploaded a new file' :
                                                        'Activity logged'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    );
};
