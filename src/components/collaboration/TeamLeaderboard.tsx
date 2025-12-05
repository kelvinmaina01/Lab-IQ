import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, TrendingUp, Database, FlaskConical, Brain, MessageSquare, FileText } from "lucide-react";

interface LeaderboardEntry {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    stats: {
        datasetsUploaded: number;
        experimentsCreated: number;
        modelsTrained: number;
        commentsPosted: number;
        filesShared: number;
    };
    totalScore: number;
    rank: number;
    trend: 'up' | 'down' | 'same';
}

interface TeamLeaderboardProps {
    entries?: LeaderboardEntry[];
}

export const TeamLeaderboard = ({ entries: providedEntries }: TeamLeaderboardProps) => {
    // Mock data for demonstration - replace with real data from Supabase
    const mockEntries: LeaderboardEntry[] = providedEntries || [
        {
            id: '1',
            name: 'Sarah Chen',
            email: 'sarah@lab.com',
            stats: {
                datasetsUploaded: 24,
                experimentsCreated: 18,
                modelsTrained: 12,
                commentsPosted: 45,
                filesShared: 8
            },
            totalScore: 107,
            rank: 1,
            trend: 'up'
        },
        {
            id: '2',
            name: 'Marcus Johnson',
            email: 'marcus@lab.com',
            stats: {
                datasetsUploaded: 18,
                experimentsCreated: 22,
                modelsTrained: 15,
                commentsPosted: 32,
                filesShared: 6
            },
            totalScore: 93,
            rank: 2,
            trend: 'up'
        },
        {
            id: '3',
            name: 'Emily Rodriguez',
            email: 'emily@lab.com',
            stats: {
                datasetsUploaded: 16,
                experimentsCreated: 14,
                modelsTrained: 10,
                commentsPosted: 38,
                filesShared: 12
            },
            totalScore: 90,
            rank: 3,
            trend: 'same'
        },
        {
            id: '4',
            name: 'David Kim',
            email: 'david@lab.com',
            stats: {
                datasetsUploaded: 12,
                experimentsCreated: 16,
                modelsTrained: 8,
                commentsPosted: 28,
                filesShared: 5
            },
            totalScore: 69,
            rank: 4,
            trend: 'down'
        },
        {
            id: '5',
            name: 'Lisa Wang',
            email: 'lisa@lab.com',
            stats: {
                datasetsUploaded: 10,
                experimentsCreated: 12,
                modelsTrained: 7,
                commentsPosted: 24,
                filesShared: 4
            },
            totalScore: 57,
            rank: 5,
            trend: 'up'
        }
    ];

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Trophy className="h-6 w-6 text-yellow-500" />;
            case 2:
                return <Medal className="h-6 w-6 text-gray-400" />;
            case 3:
                return <Award className="h-6 w-6 text-orange-600" />;
            default:
                return <div className="h-6 w-6 flex items-center justify-center text-muted-foreground font-bold">#{rank}</div>;
        }
    };

    const getRankBadge = (rank: number) => {
        switch (rank) {
            case 1:
                return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">🥇 Champion</Badge>;
            case 2:
                return <Badge className="bg-gray-400/10 text-gray-600 border-gray-400/20">🥈 Runner-up</Badge>;
            case 3:
                return <Badge className="bg-orange-600/10 text-orange-600 border-orange-600/20">🥉 Third Place</Badge>;
            default:
                return null;
        }
    };

    const getTrendIcon = (trend: 'up' | 'down' | 'same') => {
        if (trend === 'up') return <TrendingUp className="h-3 w-3 text-green-500" />;
        if (trend === 'down') return <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />;
        return <span className="h-3 w-3 text-muted-foreground">-</span>;
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase();
    };

    return (
        <Card className="border-border/50">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-primary" />
                            Team Leaderboard
                        </CardTitle>
                        <CardDescription>
                            Top contributors this month • Rankings update daily
                        </CardDescription>
                    </div>
                    <Badge variant="outline" className="gap-1">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        Live
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {mockEntries.map((entry, idx) => (
                        <div
                            key={entry.id}
                            className={`
                p-4 rounded-lg border transition-all
                ${entry.rank <= 3
                                    ? 'bg-gradient-to-r from-primary/5 to-transparent border-primary/20'
                                    : 'bg-card border-border hover:border-primary/30'
                                }
              `}
                        >
                            {/* Main Row */}
                            <div className="flex items-center gap-4">
                                {/* Rank */}
                                <div className="flex items-center gap-2 min-w-[60px]">
                                    {getRankIcon(entry.rank)}
                                    {getTrendIcon(entry.trend)}
                                </div>

                                {/* Avatar & Name */}
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={entry.avatar} />
                                        <AvatarFallback className={entry.rank <= 3 ? 'bg-primary/20 text-primary' : ''}>
                                            {getInitials(entry.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold text-sm truncate">{entry.name}</p>
                                            {getRankBadge(entry.rank)}
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate">{entry.email}</p>
                                    </div>
                                </div>

                                {/* Score */}
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-primary">{entry.totalScore}</div>
                                    <p className="text-xs text-muted-foreground">points</p>
                                </div>
                            </div>

                            {/* Stats Row */}
                            <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-5 gap-2">
                                <div className="text-center">
                                    <div className="flex items-center justify-center mb-1">
                                        <Database className="h-3 w-3 text-blue-500" />
                                    </div>
                                    <div className="text-sm font-semibold">{entry.stats.datasetsUploaded}</div>
                                    <div className="text-[10px] text-muted-foreground">Datasets</div>
                                </div>
                                <div className="text-center">
                                    <div className="flex items-center justify-center mb-1">
                                        <FlaskConical className="h-3 w-3 text-purple-500" />
                                    </div>
                                    <div className="text-sm font-semibold">{entry.stats.experimentsCreated}</div>
                                    <div className="text-[10px] text-muted-foreground">Experiments</div>
                                </div>
                                <div className="text-center">
                                    <div className="flex items-center justify-center mb-1">
                                        <Brain className="h-3 w-3 text-green-500" />
                                    </div>
                                    <div className="text-sm font-semibold">{entry.stats.modelsTrained}</div>
                                    <div className="text-[10px] text-muted-foreground">Models</div>
                                </div>
                                <div className="text-center">
                                    <div className="flex items-center justify-center mb-1">
                                        <MessageSquare className="h-3 w-3 text-orange-500" />
                                    </div>
                                    <div className="text-sm font-semibold">{entry.stats.commentsPosted}</div>
                                    <div className="text-[10px] text-muted-foreground">Comments</div>
                                </div>
                                <div className="text-center">
                                    <div className="flex items-center justify-center mb-1">
                                        <FileText className="h-3 w-3 text-pink-500" />
                                    </div>
                                    <div className="text-sm font-semibold">{entry.stats.filesShared}</div>
                                    <div className="text-[10px] text-muted-foreground">Files</div>
                                </div>
                            </div>

                            {/* Top 3 Highlight */}
                            {entry.rank === 1 && (
                                <div className="mt-3 pt-3 border-t border-primary/20">
                                    <p className="text-xs text-center text-primary font-medium">
                                        🎉 Top Contributor • Keep up the amazing work!
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="mt-4 p-3 rounded-lg bg-muted/50 text-center">
                    <p className="text-xs text-muted-foreground">
                        💡 <strong>Pro Tip:</strong> Upload datasets, create experiments, and engage with the team to climb the leaderboard!
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};
