/**
 * AI Thought Process Component
 * Julius AI-style collapsible sections showing:
 * - Thought process steps
 * - Challenges found
 * - Code explanations
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Settings2, AlertTriangle, Code2, Lightbulb, Copy, RefreshCcw, Pencil, Check, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Highlight, themes } from "prism-react-renderer";
import { Button } from "@/components/ui/button";
import { CodeSandboxStatus } from '@/components/assistant/CodeSandboxStatus';


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
        <div className="mb-4 group">
            <CodeSandboxStatus />

            <div className="border border-[#2b2b2b] rounded-xl overflow-hidden bg-[#1e1e1e] shadow-lg">
                {/* VS Code Style Header */}
                <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#1e1e1e]">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            {/* VS Code Python Icon color */}
                            <Code2 className="h-4 w-4 text-[#3776ab]" />
                            <span className="text-sm font-medium text-[#cccccc] font-mono">
                                {title || 'script.py'}
                            </span>
                        </div>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#37373d] text-[#cccccc] boarder border-[#454545] font-mono">
                            {language}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* VS Code Action Buttons */}
                        <div className="flex items-center bg-[#2d2d2d] rounded-md border border-[#3e3e42] p-0.5">
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-[#858585] hover:text-white hover:bg-[#3e3e42] rounded-sm" title="Run Code">
                                <Activity className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-[#858585] hover:text-white hover:bg-[#3e3e42] rounded-sm" title="Copy">
                                <Copy className="h-3.5 w-3.5" onClick={handleCopy} />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Code Block */}
                {code && (
                    <div className="relative group bg-[#1e1e1e] border-l border-r border-[#2b2b2b] pb-2">
                        <div className="text-sm overflow-x-auto">
                            <Highlight
                                theme={themes.vsDark}
                                code={code}
                                language={language}
                            >
                                {({ className, style, tokens, getLineProps, getTokenProps }) => (
                                    <pre style={{ ...style, margin: 0, backgroundColor: '#1e1e1e', color: '#e1e1e1' }} className="p-4 min-w-full font-mono text-[13px] leading-relaxed">
                                        {tokens.map((line, i) => (
                                            <div key={i} {...getLineProps({ line })} className="table-row">
                                                <span className="table-cell select-none text-[#6e7681] text-right pr-4 w-8 mr-4 block border-r border-[#404040]">{i + 1}</span>
                                                <span className="table-cell pl-4 text-[#e1e1e1]">
                                                    {line.map((token, key) => (
                                                        <span key={key} {...getTokenProps({ token })} style={{ color: getTokenProps({ token }).style?.color || '#e1e1e1' }} />
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

                {/* Explanation Footer - Dark Mode */}
                <div className="px-5 py-4 bg-[#1e1e1e] border-t border-[#2b2b2b]">
                    <div className="flex items-start gap-3">
                        <div className="mt-1">
                            <Lightbulb className="h-4 w-4 text-amber-500" />
                        </div>
                        <div className="space-y-3 flex-1">
                            <div>
                                <h4 className="font-medium text-sm text-[#e1e4e8] mb-1">Code Explanation</h4>
                                <p className="text-sm text-[#abb2bf] leading-relaxed">{explanation}</p>
                            </div>

                            {steps && steps.length > 0 && (
                                <div className="pt-3 border-t border-[#2b2b2b]">
                                    <ul className={`space-y-2 text-sm text-[#abb2bf] ${!showMore && steps.length > 3 ? 'max-h-[80px] overflow-hidden' : ''}`}>
                                        {steps.map((step, i) => (
                                            <li key={i} className="flex items-start gap-2.5">
                                                <span className="h-1.5 w-1.5 rounded-full bg-blue-500/60 mt-2 shrink-0" />
                                                <span>{step}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    {steps.length > 3 && (
                                        <button
                                            onClick={() => setShowMore(!showMore)}
                                            className="mt-2 text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
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
