/**
 * AI Thought Process Component
 * Julius AI-style collapsible sections showing:
 * - Thought process steps
 * - Challenges found
 * - Code explanations
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Settings2, AlertTriangle, Code2, Lightbulb, Copy, RefreshCcw, Pencil, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Highlight, themes } from "prism-react-renderer";
import { Button } from "@/components/ui/button";

interface CollapsibleSectionProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    defaultOpen?: boolean;
    variant?: 'default' | 'code' | 'challenge';
}

export function CollapsibleSection({
    title,
    icon,
    children,
    defaultOpen = false,
    variant = 'default'
}: CollapsibleSectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const bgColors = {
        default: 'bg-muted/30 hover:bg-muted/50 border border-transparent',
        code: 'bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30',
        challenge: 'bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30',
    };

    return (
        <div className="rounded-xl overflow-hidden transition-all duration-200">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    'w-full flex items-center justify-between px-4 py-3 transition-all duration-200',
                    bgColors[variant],
                    isOpen ? 'bg-opacity-100' : 'bg-opacity-60'
                )}
            >
                <div className="flex items-center gap-2 text-sm font-medium">
                    {icon}
                    <span>{title}</span>
                </div>
                <div className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown className="h-4 w-4 text-muted-foreground/70" />
                </div>
            </button>
            <div className={cn(
                "grid transition-all duration-200 ease-in-out",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            )}>
                <div className="overflow-hidden">
                    <div className="px-4 py-3 bg-background/50 backdrop-blur-sm border-t border-border/10">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}

interface ThoughtProcessProps {
    steps: string[];
}

export function ThoughtProcess({ steps }: ThoughtProcessProps) {
    return (
        <CollapsibleSection
            title="Thought process..."
            icon={<Settings2 className="h-4 w-4 text-muted-foreground" />}
            defaultOpen={true}
        >
            <ol className="space-y-2 text-sm text-muted-foreground">
                {steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2">
                        <span className="font-mono text-xs text-primary">{i + 1}.</span>
                        <span>{step}</span>
                    </li>
                ))}
            </ol>
        </CollapsibleSection>
    );
}

interface ChallengesProps {
    challenges: string[];
}

export function Challenges({ challenges }: ChallengesProps) {
    if (!challenges.length) return null;

    return (
        <CollapsibleSection
            title="Challenges"
            icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
            variant="challenge"
        >
            <ul className="space-y-2 text-sm text-muted-foreground">
                {challenges.map((challenge, i) => (
                    <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                        <span>{challenge}</span>
                    </li>
                ))}
            </ul>
        </CollapsibleSection>
    );
}

interface CodeExplanationProps {
    title: string;
    code?: string;
    language?: string;
    explanation: string;
    steps?: string[];
}

export function CodeExplanation({
    title,
    code,
    language = 'python',
    explanation,
    steps
}: CodeExplanationProps) {
    const [showMore, setShowMore] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (code) {
            navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="border rounded-xl overflow-hidden bg-card shadow-sm mb-4">
            {/* Pro Header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-muted/40 border-b">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        {/* Language Icon (Generic for now, or text based) */}
                        <Code2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                            {title || 'Analysis Code'}
                            <span className="px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                                {language}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" title="Regenerate Code">
                        <RefreshCcw className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" title="Edit Code">
                        <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <div className="w-px h-4 bg-border mx-1" />
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                        onClick={handleCopy}
                    >
                        {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                        {copied ? 'Copied' : 'Copy Code'}
                    </Button>
                </div>
            </div>

            {/* Code Block */}
            {code && (
                <div className="relative group">
                    <div className="text-sm overflow-x-auto bg-[#1e1e1e]">
                        <Highlight
                            theme={themes.vsDark}
                            code={code}
                            language={language}
                        >
                            {({ className, style, tokens, getLineProps, getTokenProps }) => (
                                <pre style={{ ...style, margin: 0 }} className="p-4 min-w-full font-mono text-[13px] leading-relaxed">
                                    {tokens.map((line, i) => (
                                        <div key={i} {...getLineProps({ line })} className="table-row">
                                            <span className="table-cell select-none text-gray-600 text-right pr-4 w-8 border-r border-gray-800/50 mr-4 block">{i + 1}</span>
                                            <span className="table-cell pl-4">
                                                {line.map((token, key) => (
                                                    <span key={key} {...getTokenProps({ token })} />
                                                ))}
                                            </span>
                                        </div>
                                    ))}
                                </pre>
                            )}
                        </Highlight>
                    </div>
                </div>
            )}

            {/* Explanation Footer */}
            <div className="p-5 bg-background border-t border-border/50">
                <div className="flex items-start gap-3">
                    <div className="mt-1">
                        <Lightbulb className="h-4 w-4 text-amber-500" />
                    </div>
                    <div className="space-y-3 flex-1">
                        <div>
                            <h4 className="font-medium text-sm text-foreground mb-1">Code Explanation</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">{explanation}</p>
                        </div>

                        {steps && steps.length > 0 && (
                            <div className="pt-2 border-t border-border/40">
                                <ul className={`space-y-2 text-sm text-muted-foreground ${!showMore && steps.length > 3 ? 'max-h-[80px] overflow-hidden' : ''}`}>
                                    {steps.map((step, i) => (
                                        <li key={i} className="flex items-start gap-2.5">
                                            <span className="h-1.5 w-1.5 rounded-full bg-primary/60 mt-2 shrink-0" />
                                            <span>{step}</span>
                                        </li>
                                    ))}
                                </ul>
                                {steps.length > 3 && (
                                    <button
                                        onClick={() => setShowMore(!showMore)}
                                        className="mt-2 text-xs font-medium text-primary hover:underline flex items-center gap-1"
                                    >
                                        {showMore ? (
                                            <>Show Less <ChevronUp className="h-3 w-3" /></>
                                        ) : (
                                            <>Show More Steps <ChevronDown className="h-3 w-3" /></>
                                        )}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

interface InsightBlockProps {
    title: string;
    icon?: React.ReactNode;
    content: string;
    bulletPoints?: string[];
}

export function InsightBlock({ title, icon, content, bulletPoints }: InsightBlockProps) {
    return (
        <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
                {icon || <Lightbulb className="h-4 w-4 text-primary" />}
                {title}
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{content}</p>
            {bulletPoints && bulletPoints.length > 0 && (
                <ul className="space-y-1.5">
                    {bulletPoints.map((point, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                            <span className="text-muted-foreground">{point}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default {
    CollapsibleSection,
    ThoughtProcess,
    Challenges,
    CodeExplanation,
    InsightBlock
};
