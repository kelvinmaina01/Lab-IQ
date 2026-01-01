/**
 * Overview Generation Loading - Agentic Text Flow Animation
 * Shows AI's thought process as a stream of consciousness without intrusive dialogs
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Sparkles, Brain, Database, LineChart, FileText } from 'lucide-react';

interface OverviewGenerationLoadingProps {
    dashboardCount: number;
    hasModels?: boolean;
    hasExperiments?: boolean;
}

export function OverviewGenerationLoading({
    dashboardCount,
    hasModels = false,
    hasExperiments = false
}: OverviewGenerationLoadingProps) {
    const [lines, setLines] = useState<string[]>([]);

    // The "script" the AI follows
    const script = [
        `Accessing dataset context...`,
        `Analyzing ${dashboardCount} pinned insights for correlations...`,
        `Detecting statistical anomalies in the data...`,
        hasModels ? `Evaluating model performance metrics...` : null,
        hasExperiments ? `Synthesizing experimental results...` : null,
        `Identifying key trends and outliers...`,
        `Drafting executive summary...`,
        `Structuring final data narrative...`,
        `Formatting report...`
    ].filter(Boolean) as string[];

    useEffect(() => {
        let currentIndex = 0;

        const interval = setInterval(() => {
            if (currentIndex < script.length) {
                setLines(prev => [...prev, script[currentIndex]]);
                currentIndex++;
            } else {
                clearInterval(interval);
            }
        }, 1200); // New line every 1.2 seconds

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
            <div className="max-w-3xl w-full px-8">
                <div className="space-y-6">
                    {/* Header Icon Pulse */}
                    <div className="flex justify-center mb-8">
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                            <div className="relative p-4 rounded-full bg-background border border-primary/20 shadow-xl">
                                <Sparkles className="h-8 w-8 text-primary animate-pulse" />
                            </div>
                        </div>
                    </div>

                    {/* Flowing Text Stream */}
                    <div className="font-mono space-y-3 text-center md:text-left min-h-[300px] flex flex-col justify-center items-center">
                        <AnimatePresence mode='popLayout'>
                            {lines.map((line, index) => {
                                const isLast = index === lines.length - 1;
                                return (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                                        animate={{
                                            opacity: isLast ? 1 : 0.4,
                                            y: 0,
                                            filter: 'blur(0px)',
                                            scale: isLast ? 1.05 : 1
                                        }}
                                        transition={{ duration: 0.5, ease: "easeOut" }}
                                        className={cn(
                                            "text-lg md:text-2xl font-medium tracking-tight",
                                            isLast ? "text-primary" : "text-muted-foreground"
                                        )}
                                    >
                                        {line}
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>

                        {/* Typing Cursor to show active work */}
                        {lines.length < script.length && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mt-2"
                            >
                                <span className="inline-block w-2 h-4 bg-primary/50 animate-pulse" />
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
