import { useState, useEffect } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Database,
    Search,
    Table2,
    ArrowRight,
    ChevronRight,
    ChevronLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface DataExplorerPanelProps {
    datasetId: string | null;
    className?: string;
    onClose?: () => void;
}

export function DataExplorerPanel({ datasetId, className, onClose }: DataExplorerPanelProps) {
    const [dataset, setDataset] = useState<any>(null);
    const [columns, setColumns] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (datasetId) {
            loadDataset();
        }
    }, [datasetId]);

    const loadDataset = async () => {
        if (!datasetId) return;
        setLoading(true);
        try {
            // Load dataset info
            const { data: datasetData } = await supabase
                .from('datasets')
                .select('*')
                .eq('id', datasetId)
                .single();

            if (datasetData) setDataset(datasetData);

            // Load columns
            const { data: colsData } = await supabase
                .from('dataset_columns')
                .select('*')
                .eq('dataset_id', datasetId);

            if (colsData) setColumns(colsData);
        } catch (error) {
            console.error('Error loading dataset:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredColumns = columns.filter(col =>
        col.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!datasetId) return null;

    return (
        <div className={cn("flex flex-col h-full border-l bg-background w-80", className)}>
            <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold">
                    <Database className="w-4 h-4" />
                    Data Explorer
                </div>
                {onClose && (
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                )}
            </div>

            <div className="p-4 border-b">
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search columns..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>

            <ScrollArea className="flex-1 p-4">
                {loading ? (
                    <div className="text-center py-4 text-muted-foreground text-sm">Loading data...</div>
                ) : (
                    <div className="space-y-4">
                        {dataset && (
                            <div className="mb-4">
                                <h3 className="font-medium text-sm mb-1">{dataset.name}</h3>
                                <p className="text-xs text-muted-foreground">{dataset.row_count?.toLocaleString()} rows</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Columns ({filteredColumns.length})</h4>
                            {filteredColumns.map((col) => (
                                <div key={col.id} className="p-2 border rounded-md bg-card/50 hover:bg-muted/50 transition-colors text-sm group">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium">{col.name}</span>
                                        <Badge variant="secondary" className="text-[10px] h-5">{col.data_type}</Badge>
                                    </div>
                                    {col.sample_values && (
                                        <div className="text-xs text-muted-foreground truncate">
                                            Sample: {Array.isArray(col.sample_values) ? col.sample_values.join(', ') : col.sample_values}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
