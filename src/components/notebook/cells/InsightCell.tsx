/**
 * Insight Cell Renderer
 * Displays pin-eligible interpreted findings with pin button
 */

import React, { useState } from 'react';
import { NotebookCell, InsightCellContent } from '@/lib/types/notebook';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Lightbulb, Pin, TrendingUp, AlertTriangle, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface InsightCellProps {
    cell: NotebookCell;
    isHighlighted?: boolean;
    userId: string;
    notebookId: string;
}

const tagIcons = {
    trend: TrendingUp,
    correlation: Target,
    outlier: AlertTriangle,
    risk: AlertTriangle,
    quality: Target,
};

export const InsightCell = React.forwardRef<HTMLDivElement, InsightCellProps>(
    ({ cell, isHighlighted, userId, notebookId }, ref) => {
        const content = cell.content as InsightCellContent;
        const [showPinDialog, setShowPinDialog] = useState(false);
        const [pinTitle, setPinTitle] = useState(content.pin_metadata.suggested_title);
        const [pinDescription, setPinDescription] = useState(content.pin_metadata.suggested_description);
        const [isPinning, setIsPinning] = useState(false);

        const { toast } = useToast();

        const handlePin = async () => {
            setIsPinning(true);
            try {
                await supabase.from('pinned_insights').insert({
                    user_id: userId,
                    notebook_id: notebookId,
                    cell_id: cell.cell_id,
                    title: pinTitle,
                    description: pinDescription,
                    insight_data: content,
                    tags: content.pin_metadata.pin_tags
                });

                toast({
                    title: 'Insight Pinned',
                    description: 'Added to your dashboard'
                });

                setShowPinDialog(false);
            } catch (error) {
                console.error('Failed to pin insight:', error);
                toast({
                    title: 'Pin Failed',
                    description: 'Could not pin insight',
                    variant: 'destructive'
                });
            } finally {
                setIsPinning(false);
            }
        };

        const confidenceColor = {
            high: 'text-green-600 bg-green-100 dark:bg-green-950',
            medium: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-950',
            low: 'text-orange-600 bg-orange-100 dark:bg-orange-950',
        }[content.confidence];

        return (
            <>
                <Card
                    ref={ref}
                    className={cn(
                        'p-6 border-l-4 border-l-amber-500',
                        cell.ui_hints?.emphasis === 'critical' && 'ring-2 ring-amber-500/50',
                        isHighlighted && 'ring-2 ring-amber-500 bg-amber-50/50 dark:bg-amber-950/20'
                    )}
                >
                    <div className="flex items-start gap-3">
                        <Lightbulb className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <div className="flex items-start justify-between gap-4">
                                <h3 className="font-semibold text-lg">{cell.title}</h3>
                                <div className="flex items-center gap-2">
                                    <Badge className={confidenceColor}>
                                        {content.confidence} confidence
                                    </Badge>
                                    {content.pin_metadata.pin_eligible && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setShowPinDialog(true)}
                                        >
                                            <Pin className="w-3 h-3 mr-1" />
                                            Pin
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Summary */}
                            <p className="mt-4 text-foreground leading-relaxed">
                                {content.summary}
                            </p>

                            {/* Key Evidence */}
                            {content.key_evidence.length > 0 && (
                                <div className="mt-4">
                                    <h4 className="text-sm font-semibold mb-2">Key Evidence</h4>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                        {content.key_evidence.map((evidence, idx) => (
                                            <li key={idx}>{evidence}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Notable Examples */}
                            {content.notable_examples.length > 0 && (
                                <div className="mt-4">
                                    <h4 className="text-sm font-semibold mb-2">Notable Examples</h4>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                        {content.notable_examples.map((example, idx) => (
                                            <li key={idx}>{example}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Implications */}
                            {content.implications.length > 0 && (
                                <div className="mt-4">
                                    <h4 className="text-sm font-semibold mb-2">Implications & Recommendations</h4>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                        {content.implications.map((implication, idx) => (
                                            <li key={idx}>{implication}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Tags */}
                            {content.pin_metadata.pin_tags.length > 0 && (
                                <div className="mt-4 flex gap-2">
                                    {content.pin_metadata.pin_tags.map((tag, idx) => {
                                        const Icon = tagIcons[tag];
                                        return (
                                            <Badge key={idx} variant="secondary" className="text-xs">
                                                {Icon && <Icon className="w-3 h-3 mr-1" />}
                                                {tag}
                                            </Badge>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Pin Dialog */}
                <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Pin Insight to Dashboard</DialogTitle>
                            <DialogDescription>
                                Customize the title and description for your dashboard
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="pin-title">Title</Label>
                                <Input
                                    id="pin-title"
                                    value={pinTitle}
                                    onChange={(e) => setPinTitle(e.target.value)}
                                    placeholder="Insight title"
                                />
                            </div>

                            <div>
                                <Label htmlFor="pin-description">Description</Label>
                                <Textarea
                                    id="pin-description"
                                    value={pinDescription}
                                    onChange={(e) => setPinDescription(e.target.value)}
                                    placeholder="Brief description"
                                    rows={3}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowPinDialog(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handlePin} disabled={isPinning || !pinTitle.trim()}>
                                {isPinning ? 'Pinning...' : 'Pin to Dashboard'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </>
        );
    }
);

InsightCell.displayName = 'InsightCell';
