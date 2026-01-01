/**
 * AI Chat Toolbar
 * Julius AI-style bottom toolbar with:
 * - Connectors
 * - Tools
 * - Agent
 * - Advanced Reasoning
 * - Memory
 * - Model selector
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
    Paperclip,
    Link2,
    Wrench,
    Bot,
    Brain,
    Database,
    ChevronDown,
    Sparkles,
    Settings2,
    FileText,
    BarChart3,
    Table2,
    Code2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolbarOption {
    id: string;
    label: string;
    icon: React.ReactNode;
    description?: string;
    enabled?: boolean;
}

interface AIChatToolbarProps {
    onAttachFile?: () => void;
    onSelectTool?: (tool: string) => void;
    onToggleReasoning?: (enabled: boolean) => void;
    reasoningEnabled?: boolean;
    selectedModel?: string;
    onSelectModel?: (model: string) => void;
}

export function AIChatToolbar({
    onAttachFile,
    onSelectTool,
    onToggleReasoning,
    reasoningEnabled = false,
    selectedModel = 'Default',
    onSelectModel
}: AIChatToolbarProps) {
    const [activeTools, setActiveTools] = useState<Set<string>>(new Set());

    const connectorOptions: ToolbarOption[] = [
        { id: 'upload', label: 'Upload File', icon: <FileText className="h-4 w-4" /> },
        { id: 'database', label: 'Connect Database', icon: <Database className="h-4 w-4" /> },
        { id: 'api', label: 'API Endpoint', icon: <Link2 className="h-4 w-4" /> },
    ];

    const toolOptions: ToolbarOption[] = [
        { id: 'chart', label: 'Generate Chart', icon: <BarChart3 className="h-4 w-4" />, description: 'Create visualizations' },
        { id: 'table', label: 'Create Table', icon: <Table2 className="h-4 w-4" />, description: 'Tabular data view' },
        { id: 'code', label: 'Run Code', icon: <Code2 className="h-4 w-4" />, description: 'Execute Python/R' },
        { id: 'stats', label: 'Statistics', icon: <Sparkles className="h-4 w-4" />, description: 'Statistical analysis' },
    ];

    const modelOptions = [
        { id: 'default', label: 'Default', description: 'Balanced performance' },
        { id: 'advanced', label: 'Advanced', description: 'More detailed analysis' },
        { id: 'fast', label: 'Fast', description: 'Quick responses' },
    ];

    return (
        <div className="flex items-center gap-1 px-2 py-2 border-t bg-muted/30">
            {/* Attach File */}
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onAttachFile}
            >
                <Paperclip className="h-4 w-4" />
            </Button>

            {/* Connectors Dropdown */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">
                        <Link2 className="h-3.5 w-3.5" />
                        Connectors
                        <ChevronDown className="h-3 w-3" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                    {connectorOptions.map((option) => (
                        <DropdownMenuItem key={option.id} className="gap-2">
                            {option.icon}
                            {option.label}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Tools Dropdown */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">
                        <Wrench className="h-3.5 w-3.5" />
                        Tools
                        <ChevronDown className="h-3 w-3" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                    {toolOptions.map((tool) => (
                        <DropdownMenuItem
                            key={tool.id}
                            className="gap-2"
                            onClick={() => onSelectTool?.(tool.id)}
                        >
                            {tool.icon}
                            <div className="flex flex-col">
                                <span>{tool.label}</span>
                                {tool.description && (
                                    <span className="text-xs text-muted-foreground">{tool.description}</span>
                                )}
                            </div>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Agent Dropdown */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">
                        <Bot className="h-3.5 w-3.5" />
                        Agent
                        <ChevronDown className="h-3 w-3" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuItem className="gap-2">
                        <Sparkles className="h-4 w-4" />
                        Data Analyst
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2">
                        <Code2 className="h-4 w-4" />
                        Code Assistant
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Visualization Expert
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Advanced Reasoning Toggle */}
            <Button
                variant={reasoningEnabled ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                    "h-8 gap-1 text-xs",
                    reasoningEnabled && "bg-primary/10 text-primary hover:bg-primary/20"
                )}
                onClick={() => onToggleReasoning?.(!reasoningEnabled)}
            >
                <Brain className="h-3.5 w-3.5" />
                Advanced Reasoning
            </Button>

            {/* Memory */}
            <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">
                <Database className="h-3.5 w-3.5" />
                Memory
            </Button>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Model Selector */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
                        {selectedModel}
                        <ChevronDown className="h-3 w-3" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    {modelOptions.map((model) => (
                        <DropdownMenuItem
                            key={model.id}
                            onClick={() => onSelectModel?.(model.label)}
                            className={cn(
                                selectedModel === model.label && "bg-muted"
                            )}
                        >
                            <div className="flex flex-col">
                                <span>{model.label}</span>
                                <span className="text-xs text-muted-foreground">{model.description}</span>
                            </div>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

export default AIChatToolbar;
