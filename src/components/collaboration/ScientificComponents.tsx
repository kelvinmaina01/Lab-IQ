import { Bot } from 'lucide-react';

/**
 * Scientific loading skeleton for LabIQ Health components
 * Uses LabIQ Health theme colors and scientific aesthetic
 */
export function ScientificLoadingSkeleton() {
    return (
        <div className="flex flex-col items-center justify-center p-8 space-y-4">
            <div className="relative">
                {/* Molecular structure animation */}
                <div className="w-16 h-16 relative animate-spin">
                    <div className="absolute top-0 left-1/2 w-3 h-3 bg-primary rounded-full -translate-x-1/2" />
                    <div className="absolute bottom-0 left-1/2 w-3 h-3 bg-secondary rounded-full -translate-x-1/2" />
                    <div className="absolute left-0 top-1/2 w-3 h-3 bg-primary rounded-full -translate-y-1/2" />
                    <div className="absolute right-0 top-1/2 w-3 h-3 bg-secondary rounded-full -translate-y-1/2" />
                </div>
                {/* Center nucleus */}
                <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-gradient-to-br from-primary to-secondary rounded-full -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            </div>

            <p className="text-sm text-muted-foreground animate-pulse">
                Loading...
            </p>
        </div>
    );
}

/**
 * Bot typing indicator with AI theming
 */
export function BotTypingIndicator() {
    return (
        <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
                <Bot className="w-4 h-4 text-primary" />
                <span className="font-medium text-primary">LabAI</span>
                <span className="text-muted-foreground">is thinking</span>
                <div className="flex gap-1 ml-1">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
            </div>
        </div>
    );
}

/**
 * AI badge component for bot messages
 */
export function AIBadge() {
    return (
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30">
            <Bot className="w-3 h-3 text-primary" />
            <span className="text-xs font-semibold text-primary">AI</span>
        </div>
    );
}
