/**
 * PinToDashboardButton - Reusable component for pinning content to dashboards
 * Drop this component into any page to enable dashboard pinning
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Pin, Check, Loader2, Sparkles } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    dashboardService,
    DashboardType,
    DashboardSource,
    DashboardData,
    DashboardConfig
} from '@/lib/services/dashboardService';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface PinToDashboardButtonProps {
    /** Title for the pinned dashboard item */
    title: string;
    /** Description (optional) */
    description?: string;
    /** Type of dashboard content */
    type: DashboardType;
    /** Source indicating where the pin came from */
    source: DashboardSource;
    /** The data to display (charts, metrics, tables, etc.) */
    data: DashboardData;
    /** Optional configuration for charts */
    config?: DashboardConfig;
    /** ID of the source item (experiment ID, workflow ID, etc.) */
    sourceId?: string;
    /** Table name of the source */
    sourceTable?: string;
    /** Category for organization */
    category?: string;
    /** Tags for filtering */
    tags?: string[];
    /** Callback when successfully pinned */
    onPinned?: () => void;
    /** Button variant */
    variant?: 'default' | 'ghost' | 'outline' | 'secondary';
    /** Button size */
    size?: 'default' | 'sm' | 'icon';
    /** Additional class names */
    className?: string;
    /** Show text label or just icon */
    showLabel?: boolean;
    /** If true, already pinned state */
    isPinned?: boolean;
}

export function PinToDashboardButton({
    title: initialTitle,
    description: initialDescription,
    type,
    source,
    data,
    config,
    sourceId,
    sourceTable,
    category = 'general',
    tags = [],
    onPinned,
    variant = 'ghost',
    size = 'sm',
    className,
    showLabel = true,
    isPinned: externalIsPinned
}: PinToDashboardButtonProps) {
    const [isPinning, setIsPinning] = useState(false);
    const [isPinned, setIsPinned] = useState(externalIsPinned ?? false);
    const { toast } = useToast();

    // Dialog State
    const [isOpen, setIsOpen] = useState(false);
    const [title, setTitle] = useState(initialTitle);
    const [description, setDescription] = useState(initialDescription || '');
    const [suggestedTags, setSuggestedTags] = useState(tags);

    const handlePin = async () => {
        setIsPinning(true);

        try {
            const result = await dashboardService.createDashboard({
                title,
                description,
                type,
                source,
                config,
                data,
                source_id: sourceId,
                source_table: sourceTable,
                category,
                tags: [...suggestedTags, `source:${source}`]
            });

            if (result) {
                setIsPinned(true);
                setIsOpen(false);
                toast({
                    title: "Pinned to Dashboard",
                    description: "View it in your Dashboards page",
                });
                onPinned?.();
            } else {
                throw new Error('Failed to create dashboard');
            }
        } catch (error) {
            console.error('Pin error:', error);
            toast({
                title: "Pin Failed",
                description: "Could not pin to dashboard. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsPinning(false);
        }
    };

    const handleAISuggest = () => {
        // Placeholder for AI suggestion
        // In a real implementation this would call an AI service to summarize
        const suggestions = ["Analysis", "Insight", "Key Finding"];
        setTitle(`${title} (${suggestions[Math.floor(Math.random() * suggestions.length)]})`);
        toast({
            title: "AI Suggestion",
            description: "Title updated with suggestion",
        });
    };

    // If already pinned, just show the pinned state button
    if (isPinned) {
        return (
            <Button
                variant={variant}
                size={size}
                className={cn(
                    "gap-1.5 text-green-600 hover:text-green-700",
                    className
                )}
                disabled={true}
            >
                <Check className="h-3.5 w-3.5" />
                {showLabel && <span className="text-xs">Pinned</span>}
            </Button>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant={variant}
                    size={size}
                    className={cn(
                        "gap-1.5 transition-colors text-muted-foreground hover:text-primary",
                        className
                    )}
                >
                    <Pin className="h-3.5 w-3.5" />
                    {showLabel && <span className="text-xs">Pin to Dashboard</span>}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Pin to Dashboard</DialogTitle>
                    <DialogDescription>
                        Customize how this item appears on your dashboard.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Title</Label>
                        <div className="flex gap-2">
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="col-span-3"
                            />
                            <Button variant="outline" size="icon" onClick={handleAISuggest} title="AI Suggest">
                                <Sparkles className="h-4 w-4 text-purple-500" />
                            </Button>
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add context or notes..."
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handlePin} disabled={isPinning}>
                        {isPinning ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Pinning...
                            </>
                        ) : (
                            'Pin to Dashboard'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default PinToDashboardButton;
