import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Trophy,
    Medal,
    Award,
    TrendingUp,
    Flame,
    Zap,
    Loader2,
    Search
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useServices } from "@/core/ServiceProvider";
import { LeaderboardEntry } from "@/core/interfaces";

interface TeamLeaderboardProps {
    entries?: LeaderboardEntry[];
}

export const TeamLeaderboard = ({ entries: providedEntries }: TeamLeaderboardProps) => {
    const { collaboration } = useServices();
    const [timeRange, setTimeRange] = useState("monthly");
    const [searchQuery, setSearchQuery] = useState("");
    const [category, setCategory] = useState("overall");
    const [loading, setLoading] = useState(!providedEntries);
    const [entries, setEntries] = useState<LeaderboardEntry[]>(providedEntries || []);

    useEffect(() => {
        if (!providedEntries) {
            fetchLeaderboardData();
        }
    }, [timeRange, providedEntries]);

    const fetchLeaderboardData = async () => {
        try {
            setLoading(true);
            const data = await collaboration.getLeaderboard(timeRange);
            setEntries(data);
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            toast.error("Failed to load leaderboard data");
        } finally {
            setLoading(false);
        }
    };

    // Filter and Sort based on Category
    const filteredAndSortedEntries = useMemo(() => {
        let result = [...entries];

        // Search Filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(entry =>
                entry.name.toLowerCase().includes(query) ||
                entry.email.toLowerCase().includes(query)
            );
        }

        // Category Sort
        if (category !== 'overall') {
            result.sort((a, b) => {
                switch (category) {
                    case 'datasets': return b.stats.datasetsUploaded - a.stats.datasetsUploaded;
                    case 'experiments': return b.stats.experimentsCreated - a.stats.experimentsCreated;
                    case 'models': return b.stats.modelsTrained - a.stats.modelsTrained;
                    case 'engagement': return b.stats.commentsPosted - a.stats.commentsPosted;
                    default: return b.totalScore - a.totalScore;
                }
            });
            // Re-rank for view
            result = result.map((entry, index) => ({ ...entry, rank: index + 1 }));
        }

        return result;
    }, [entries, searchQuery, category]);


    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1: return <Trophy className="h-6 w-6 text-yellow-500 fill-yellow-500 drop-shadow-sm" />;
            case 2: return <Medal className="h-6 w-6 text-slate-400 fill-slate-400 drop-shadow-sm" />;
            case 3: return <Award className="h-6 w-6 text-amber-700 fill-amber-700 drop-shadow-sm" />;
            default: return <div className="h-6 w-6 flex items-center justify-center text-muted-foreground font-bold font-mono">#{rank}</div>;
        }
    };

    const getTrendIcon = (trend: 'up' | 'down' | 'same') => {
        if (trend === 'up') return <TrendingUp className="h-3 w-3 text-green-500" />;
        if (trend === 'down') return <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />;
        return <span className="h-3 w-3 text-muted-foreground flex items-center justify-center">-</span>;
    };

    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    return (
        <Card className="border-border/50 shadow-sm h-full flex flex-col">
            <CardHeader className="pb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <Trophy className="h-5 w-5 text-primary" />
                            Leaderboard
                        </CardTitle>
                        <CardDescription>
                            Track contribution and engagement
                        </CardDescription>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mt-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Find researcher..."
                            className="pl-9 h-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Tabs defaultValue="monthly" value={timeRange} onValueChange={setTimeRange} className="w-full sm:w-auto">
                        <TabsList className="w-full sm:w-auto grid grid-cols-3 h-9">
                            <TabsTrigger value="weekly" className="text-xs">Weekly</TabsTrigger>
                            <TabsTrigger value="monthly" className="text-xs">Monthly</TabsTrigger>
                            <TabsTrigger value="allTime" className="text-xs">All Time</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                    {['Overall', 'Datasets', 'Experiments', 'Models', 'Engagement'].map((cat) => (
                        <Button
                            key={cat}
                            variant={category.toLowerCase() === cat.toLowerCase() ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCategory(cat.toLowerCase())}
                            className="h-7 text-xs whitespace-nowrap"
                        >
                            {cat}
                        </Button>
                    ))}
                </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto max-h-[600px] pr-2">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredAndSortedEntries.length > 0 ? (
                            filteredAndSortedEntries.map((entry) => (
                                <div
                                    key={entry.id}
                                    className={`
                                        group relative p-4 rounded-xl border transition-all duration-200
                                        hover:shadow-md hover:scale-[1.01] hover:border-primary/40
                                        ${entry.rank === 1 ? 'bg-gradient-to-r from-yellow-500/10 via-yellow-500/5 to-transparent border-yellow-500/30' : ''}
                                        ${entry.rank === 2 ? 'bg-gradient-to-r from-slate-300/10 via-slate-300/5 to-transparent border-slate-300/30' : ''}
                                        ${entry.rank === 3 ? 'bg-gradient-to-r from-amber-700/10 via-amber-700/5 to-transparent border-amber-700/30' : ''}
                                        ${entry.rank > 3 ? 'bg-card border-border/60' : ''}
                                    `}
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Rank Section */}
                                        <div className="flex flex-col items-center justify-center min-w-[3rem] gap-1">
                                            {getRankIcon(entry.rank)}
                                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                                                {getTrendIcon(entry.trend)}
                                            </div>
                                        </div>

                                        {/* Avatar & Info */}
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="relative">
                                                <Avatar className={`h-12 w-12 border-2 ${entry.rank <= 3 ? 'border-background shadow-sm' : 'border-transparent'}`}>
                                                    <AvatarImage src={entry.avatar} />
                                                    <AvatarFallback className="font-semibold bg-primary/10 text-primary">
                                                        {getInitials(entry.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                {entry.rank === 1 && (
                                                    <div className="absolute -top-1 -right-1 bg-yellow-400 text-[10px] rounded-full w-5 h-5 flex items-center justify-center border-2 border-background shadow-sm">
                                                        👑
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-sm truncate text-foreground group-hover:text-primary transition-colors">
                                                        {entry.name}
                                                    </p>
                                                    {entry.badges?.map((badge, i) => (
                                                        <TooltipProvider key={i}>
                                                            <Tooltip>
                                                                <TooltipTrigger>
                                                                    <span className="text-xs cursor-help grayscale group-hover:grayscale-0 transition-all">{badge}</span>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Achievement Unlocked!</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    ))}
                                                </div>
                                                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Zap className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                                        {entry.streak} day streak
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Total Score */}
                                        <div className="text-right pl-2 border-l border-border/50 min-w-[80px]">
                                            <div className="text-2xl font-black text-foreground tracking-tight group-hover:text-primary transition-colors">
                                                {entry.totalScore.toLocaleString()}
                                            </div>
                                            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Points</p>
                                        </div>
                                    </div>

                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <Trophy className="h-12 w-12 mx-auto mb-4 text-muted" />
                                <h3 className="text-lg font-medium">No active researchers found</h3>
                                <p className="text-sm">Be the first to contribute!</p>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
