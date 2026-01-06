/**
 * Pin Insight Dialog
 * Allows users to capture and save insights from notebook cells
 */

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { InsightCellContent, PinTag } from '@/lib/types/notebook';
import { Pin, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PinInsightDialogProps {
    open: boolean;
    onClose: () => void;
    insightContent: InsightCellContent;
    cellId: string;
    notebookId: string;
    userId: string;
}

const PIN_TAGS: { value: PinTag; label: string; color: string }[] = [
    { value: 'trend', label: 'Trend', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400' },
    { value: 'correlation', label: 'Correlation', color: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400' },
    { value: 'outlier', label: 'Outlier', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' },
    { value: 'risk', label: 'Risk', color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' },
    { value: 'quality', label: 'Quality', color: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' }
];

export const PinInsightDialog: React.FC<PinInsightDialogProps> = ({
    open,
    onClose,
    insightContent,
    cellId,
    notebookId,
    userId
}) => {
    const [title, setTitle] = useState(insightContent.pin_metadata?.suggested_title || '');
    const [description, setDescription] = useState(insightContent.pin_metadata?.suggested_description || '');
    const [selectedTags, setSelectedTags] = useState<PinTag[]>(insightContent.pin_metadata?.pin_tags || []);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    const handleToggleTag = (tag: PinTag) => {
        setSelectedTags(prev =>
            prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    };

    const handleSavePin = async () => {
        if (!title.trim() || !description.trim()) {
            toast({
                title: 'Validation Error',
                description: 'Please provide both title and description',
                variant: 'destructive'
            });
            return;
        }

        setSaving(true);
        try {
            const { error } = await supabase
                .from('pinned_insights')
                .insert({
                    user_id: userId,
                    notebook_id: notebookId,
                    cell_id: cellId,
                    title: title.trim(),
                    description: description.trim(),
                    insight_data: insightContent,
                    tags: selectedTags
                });

            if (error) throw error;

            toast({
                title: 'Insight Pinned',
                description: 'Successfully saved to your dashboard'
            });
            onClose();
        } catch (error) {
            console.error('Failed to pin insight:', error);
            toast({
                title: 'Pin Failed',
                description: error instanceof Error ? error.message : 'Unknown error',
                variant: 'destructive'
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Pin className="w-5 h-5" />
                        Pin Insight to Dashboard
                    </DialogTitle>
                    <DialogDescription>
                        Customize and save this insight for quick access in your dashboard
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Title Input */}
                    <div className="space-y-2">
                        <Label htmlFor="pin-title">Title</Label>
                        <Input
                            id="pin-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter a descriptive title..."
                            maxLength={200}
                        />
                        <p className="text-xs text-muted-foreground">
                            {title.length}/200 characters
                        </p>
                    </div>

                    {/* Description Input */}
                    <div className="space-y-2">
                        <Label htmlFor="pin-description">Description</Label>
                        <Textarea
                            id="pin-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Provide context and key takeaways..."
                            rows={4}
                            maxLength={1000}
                        />
                        <p className="text-xs text-muted-foreground">
                            {description.length}/1000 characters
                        </p>
                    </div>

                    {/* Tag Selection */}
                    <div className="space-y-2">
                        <Label>Tags</Label>
                        <div className="flex flex-wrap gap-2">
                            {PIN_TAGS.map(tag => (
                                <Badge
                                    key={tag.value}
                                    variant={selectedTags.includes(tag.value) ? 'default' : 'outline'}
                                    className={cn(
                                        'cursor-pointer transition-all',
                                        selectedTags.includes(tag.value) && tag.color
                                    )}
                                    onClick={() => handleToggleTag(tag.value)}
                                >
                                    {selectedTags.includes(tag.value) && (
                                        <Check className="w-3 h-3 mr-1" />
                                    )}
                                    {tag.label}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* Evidence Preview */}
                    <div className="space-y-2 border-t pt-4">
                        <Label>Key Evidence</Label>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                            {insightContent.key_evidence.slice(0, 3).map((evidence, idx) => (
                                <li key={idx}>{evidence}</li>
                            ))}
                            {insightContent.key_evidence.length > 3 && (
                                <li className="italic">+{insightContent.key_evidence.length - 3} more...</li>
                            )}
                        </ul>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={saving}>
                        Cancel
                    </Button>
                    <Button onClick={handleSavePin} disabled={saving}>
                        {saving ? 'Saving...' : 'Pin to Dashboard'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
