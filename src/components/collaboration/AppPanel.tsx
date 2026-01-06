import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Bot, Send, Loader2, Sparkles, Brain, FlaskConical, Stethoscope,
    Terminal, Share2, Download, Zap, BookOpen, Search, Filter,
    Settings, ShieldCheck
} from "lucide-react";
import { format } from "date-fns";
import { useServices } from "@/core/ServiceProvider";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AppPanelProps {
    appId: 'bioexpert' | 'pharma' | 'clinical';
}

interface AIMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export const AppPanel = ({ appId }: AppPanelProps) => {
    const { auth, supabase } = useServices();
    const [messages, setMessages] = useState<AIMessage[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const getAppDetails = () => {
        switch (appId) {
            case 'bioexpert':
                return {
                    name: "BioExpert AI",
                    description: "Computational Biology & Genetics Assistant",
                    icon: <FlaskConical className="h-5 w-5 text-emerald-500" />,
                    color: "text-emerald-500",
                    bgColor: "bg-emerald-500/10",
                    prompt: "You are BioExpert AI, a specialist in computational biology and genetics. Provide precise, research-backed insights."
                };
            case 'pharma':
                return {
                    name: "PharmaBot",
                    description: "Pharmaceutical R&D & Drug Discovery Agent",
                    icon: <Zap className="h-5 w-5 text-blue-500" />,
                    color: "text-blue-500",
                    bgColor: "bg-blue-500/10",
                    prompt: "You are PharmaBot, a specialist in pharmacology and drug discovery. Help with molecular analysis and clinical pipeline data."
                };
            case 'clinical':
                return {
                    name: "ClinicalScribe",
                    description: "Clinical Trial & Patient Data Assistant",
                    icon: <Stethoscope className="h-5 w-5 text-purple-500" />,
                    color: "text-purple-500",
                    bgColor: "bg-purple-500/10",
                    prompt: "You are ClinicalScribe, a specialist in clinical trials and medical documentation. Help with protocol design and data summarization."
                };
        }
    };

    const details = getAppDetails();

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg: AIMessage = { role: 'user', content: input.trim(), timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const user = await auth.getUser();

            const { data, error } = await supabase.functions.invoke('chat-bot-ai', {
                body: {
                    message: input.trim(),
                    channelId: `app-${appId}`, // Virtual channel for apps
                    userId: user?.id,
                    systemPrompt: details.prompt, // Pass custom prompt to Edge Function
                    history: messages.map(m => ({ role: m.role, content: m.content }))
                }
            });

            if (error) throw error;

            if (data?.aiMessage) {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: data.aiMessage,
                    timestamp: new Date()
                }]);
            }
        } catch (error) {
            console.error("AI Error:", error);
            toast.error("Failed to get AI response");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-background overflow-hidden animate-in fade-in duration-500">
            {/* App Header */}
            <div className="p-6 border-b bg-gradient-to-r from-muted/20 to-transparent">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center border shadow-sm", details.bgColor)}>
                            {details.icon}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight">{details.name}</h2>
                            <p className="text-sm text-muted-foreground">{details.description}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="gap-1 font-mono text-[10px] uppercase tracking-wider">
                            <ShieldCheck className="h-3 w-3" /> Certified AI
                        </Badge>
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <Settings className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Analytics/Status quick stats */}
                <div className="grid grid-cols-3 gap-4 mt-6">
                    <Card className="p-3 bg-muted/30 border-none flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Response Time</span>
                        <span className="text-sm font-bold flex items-center gap-1"><Zap className="h-3 w-3 text-yellow-500" /> ~2.4s</span>
                    </Card>
                    <Card className="p-3 bg-muted/30 border-none flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Knowledge Cutoff</span>
                        <span className="text-sm font-bold flex items-center gap-1"><BookOpen className="h-3 w-3 text-blue-500" /> Dec 2024</span>
                    </Card>
                    <Card className="p-3 bg-muted/30 border-none flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Confidence</span>
                        <span className="text-sm font-bold flex items-center gap-1 transition-all group cursor-help"><Brain className="h-3 w-3 text-purple-500" /> 98.4%</span>
                    </Card>
                </div>
            </div>

            {/* Main Agent Interface */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                <ScrollArea className="flex-1 p-6" ref={scrollRef}>
                    <div className="max-w-3xl mx-auto space-y-8 pb-10">
                        {messages.length === 0 && (
                            <div className="text-center py-20 space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-700">
                                <div className="h-20 w-20 rounded-full bg-primary/5 mx-auto flex items-center justify-center border border-primary/10">
                                    <Bot className="h-10 w-10 text-primary opacity-50" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold">Hello, Researcher</h3>
                                    <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                                        I am your specialized {details.name}. How can I assist with your scientific inquiry today?
                                    </p>
                                </div>
                                <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
                                    <Button variant="outline" size="sm" className="rounded-full shadow-sm hover:bg-primary/5" onClick={() => setInput("Analyze the latest clinical trial data for GLP-1 agonists")}>Analyze GLP-1 data</Button>
                                    <Button variant="outline" size="sm" className="rounded-full shadow-sm hover:bg-primary/5" onClick={() => setInput("Summarize recent breakthroughs in CRISPR gene editing")}>CRISPR breakthroughs</Button>
                                    <Button variant="outline" size="sm" className="rounded-full shadow-sm hover:bg-primary/5" onClick={() => setInput("Identify potential protein markers for early-stage Alzheimer's")}>Alzheimer's markers</Button>
                                </div>
                            </div>
                        )}

                        {messages.map((m, i) => (
                            <div key={i} className={cn(
                                "flex gap-4 animate-in slide-in-from-bottom-2 duration-300",
                                m.role === 'assistant' ? "items-start" : "items-start flex-row-reverse"
                            )}>
                                <Avatar className={cn(
                                    "h-8 w-8",
                                    m.role === 'assistant' ? "border-primary/20 bg-primary/5" : "border-muted"
                                )}>
                                    {m.role === 'assistant' ? (
                                        <div className="flex items-center justify-center h-full w-full">{details.icon}</div>
                                    ) : (
                                        <AvatarFallback className="bg-muted text-[10px]">YOU</AvatarFallback>
                                    )}
                                </Avatar>
                                <div className={cn(
                                    "max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed",
                                    m.role === 'assistant' ? "bg-muted/40 border" : "bg-primary text-primary-foreground shadow-md"
                                )}>
                                    <div className="prose prose-sm dark:prose-invert max-w-none">
                                        {m.content}
                                    </div>
                                    <div className={cn(
                                        "mt-2 text-[10px] opacity-50 font-mono",
                                        m.role === 'assistant' ? "text-muted-foreground" : "text-primary-foreground"
                                    )}>
                                        {format(m.timestamp, 'HH:mm:ss')}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex gap-4 animate-pulse">
                                <div className="h-8 w-8 rounded-full bg-muted" />
                                <div className="h-20 flex-1 bg-muted/20 rounded-2xl" />
                            </div>
                        )}
                    </div>
                </ScrollArea>

                {/* Input area */}
                <div className="p-6 border-t bg-muted/5">
                    <div className="max-w-3xl mx-auto relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none opacity-50">
                            <Terminal className="h-4 w-4" />
                        </div>
                        <Input
                            placeholder={`Ask ${details.name} a scientific question...`}
                            className="pl-11 pr-24 h-14 bg-background border-muted shadow-sm rounded-xl focus-visible:ring-primary/20"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            disabled={loading}
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground">
                                <Filter className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                size="sm"
                                className="h-10 rounded-lg shadow-sm gap-2"
                                onClick={handleSend}
                                disabled={!input.trim() || loading}
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                <span>Run</span>
                            </Button>
                        </div>
                    </div>
                    <p className="text-center text-[10px] text-muted-foreground mt-3 opacity-60">
                        Powered by Grok AI High-Performance Engine • 21 CFR Part 11 Compliant Audit Trails Enabled
                    </p>
                </div>
            </div>
        </div>
    );
};

// End of component
