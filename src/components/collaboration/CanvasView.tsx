import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Book,
    Save,
    Share2,
    History,
    Maximize2,
    MoreHorizontal,
    Type,
    Image as ImageIcon,
    Table as TableIcon,
    Code,
    Sparkles,
    Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useServices } from "@/core/ServiceProvider";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CanvasViewProps {
    id: string;
    title: string;
}

export const CanvasView = ({ id, title }: CanvasViewProps) => {
    const { collaboration } = useServices();
    const [content, setContent] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const loadCanvas = async () => {
            const { data } = await collaboration.getCanvases(id); // Placeholder fetch logic
            // In a real app, we'd fetch specific canvas by ID
        };
        loadCanvas();
    }, [id]);

    const handleSave = async () => {
        setIsSaving(true);
        // Simulate save
        await new Promise(r => setTimeout(r, 800));
        setIsSaving(false);
        toast.success("Canvas synchronized with lab cloud");
    };

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-3 border-b bg-muted/5 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                            <Book className="h-4 w-4 text-amber-500" />
                        </div>
                        <h2 className="font-bold text-lg tracking-tight">{title}</h2>
                    </div>
                    <Separator orientation="vertical" className="h-6" />
                    <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-lg border border-border/50">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md"><Type className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md"><ImageIcon className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md"><TableIcon className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md"><Code className="h-4 w-4" /></Button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex -space-x-2 mr-4">
                        {[1, 2].map(i => (
                            <div key={i} className="h-8 w-8 rounded-full border-2 border-background bg-primary/20 flex items-center justify-center text-[10px] font-bold">
                                {i === 1 ? 'MK' : 'JB'}
                            </div>
                        ))}
                        <div className="h-8 w-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-bold">
                            +1
                        </div>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2 font-semibold" onClick={handleSave}>
                        <Save className={cn("h-4 w-4", isSaving && "animate-pulse")} />
                        {isSaving ? "Syncing..." : "Sync"}
                    </Button>
                    <Button size="sm" className="gap-2 font-bold shadow-lg shadow-primary/20">
                        <Share2 className="h-4 w-4" />
                        Distribute
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                        <MoreHorizontal className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 overflow-y-auto p-12 bg-muted/5">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-4xl mx-auto bg-background min-h-[800px] shadow-2xl rounded-3xl border border-border/50 p-16 relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 to-orange-500 opacity-50" />

                    <div className="space-y-8">
                        <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-amber-500 border-amber-500/20 bg-amber-500/5 px-3 py-1 font-bold tracking-wider uppercase text-[10px]">Scientific Note</Badge>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <History className="h-4 w-4" />
                                <span className="text-xs font-medium">Last updated 24m ago</span>
                            </div>
                        </div>

                        <input
                            className="bg-transparent border-none focus:ring-0 text-5xl font-black tracking-tight w-full placeholder:text-muted/30"
                            placeholder="Documentation Title..."
                            defaultValue={title}
                        />

                        <div className="prose prose-lg dark:prose-invert max-w-none">
                            <textarea
                                className="w-full bg-transparent border-none focus:ring-0 resize-none min-h-[500px] text-lg leading-relaxed placeholder:text-muted/20"
                                placeholder="Begin your collaborative scientific documentation here. Use @LabAI to generate insights or link to experiments..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Magic Sidebar Action */}
                    <div className="absolute bottom-12 right-12">
                        <Button className="h-14 w-14 rounded-2xl shadow-2xl shadow-primary/40 bg-gradient-to-br from-primary to-primary/80 group">
                            <Sparkles className="h-6 w-6 group-hover:animate-spin-slow" />
                        </Button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};
