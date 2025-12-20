import React from "react";
import {
    MessageSquare,
    Hash,
    Headphones,
    FileEdit,
    ClipboardList,
    Zap,
    UserPlus,
    Plus,
    SquarePen
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface UnifiedCreateMenuProps {
    onAction: (action: string) => void;
    className?: string;
    trigger?: React.ReactNode;
}

export const UnifiedCreateMenu = ({ onAction, className, trigger }: UnifiedCreateMenuProps) => {
    const items = [
        {
            id: 'message',
            label: 'Message',
            description: 'Start a conversation in a DM or channel',
            icon: <SquarePen className="h-4 w-4" />,
            color: 'text-purple-500',
            bg: 'bg-purple-500/10'
        },
        {
            id: 'channel',
            label: 'Channel',
            description: 'Start a group conversation by topic',
            icon: <Hash className="h-4 w-4" />,
            color: 'text-slate-500',
            bg: 'bg-slate-500/10'
        },
        {
            id: 'huddle',
            label: 'Huddle',
            description: 'Start a video or audio chat',
            icon: <Headphones className="h-4 w-4" />,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10'
        },
        {
            id: 'canvas',
            label: 'Canvas',
            description: 'Create and share content',
            icon: <FileEdit className="h-4 w-4" />,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            pro: true
        },
        {
            id: 'list',
            label: 'List',
            description: 'Track and manage projects',
            icon: <ClipboardList className="h-4 w-4" />,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10',
            pro: true
        },
        {
            id: 'workflow',
            label: 'Workflow',
            description: 'Automate everyday tasks',
            icon: <Zap className="h-4 w-4" />,
            color: 'text-rose-500',
            bg: 'bg-rose-500/10'
        }
    ];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="icon" className={cn("h-8 w-8 rounded-full", className)}>
                        <Plus className="h-4 w-4" />
                    </Button>
                )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[300px] p-2 shadow-2xl border-primary/20 bg-background/95 backdrop-blur-md">
                <div className="px-2 py-1.5 mb-2">
                    <h2 className="font-bold text-lg">Create</h2>
                </div>

                <div className="space-y-1">
                    {items.map((item) => (
                        <DropdownMenuItem
                            key={item.id}
                            className="flex items-center gap-3 p-2 cursor-pointer focus:bg-muted/50 rounded-lg group"
                            onClick={() => onAction(item.id)}
                        >
                            <div className={cn("h-9 w-9 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-110", item.bg, item.color)}>
                                {item.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-sm">{item.label}</span>
                                    {item.pro && (
                                        <Badge variant="secondary" className="h-4 px-1 text-[8px] font-black uppercase tracking-widest bg-purple-500/20 text-purple-600 border-none">
                                            Pro
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-[11px] text-muted-foreground truncate leading-snug">
                                    {item.description}
                                </p>
                            </div>
                        </DropdownMenuItem>
                    ))}
                </div>

                <DropdownMenuSeparator className="my-2" />

                <DropdownMenuItem
                    className="flex items-center gap-3 p-2 cursor-pointer focus:bg-muted/50 rounded-lg group"
                    onClick={() => onAction('invite')}
                >
                    <div className="h-9 w-9 rounded-full flex items-center justify-center shrink-0 bg-slate-100 text-slate-600 group-hover:bg-slate-200 transition-colors">
                        <UserPlus className="h-4 w-4" />
                    </div>
                    <span className="font-semibold text-sm flex-1">Invite people</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
