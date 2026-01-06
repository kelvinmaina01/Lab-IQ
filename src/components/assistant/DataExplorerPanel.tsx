import { useState, useEffect } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
    Database,
    Search,
    Table2,
    FileText,
    ChevronRight,
    Lightbulb,
    Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface DataExplorerPanelProps {
    datasetId?: string | null;
    className?: string;
    onClose?: () => void;
    onDatasetSelect?: (datasetId: string) => void;
}

export function DataExplorerPanel({ datasetId, className, onClose, onDatasetSelect }: DataExplorerPanelProps) {
    const [datasets, setDatasets] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('data');

    useEffect(() => {
        loadAllDatasets();
    }, []);

    const loadAllDatasets = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('datasets')
                .select('id, name, row_count, column_count')
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) setDatasets(data);
        } catch (error) {
            console.error('Error loading datasets:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredDatasets = datasets.filter(ds =>
        ds.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={cn("flex flex-col h-full border-l bg-background w-80", className)}>
            {/* Header with Tabs */}
            <div className="p-4 border-b">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="planning" className="text-xs">
                            <Target className="w-3 h-3 mr-1" />
                            Planning
                        </TabsTrigger>
                        <TabsTrigger value="data" className="text-xs">
                            <Database className="w-3 h-3 mr-1" />
                            Data
                        </TabsTrigger>
                        <TabsTrigger value="insights" className="text-xs">
                            <Lightbulb className="w-3 h-3 mr-1" />
                            Insights
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Active Data Section */}
            <div className="p-4 border-b">
                <div className="flex items-center gap-2 mb-3">
                    <Database className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold">Active Data</h3>
                </div>
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search columns, files..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>

            {/* Dataset List */}
            <ScrollArea className="flex-1 p-4">
                {loading ? (
                    <div className="text-center py-4 text-muted-foreground text-sm">Loading data...</div>
                ) : (
                    <div className="space-y-2">
                        {filteredDatasets.map((ds) => (
                            <button
                                key={ds.id}
                                onClick={() => onDatasetSelect?.(ds.id)}
                                className={cn(
                                    "w-full p-3 rounded-lg border text-left transition-all hover:bg-muted/50",
                                    datasetId === ds.id ? "bg-muted border-primary" : "bg-card/50"
                                )}
                            >
                                <div className="flex items-start gap-3">
                                    <FileText className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm truncate">{ds.name}</div>
                                        <div className="text-xs text-muted-foreground mt-0.5">
                                            {ds.row_count?.toLocaleString() || 0} rows • {ds.column_count || 0} cols
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                        {filteredDatasets.length === 0 && !loading && (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                No datasets found
                            </div>
                        )}
                    </div>
                )}
            </ScrollArea>

            {onClose && (
                <div className="p-2 border-t">
                    <Button variant="ghost" size="sm" onClick={onClose} className="w-full">
                        <ChevronRight className="w-4 h-4 mr-2" />
                        Close Panel
                    </Button>
                </div>
            )}
        </div>
    );
}
