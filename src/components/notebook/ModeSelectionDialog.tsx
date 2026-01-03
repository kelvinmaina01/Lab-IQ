/**
 * Mode Selection Dialog
 * Shows when user clicks "Analyze with AI" button
 */

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageSquare, BookOpen, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface ModeSelectionDialogProps {
    open: boolean;
    onClose: () => void;
    onSelectMode: (mode: 'chat' | 'notebook') => void;
}

export const ModeSelectionDialog: React.FC<ModeSelectionDialogProps> = ({
    open,
    onClose,
    onSelectMode
}) => {
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Choose Analysis Mode</DialogTitle>
                    <DialogDescription>
                        Select how you'd like to interact with the AI assistant
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                    {/* Chat Mode */}
                    <Card
                        className="p-6 cursor-pointer hover:border-primary transition-colors"
                        onClick={() => onSelectMode('chat')}
                    >
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-100 dark:bg-blue-950 rounded-lg">
                                    <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="font-semibold text-lg">Chat Mode</h3>
                            </div>

                            <p className="text-sm text-muted-foreground">
                                Conversational AI assistant with real-time responses. Best for quick questions and exploratory analysis.
                            </p>

                            <ul className="text-xs text-muted-foreground space-y-1">
                                <li>✓ Quick Q&A format</li>
                                <li>✓ Iterative exploration</li>
                                <li>✓ Familiar chat interface</li>
                            </ul>

                            <Button className="w-full mt-4">
                                Start Chat
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </Card>

                    {/* Notebook Mode */}
                    <Card
                        className="p-6 cursor-pointer hover:border-primary transition-colors border-2"
                        onClick={() => onSelectMode('notebook')}
                    >
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-purple-100 dark:bg-purple-950 rounded-lg">
                                    <BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <h3 className="font-semibold text-lg">Notebook Mode</h3>
                            </div>

                            <p className="text-sm text-muted-foreground">
                                Structured analytical notebook with reasoning, metrics, visualizations, and insights. Best for comprehensive analysis.
                            </p>

                            <ul className="text-xs text-muted-foreground space-y-1">
                                <li>✓ Structured analysis cells</li>
                                <li>✓ Reproducible insights</li>
                                <li>✓ Pin to dashboard</li>
                            </ul>

                            <Button className="w-full mt-4" variant="default">
                                Start Notebook
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </Card>
                </div>

                <div className="text-xs text-center text-muted-foreground">
                    You can switch modes anytime from the Insights page
                </div>
            </DialogContent>
        </Dialog>
    );
};
