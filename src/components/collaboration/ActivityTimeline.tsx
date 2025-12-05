import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Activity,
    Upload,
    MessageSquare,
    FileText,
    UserPlus,
    GitBranch,
    CheckCircle,
    AlertCircle,
    Zap,
    GitCommit,
    Calendar
} from 'lucide-react';

interface TimelineEvent {
    id: string;
    type: 'upload' | 'comment' | 'share' | 'invite' | 'experiment' | 'success' | 'warning' | 'automation';
    user: string;
    userAvatar: string;
    action: string;
    target?: string;
    timestamp: string;
    metadata?: {
        size?: string;
        count?: number;
        status?: string;
    };
}

interface ActivityTimelineProps {
    events?: TimelineEvent[];
    maxHeight?: string;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
    events: customEvents,
    maxHeight = '600px'
}) => {
    const defaultEvents: TimelineEvent[] = [
        {
            id: '1',
            type: 'upload',
            user: 'Dr. Sarah Chen',
            userAvatar: '/placeholder.svg',
            action: 'uploaded',
            target: 'Protein Analysis Dataset v3.csv',
            timestamp: '5 minutes ago',
            metadata: { size: '2.4 MB' }
        },
        {
            id: '2',
            type: 'comment',
            user: 'John Smith',
            userAvatar: '/placeholder.svg',
            action: 'commented on',
            target: 'Chemical Screening Experiment',
            timestamp: '15 minutes ago',
            metadata: { count: 3 }
        },
        {
            id: '3',
            type: 'success',
            user: 'Emma Wilson',
            userAvatar: '/placeholder.svg',
            action: 'completed',
            target: 'ML Model Training #45',
            timestamp: '1 hour ago',
            metadata: { status: '94.2% accuracy' }
        },
        {
            id: '4',
            type: 'invite',
            user: 'Dr. Mike Ross',
            userAvatar: '/placeholder.svg',
            action: 'invited',
            target: 'Alex Turner to Climate Data Project',
            timestamp: '2 hours ago'
        },
        {
            id: '5',
            type: 'automation',
            user: 'System',
            userAvatar: '/placeholder.svg',
            action: 'triggered automation',
            target: 'Weekly Data Quality Check',
            timestamp: '3 hours ago',
            metadata: { status: 'Passed' }
        },
        {
            id: '6',
            type: 'share',
            user: 'Dr. Sarah Chen',
            userAvatar: '/placeholder.svg',
            action: 'shared',
            target: 'Monthly Research Report',
            timestamp: '5 hours ago'
        },
        {
            id: '7',
            type: 'experiment',
            user: 'John Smith',
            userAvatar: '/placeholder.svg',
            action: 'started',
            target: 'Compound Synthesis Trial #12',
            timestamp: '8 hours ago'
        },
        {
            id: '8',
            type: 'warning',
            user: 'System',
            userAvatar: '/placeholder.svg',
            action: 'detected anomaly in',
            target: 'Temperature Sensor Stream',
            timestamp: '1 day ago',
            metadata: { status: 'Resolved' }
        }
    ];

    const events = customEvents || defaultEvents;

    const getEventIcon = (type: string) => {
        switch (type) {
            case 'upload':
                return Upload;
            case 'comment':
                return MessageSquare;
            case 'share':
                return FileText;
            case 'invite':
                return UserPlus;
            case 'experiment':
                return GitBranch;
            case 'success':
                return CheckCircle;
            case 'warning':
                return AlertCircle;
            case 'automation':
                return Zap;
            default:
                return GitCommit;
        }
    };

    const getEventColor = (type: string) => {
        switch (type) {
            case 'upload':
                return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'comment':
                return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
            case 'share':
                return 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20';
            case 'invite':
                return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'experiment':
                return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
            case 'success':
                return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'warning':
                return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            case 'automation':
                return 'bg-violet-500/10 text-violet-500 border-violet-500/20';
            default:
                return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        }
    };

    return (
        <Card>
            <CardHeader className="border-b">
                <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    <CardTitle>Activity Timeline</CardTitle>
                    <Badge variant="secondary">Live</Badge>
                </div>
            </CardHeader>

            <CardContent className="p-6">
                <ScrollArea style={{ height: maxHeight }}>
                    <div className="relative">
                        {/* Vertical Timeline Line */}
                        <div className="absolute left-8 top-2 bottom-2 w-0.5 bg-border" />

                        <div className="space-y-6">
                            {events.map((event, index) => {
                                const EventIcon = getEventIcon(event.type);
                                const isSystem = event.user === 'System';

                                return (
                                    <div
                                        key={event.id}
                                        className="relative pl-16 animate-in fade-in-50 slide-in-from-left-3"
                                        style={{
                                            animationDelay: `${index * 50}ms`,
                                            animationFillMode: 'backwards'
                                        }}
                                    >
                                        {/* Timeline Node */}
                                        <div
                                            className={`absolute left-0 w-16 h-16 rounded-xl border-2 flex items-center justify-center ${getEventColor(event.type)}`}
                                        >
                                            <EventIcon className="w-6 h-6" />
                                        </div>

                                        {/* Event Content */}
                                        <div className="bg-muted/50 rounded-lg p-4 hover:bg-muted transition-colors">
                                            <div className="flex items-start justify-between gap-3 mb-2">
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    {!isSystem && (
                                                        <Avatar className="w-6 h-6">
                                                            <AvatarImage src={event.userAvatar} />
                                                            <AvatarFallback className="text-xs">
                                                                {event.user.split(' ').map(n => n[0]).join('')}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm">
                                                            <span className={`font-semibold ${isSystem ? 'text-primary' : ''}`}>
                                                                {event.user}
                                                            </span>
                                                            {' '}{event.action}{' '}
                                                            {event.target && (
                                                                <span className="font-medium text-foreground">
                                                                    {event.target}
                                                                </span>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0">
                                                    <Calendar className="w-3 h-3" />
                                                    {event.timestamp}
                                                </div>
                                            </div>

                                            {/* Metadata */}
                                            {event.metadata && (
                                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                                    {event.metadata.size && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {event.metadata.size}
                                                        </Badge>
                                                    )}
                                                    {event.metadata.count !== undefined && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {event.metadata.count} {event.metadata.count === 1 ? 'reply' : 'replies'}
                                                        </Badge>
                                                    )}
                                                    {event.metadata.status && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {event.metadata.status}
                                                        </Badge>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
};
