/**
 * PinToDashboardButton - Reusable component for pinning content to dashboards
 * Drop this component into any page to enable dashboard pinning
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Pin, Check, Loader2 } from 'lucide-react';
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
    title,
    description,
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

    const handlePin = async (e: React.MouseEvent) => {
        e.stopPropagation();

        if (isPinned) {
            toast({
                title: "Already Pinned",
                description: "This item is already on your dashboard",
            });
            return;
        }

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
                tags: [...tags, `source:${source}`]
            });

            if (result) {
                setIsPinned(true);
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

    return (
        <Button
            variant={variant}
            size={size}
            className={cn(
                "gap-1.5 transition-colors",
                isPinned ? "text-green-600 hover:text-green-700" : "text-muted-foreground hover:text-primary",
                className
            )}
            onClick={handlePin}
            disabled={isPinning || isPinned}
        >
            {isPinning ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : isPinned ? (
                <Check className="h-3.5 w-3.5" />
            ) : (
                <Pin className="h-3.5 w-3.5" />
            )}
            {showLabel && (
                <span className="text-xs">
                    {isPinned ? 'Pinned' : isPinning ? 'Pinning...' : 'Pin to Dashboard'}
                </span>
            )}
        </Button>
    );
}

export default PinToDashboardButton;
