import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Paperclip,
    Plug,
    Atom,
    ChevronDown,
    ArrowUp,
    Loader2,
    Check,
    Cloud,
    Database,
    Warehouse,
    Activity,
    BrainCircuit,
    Bot,
    LayoutTemplate
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CodeSandboxStatus } from '@/components/assistant/CodeSandboxStatus';

import { supabase } from '@/integrations/supabase/client';


interface NotebookInputAreaProps {
    value: string;
    onChange: (val: string) => void;
    onSubmit: () => void;
    loading: boolean;
}

export const NotebookInputArea: React.FC<NotebookInputAreaProps> = ({ value, onChange, onSubmit, loading }) => {
    const [models, setModels] = useState<{ id: string; name: string }[]>([]);

    useEffect(() => {
        const fetchModels = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from('models')
                .select('id, name')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (data) {
                setModels(data);
            }
        };
        fetchModels();
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
        }
    };

    return (
        <div className="bg-background border rounded-2xl shadow-sm focus-within:ring-1 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all">
            {/* Top: Input Field */}
            <div className="relative">
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Send a message..."
                    disabled={loading}
                    className="w-full bg-transparent border-none focus:ring-0 resize-none min-h-[50px] max-h-[200px] p-4 text-base placeholder:text-muted-foreground/50 focus:outline-none"
                    rows={1}
                    style={{ height: 'auto', minHeight: '50px' }}
                />

                {/* Send Button (Absolute Right) */}
                <div className="absolute bottom-3 right-3">
                    <Button
                        onClick={onSubmit}
                        disabled={loading || !value.trim()}
                        size="icon"
                        className={cn(
                            "h-8 w-8 rounded-full transition-all",
                            value.trim() ? "bg-blue-500 hover:bg-blue-600 text-white" : "bg-muted text-muted-foreground"
                        )}
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-5 h-5" />}
                    </Button>
                </div>
            </div>

            {/* Bottom: Toolbar */}
            <div className="flex items-center gap-1 p-1.5 pl-3 border-t bg-muted/5 rounded-b-2xl">
                {/* Attach */}
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground hover:bg-muted/50">
                    <Paperclip className="w-4 h-4" />
                </Button>

                {/* Connectors Menu */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 gap-2 rounded-lg text-muted-foreground hover:bg-muted/50 font-normal text-xs">
                            <Plug className="w-4 h-4" />
                            Connectors
                            <ChevronDown className="w-3 h-3 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="start" sideOffset={8}>
                        <div className="p-4 space-y-4">
                            <div>
                                <h4 className="font-semibold text-sm mb-1 text-blue-600">Data Connectors</h4>
                                <div className="space-y-2 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <Check className="w-3 h-3 text-green-500" />
                                        Connect your data to LabIQ
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Check className="w-3 h-3 text-green-500" />
                                        Analyze everything in one place
                                    </div>
                                </div>
                            </div>

                            {/* Animated Marquee of Cloud Source Icons */}
                            <div className="relative overflow-hidden py-4 border-t border-b bg-slate-50/50">
                                <div className="flex gap-6 animate-marquee whitespace-nowrap">
                                    {/* Set 1 */}
                                    <IconItem icon={Warehouse} color="text-cyan-600" label="Snowflake" />
                                    <IconItem icon={Database} color="text-blue-600" label="BigQuery" />
                                    <IconItem icon={Cloud} color="text-orange-500" label="Amazon S3" />
                                    <IconItem icon={Activity} color="text-red-500" label="Epic EHR" />
                                    <IconItem icon={Activity} color="text-blue-500" label="Cerner" />
                                    <IconItem icon={Cloud} color="text-blue-500" label="G-Drive" />

                                    {/* Set 2 (Duplicate for smooth loop) */}
                                    <IconItem icon={Warehouse} color="text-cyan-600" label="Snowflake" />
                                    <IconItem icon={Database} color="text-blue-600" label="BigQuery" />
                                    <IconItem icon={Cloud} color="text-orange-500" label="Amazon S3" />
                                    <IconItem icon={Activity} color="text-red-500" label="Epic EHR" />
                                    <IconItem icon={Activity} color="text-blue-500" label="Cerner" />
                                    <IconItem icon={Cloud} color="text-blue-500" label="G-Drive" />
                                </div>
                                {/* Gradient Masks */}
                                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none" />
                                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>

                {/* Models (Replaces Agent) */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 gap-2 rounded-lg text-muted-foreground hover:bg-muted/50 font-normal text-xs">
                            <Bot className="w-4 h-4" />
                            Models
                            <ChevronDown className="w-3 h-3 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-0" align="start" sideOffset={8}>
                        <div className="p-4 space-y-3">
                            <div>
                                <h4 className="font-semibold text-sm mb-1 text-blue-600">AI Models</h4>
                                <p className="text-xs text-muted-foreground">Connect to trained models</p>
                            </div>

                            <div className="space-y-1">
                                <ModelOption name="LabIQ Reasoning Pro" active />
                                <ModelOption name="GPT-4o (OpenAI)" />
                                <ModelOption name="Claude 3.5 Sonnet" />
                                <ModelOption name="Llama 3 70B" />
                            </div>

                            <div className="pt-2 mt-2 border-t">
                                <h4 className="font-semibold text-xs mb-1 text-purple-600">Trained ML Models</h4>
                                <div className="space-y-1">
                                    {models.length > 0 ? (
                                        models.map((model) => (
                                            <ModelOption key={model.id} name={model.name} />
                                        ))
                                    ) : (
                                        <div className="text-[10px] text-muted-foreground p-2">No custom models found</div>
                                    )}
                                </div>
                            </div>

                            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold h-8 mt-2">
                                Connect Model
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>

                {/* Advanced Reasoning Menu */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 gap-2 rounded-lg text-muted-foreground hover:bg-muted/50 font-normal text-xs">
                            <Atom className="w-4 h-4" />
                            Advanced Reasoning
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-0" align="start" sideOffset={8}>
                        <div className="p-4 space-y-4">
                            <div>
                                <h4 className="font-semibold text-sm mb-1 text-blue-600">Advanced Reasoning</h4>
                                <div className="space-y-2 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <Check className="w-3 h-3 text-green-500" />
                                        Handle more complex tasks
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Check className="w-3 h-3 text-green-500" />
                                        Multiple-step Planning
                                    </div>
                                </div>
                            </div>

                            {/* Thinking Card Visual */}
                            <div className="bg-slate-50 dark:bg-slate-900 border rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <BrainCircuit className="w-4 h-4 text-purple-500" />
                                    <span className="text-xs font-medium">Thinking</span>
                                </div>
                                <div className="space-y-2 opacity-50">
                                    <div className="h-2 w-3/4 bg-slate-200 dark:bg-slate-700 rounded-full" />
                                    <div className="h-2 w-1/2 bg-slate-200 dark:bg-slate-700 rounded-full" />
                                </div>
                            </div>

                            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold h-8">
                                Upgrade to Activate
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>

                {/* Code Monitor */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 gap-2 rounded-lg text-muted-foreground hover:bg-muted/50 font-normal text-xs">
                            <LayoutTemplate className="w-4 h-4" />
                            Code Monitor
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="start" sideOffset={8}>
                        <CodeSandboxStatus />
                    </PopoverContent>
                </Popover>
            </div>

            {/* Inline Styles for Marquee (if not in tailwind config) */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 20s linear infinite;
                }
                .animate-marquee:hover {
                    animation-play-state: paused;
                }
            `}} />
        </div>
    );
};

const IconItem = ({ icon: Icon, color, label }: { icon: any, color: string, label: string }) => (
    <div className="flex flex-col items-center gap-1 min-w-[60px]">
        <div className="p-2 bg-white rounded-lg shadow-sm border">
            <Icon className={cn("w-5 h-5", color)} />
        </div>
        <span className="text-[10px] font-medium text-slate-500">{label}</span>
    </div>
);

const ModelOption = ({ name, active }: { name: string, active?: boolean }) => (
    <div className={cn(
        "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors text-xs font-medium",
        active ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50 text-slate-700"
    )}>
        <div className={cn(
            "w-2 h-2 rounded-full",
            active ? "bg-blue-600" : "bg-slate-300"
        )} />
        {name}
        {active && <Check className="w-3 h-3 ml-auto" />}
    </div>
);
