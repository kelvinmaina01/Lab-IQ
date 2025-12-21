import { useState, useEffect, useCallback } from "react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Search, MessageSquare, Hash, FileText, FolderKanban,
    Loader2, Command, ArrowRight, CornerDownLeft
} from "lucide-react";
import { useServices } from "@/core/ServiceProvider";
import { ChatMessage, ChatChannel, SharedFile, SharedProject } from "@/core/interfaces";
import { Badge } from "@/components/ui/badge";
import { debounce } from "@/utils/debounce";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface WorkspaceSearchProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    labId: string;
    onSelect: (id: string, type: 'channel' | 'dm' | 'file' | 'project') => void;
}

export const WorkspaceSearch = ({ open, onOpenChange, labId, onSelect }: WorkspaceSearchProps) => {
    const { collaboration } = useServices();
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<{
        messages: ChatMessage[];
        channels: ChatChannel[];
        files: any[];
        projects: any[];
        canvases: any[];
        lists: any[];
    }>({ messages: [], channels: [], files: [], projects: [], canvases: [], lists: [] });

    const performSearch = useCallback(
        debounce(async (searchQuery: string) => {
            if (!searchQuery.trim()) {
                setResults({ messages: [], channels: [], files: [], projects: [], canvases: [], lists: [] });
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const data = await collaboration.searchEverything(searchQuery, labId);
                setResults(data);
            } catch (error) {
                console.error("Search failed:", error);
            } finally {
                setLoading(false);
            }
        }, 500),
        [labId, collaboration]
    );

    useEffect(() => {
        performSearch(query);
    }, [query, performSearch]);

    const handleSelect = (id: string, type: any) => {
        onSelect(id, type);
        onOpenChange(false);
        setQuery("");
    };

    const hasResults =
        results.messages.length > 0 ||
        results.channels.length > 0 ||
        results.files.length > 0 ||
        results.projects.length > 0 ||
        results.canvases.length > 0 ||
        results.lists.length > 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl p-0 overflow-hidden border-none shadow-2xl bg-background/95 backdrop-blur-xl">
                <DialogHeader className="p-4 border-b bg-muted/20">
                    <div className="flex items-center gap-3">
                        <Search className="h-5 w-5 text-primary animate-pulse" />
                        <Input
                            autoFocus
                            placeholder="Search messages, channels, scientific assets..."
                            className="border-none bg-transparent focus-visible:ring-0 text-lg p-0 h-auto"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        <kbd className="hidden md:flex items-center gap-1 bg-muted px-2 py-1 rounded border text-[10px] text-muted-foreground font-mono">
                            ESC
                        </kbd>
                    </div>
                </DialogHeader>

                <ScrollArea className="max-h-[60vh]">
                    {loading ? (
                        <div className="p-12 text-center space-y-4">
                            <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
                            <p className="text-sm text-muted-foreground animate-pulse">Scanning Lab-IQ Neurons...</p>
                        </div>
                    ) : query && !hasResults ? (
                        <div className="p-12 text-center text-muted-foreground">
                            <p>No scientific matches found for "{query}"</p>
                        </div>
                    ) : !query ? (
                        <div className="p-8">
                            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-4 tracking-widest flex items-center gap-2">
                                <Command className="h-3 w-3" /> Quick Access Nodes
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 cursor-pointer flex items-center gap-3 transition-all" onClick={() => handleSelect('general', 'channel')}>
                                    <Hash className="h-4 w-4 text-primary" />
                                    <span className="text-sm font-medium">#general</span>
                                </div>
                                <div className="p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 cursor-pointer flex items-center gap-3 transition-all">
                                    <MessageSquare className="h-4 w-4 text-emerald-500" />
                                    <span className="text-sm font-medium">Direct Synapses</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 space-y-8 pb-8">
                            {/* Channels */}
                            {results.channels.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-[10px] uppercase font-bold text-muted-foreground px-2 tracking-widest">Active Streams</h4>
                                    {results.channels.map(ch => (
                                        <div
                                            key={ch.id}
                                            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-primary/10 cursor-pointer group transition-all"
                                            onClick={() => handleSelect(ch.id, 'channel')}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Hash className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                                                <span className="text-sm font-medium">{ch.display_name || ch.name}</span>
                                            </div>
                                            <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Scientific Projects */}
                            {results.projects.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-[10px] uppercase font-bold text-muted-foreground px-2 tracking-widest">Research Projects</h4>
                                    {results.projects.map(p => (
                                        <div
                                            key={p.id}
                                            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-cyan-500/10 cursor-pointer group transition-all"
                                            onClick={() => handleSelect(p.id, 'project')}
                                        >
                                            <div className="flex items-center gap-3">
                                                <FolderKanban className="h-4 w-4 text-cyan-500" />
                                                <span className="text-sm font-medium">{p.name}</span>
                                            </div>
                                            <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Lab Notebooks & Canvases */}
                            {results.canvases.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-[10px] uppercase font-bold text-muted-foreground px-2 tracking-widest">Lab Notebooks</h4>
                                    {results.canvases.map(c => (
                                        <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-purple-500/10 cursor-pointer group transition-all">
                                            <FileText className="h-4 w-4 text-purple-500" />
                                            <div>
                                                <p className="text-sm font-medium">{c.title}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase font-black">Notebook Node</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Asset Files */}
                            {results.files.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-[10px] uppercase font-bold text-muted-foreground px-2 tracking-widest">Scientific Assets</h4>
                                    {results.files.map(file => (
                                        <div key={file.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-blue-500/10 cursor-pointer group transition-all">
                                            <FileText className="h-4 w-4 text-blue-500" />
                                            <div>
                                                <p className="text-sm font-medium">{file.name}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase font-black">{file.category || 'Asset'}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Messages */}
                            {results.messages.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-[10px] uppercase font-bold text-muted-foreground px-2 tracking-widest">Transcription History</h4>
                                    {results.messages.map(msg => (
                                        <div
                                            key={msg.id}
                                            className="p-3 rounded-xl hover:bg-primary/10 cursor-pointer group transition-all border border-transparent hover:border-primary/20"
                                            onClick={() => handleSelect(msg.channel_id, 'channel')}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-black">{msg.user?.display_name || "Sync Node"}</span>
                                                    <span className="text-[10px] text-muted-foreground">{format(new Date(msg.created_at), 'MMM d, HH:mm')}</span>
                                                </div>
                                                <Badge variant="outline" className="text-[8px] h-4 font-black bg-muted">NODE REF: {msg.id.substring(0, 6)}</Badge>
                                            </div>
                                            <p className="text-sm text-foreground/80 line-clamp-2 group-hover:text-foreground italic">"{msg.content}"</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </ScrollArea>

                <div className="p-3 border-t bg-muted/20 flex items-center justify-between px-4">
                    <div className="flex gap-4 text-[10px] text-muted-foreground font-medium">
                        <span className="flex items-center gap-1"><CornerDownLeft className="h-3 w-3" /> Select</span>
                        <span className="flex items-center gap-1"><Command className="h-3 w-3" /> K  Search</span>
                        <span className="flex items-center gap-1">ESC Close</span>
                    </div>
                    <div className="h-5 w-5 bg-primary/10 rounded-full flex items-center justify-center">
                        <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
