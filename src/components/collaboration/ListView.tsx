import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    CheckSquare,
    Plus,
    Search,
    Filter,
    MoreHorizontal,
    Calendar,
    Clock,
    User,
    Tag,
    Trash2,
    CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useServices } from "@/core/ServiceProvider";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ListItem } from "@/core/interfaces";

interface ListViewProps {
    id: string;
    title: string;
}

export const ListView = ({ id, title }: ListViewProps) => {
    const { collaboration } = useServices();
    const [items, setItems] = useState<ListItem[]>([]);
    const [newItemContent, setNewItemContent] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchItems = async () => {
            // Placeholder: fetch items for this list
            const sampleItems: ListItem[] = [
                { id: "1", list_id: id, content: "Review reagent inventory for CRISPR experiments", is_completed: false, created_at: new Date().toISOString() },
                { id: "2", list_id: id, content: "Order new pipette tips (P10, P200)", is_completed: true, created_at: new Date().toISOString() },
                { id: "3", list_id: id, content: "Calibrate centrifuge #04", is_completed: false, created_at: new Date().toISOString() },
            ];
            setItems(sampleItems);
        };
        fetchItems();
    }, [id]);

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemContent.trim()) return;

        const newItem: ListItem = {
            id: Math.random().toString(36).substr(2, 9),
            list_id: id,
            content: newItemContent,
            is_completed: false,
            created_at: new Date().toISOString()
        };

        setItems(prev => [newItem, ...prev]);
        setNewItemContent("");
        toast.success("Task added to inventory list");
    };

    const toggleItem = (itemId: string) => {
        setItems(prev => prev.map(item =>
            item.id === itemId ? { ...item, is_completed: !item.is_completed } : item
        ));
    };

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-6 border-b bg-muted/5 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <CheckSquare className="h-6 w-6 text-emerald-500" />
                    </div>
                    <div>
                        <h2 className="font-bold text-2xl tracking-tight">{title}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px] h-5 bg-emerald-500/5 text-emerald-500 border-emerald-500/20">Active Tasks</Badge>
                            <span className="text-xs text-muted-foreground font-medium">• {items.filter(i => !i.is_completed).length} pending items</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative w-64 mr-2">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search inventory..." className="pl-9 h-10 border-muted bg-muted/20" />
                    </div>
                    <Button variant="outline" size="icon" className="h-10 w-10">
                        <Filter className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-10 w-10">
                        <MoreHorizontal className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* List Area */}
            <div className="flex-1 overflow-y-auto p-12 bg-muted/5">
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Add Item Form */}
                    <form onSubmit={handleAddItem} className="relative group">
                        <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative bg-background border border-border/50 shadow-xl rounded-2xl p-2 flex items-center gap-2 pr-4 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                            <div className="h-10 w-10 flex items-center justify-center text-primary">
                                <Plus className="h-6 w-6" />
                            </div>
                            <input
                                className="flex-1 bg-transparent border-none focus:ring-0 text-base placeholder:text-muted-foreground/50"
                                placeholder="Add a new task or inventory item..."
                                value={newItemContent}
                                onChange={(e) => setNewItemContent(e.target.value)}
                            />
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><Calendar className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><User className="h-4 w-4" /></Button>
                                <Button type="submit" disabled={!newItemContent.trim()} className="h-8 px-4 font-bold text-xs uppercase tracking-wider">Add Task</Button>
                            </div>
                        </div>
                    </form>

                    {/* Pending Items */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            Pending Verification
                        </h3>
                        <div className="space-y-2">
                            {items.filter(i => !i.is_completed).map((item, idx) => (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    key={item.id}
                                    className="group bg-background border border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 rounded-xl p-4 flex items-start gap-4 transition-all"
                                >
                                    <Checkbox
                                        checked={item.is_completed}
                                        onCheckedChange={() => toggleItem(item.id)}
                                        className="mt-1 h-5 w-5 rounded-md border-muted-foreground/30 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-foreground font-medium leading-relaxed">{item.content}</p>
                                        <div className="flex items-center gap-3 mt-2">
                                            <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                                                <History className="h-3 w-3" /> Added {new Date(item.created_at).toLocaleDateString()}
                                            </span>
                                            <Badge variant="ghost" className="h-5 px-1.5 bg-muted text-[9px] uppercase font-bold tracking-tighter">Lab Prep</Badge>
                                        </div>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-rose-500"><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Completed Items */}
                    <div className="pt-4 space-y-4 opacity-60">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                            <CheckCircle2 className="h-3 w-3" />
                            Synchronized
                        </h3>
                        <div className="space-y-2">
                            {items.filter(i => i.is_completed).map((item) => (
                                <div key={item.id} className="bg-muted/30 border border-transparent rounded-xl p-4 flex items-start gap-4">
                                    <Checkbox
                                        checked={item.is_completed}
                                        onCheckedChange={() => toggleItem(item.id)}
                                        className="mt-1 h-5 w-5 rounded-md border-muted-foreground/30 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                                    />
                                    <p className="text-muted-foreground line-through font-medium">{item.content}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
