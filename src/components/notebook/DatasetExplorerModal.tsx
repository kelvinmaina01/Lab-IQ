import React, { useState, useEffect, useMemo } from 'react';
import {
    X, Database, Columns, FileText,
    Download, Share2, PaintBucket,
    Plus, Trash2, Check, Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface DatasetExplorerModalProps {
    isOpen: boolean;
    onClose: () => void;
    datasetName: string;
    rowCount: number | string;
    columns: any[]; // Schema
    data: any[]; // Preview Rows
}

interface FormatRule {
    id: string;
    column: string;
    operator: 'gt' | 'lt' | 'eq' | 'contains';
    value: string;
    color: string; // Tailwind class
}

interface EditCell {
    rowIdx: number;
    colKey: string;
}

const COLORS = [
    { label: 'Red', value: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
    { label: 'Green', value: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
    { label: 'Blue', value: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
    { label: 'Yellow', value: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' },
];

export const DatasetExplorerModal: React.FC<DatasetExplorerModalProps> = ({
    isOpen,
    onClose,
    datasetName,
    rowCount,
    columns,
    data
}) => {
    const { toast } = useToast();

    // -- Local State --
    const [localData, setLocalData] = useState<any[]>([]);
    const [rules, setRules] = useState<FormatRule[]>([]);
    const [editingCell, setEditingCell] = useState<EditCell | null>(null);
    const [editValue, setEditValue] = useState("");

    // Initialize local data when Prop data changes
    useEffect(() => {
        if (data) {
            setLocalData(JSON.parse(JSON.stringify(data))); // Deep copy
        }
    }, [data, isOpen]);

    if (!isOpen) return null;

    // Helper: Headers
    const headers = columns.map(c => c.name || c.column_name);
    const displayHeaders = headers.length > 0
        ? headers
        : (localData.length > 0 ? Object.keys(localData[0]) : []);

    // -- Actions --

    const handleDownload = () => {
        if (localData.length === 0) return;

        // Simple CSV construction
        const csvHeaders = displayHeaders.join(',');
        const csvRows = localData.map(row =>
            displayHeaders.map(h => {
                const val = row[h] ?? '';
                // Handle commas/quotes
                return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
            }).join(',')
        );
        const csvContent = [csvHeaders, ...csvRows].join('\n');

        // Blob & Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${datasetName.replace(/\s+/g, '_')}_edited.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({ title: "Dataset Downloaded", description: "Exported grid as CSV." });
    };

    const handleShare = () => {
        // Mock share - just copies current URL + dataset param logic
        // In real app, this might generate a signed URL
        navigator.clipboard.writeText(window.location.href);
        toast({ title: "Link Copied", description: "Share this link with your team." });
    };

    const addRule = () => {
        if (displayHeaders.length === 0) return;
        const newRule: FormatRule = {
            id: crypto.randomUUID(),
            column: displayHeaders[0],
            operator: 'eq',
            value: '',
            color: COLORS[0].value
        };
        setRules([...rules, newRule]);
    };

    const removeRule = (id: string) => {
        setRules(rules.filter(r => r.id !== id));
    };

    const updateRule = (id: string, field: keyof FormatRule, val: string) => {
        setRules(rules.map(r => r.id === id ? { ...r, [field]: val } : r));
    };

    // -- Editing --

    const startEditing = (rowIdx: number, colKey: string, val: any) => {
        setEditingCell({ rowIdx, colKey });
        setEditValue(String(val ?? ''));
    };

    const saveEdit = () => {
        if (!editingCell) return;

        const newData = [...localData];
        newData[editingCell.rowIdx] = {
            ...newData[editingCell.rowIdx],
            [editingCell.colKey]: editValue // Naive string save, typings might act up in real app specific logic
        };
        setLocalData(newData);
        setEditingCell(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') saveEdit();
        if (e.key === 'Escape') setEditingCell(null);
    };

    // -- Rendering Helpers --

    const getCellClass = (row: any, header: string) => {
        const val = row[header];
        let classes = "p-4 align-middle font-mono text-xs cursor-pointer hover:bg-muted/50 transition-colors border-r last:border-r-0 border-border/50";

        // Apply Rules
        for (const rule of rules) {
            if (rule.column !== header) continue;

            let match = false;
            const checkVal = String(val ?? '').toLowerCase();
            const ruleVal = rule.value.toLowerCase();

            switch (rule.operator) {
                case 'eq': match = checkVal === ruleVal; break;
                case 'contains': match = checkVal.includes(ruleVal); break;
                case 'gt': match = !isNaN(Number(val)) && Number(val) > Number(ruleVal); break;
                case 'lt': match = !isNaN(Number(val)) && Number(val) < Number(ruleVal); break;
            }

            if (match) classes += ` ${rule.value} ${rule.color}`;
        }

        return classes;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content */}
            <Card className="w-full max-w-6xl h-[85vh] flex flex-col relative z-50 border-primary/20 shadow-2xl overflow-hidden bg-background/95 supports-[backdrop-filter]:bg-background/90">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b shrink-0 gap-4">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="bg-primary/10 p-2 rounded-lg shrink-0">
                            <Database className="w-5 h-5 text-primary" />
                        </div>
                        <div className="overflow-hidden">
                            <h2 className="font-semibold text-lg truncate">{datasetName || "Dataset Explorer"}</h2>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <FileText className="w-3 h-3" /> {rowCount} rows
                                </span>
                                <span className="flex items-center gap-1">
                                    <Columns className="w-3 h-3" /> {displayHeaders.length} columns
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="flex items-center gap-2 shrink-0">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className={cn("gap-2", rules.length > 0 && "border-purple-500 text-purple-600 bg-purple-50")}>
                                    <PaintBucket className="w-4 h-4" />
                                    Formatting
                                    {rules.length > 0 && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-[10px] text-white">{rules.length}</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-96 p-4" align="end">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-medium leading-none">Conditional Formatting</h4>
                                        <Button size="sm" variant="ghost" onClick={addRule} className="h-8 w-8 p-0">
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                                        {rules.length === 0 && (
                                            <p className="text-xs text-muted-foreground text-center py-4">No rules applied.</p>
                                        )}
                                        {rules.map((rule) => (
                                            <div key={rule.id} className="grid grid-cols-[1fr,auto] gap-2 items-start p-2 border rounded-md bg-muted/20">
                                                <div className="space-y-2">
                                                    <div className="flex gap-2">
                                                        <Select value={rule.column} onValueChange={(v) => updateRule(rule.id, 'column', v)}>
                                                            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                                                            <SelectContent>
                                                                {displayHeaders.map(h => <SelectItem key={h} value={h} className="text-xs">{h}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                        <Select value={rule.operator} onValueChange={(v) => updateRule(rule.id, 'operator', v as any)}>
                                                            <SelectTrigger className="h-7 text-xs w-[80px]"><SelectValue /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="eq">=</SelectItem>
                                                                <SelectItem value="contains">has</SelectItem>
                                                                <SelectItem value="gt">&gt;</SelectItem>
                                                                <SelectItem value="lt">&lt;</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Input
                                                            className="h-7 text-xs"
                                                            placeholder="Value..."
                                                            value={rule.value}
                                                            onChange={(e) => updateRule(rule.id, 'value', e.target.value)}
                                                        />
                                                        <Select value={rule.color} onValueChange={(v) => updateRule(rule.id, 'color', v)}>
                                                            <SelectTrigger className="h-7 text-xs w-[80px]">
                                                                <div className={cn("w-3 h-3 rounded-full mr-2", rule.color.split(' ')[0].replace('bg-', 'bg-').replace('/40', ''))} />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {COLORS.map(c => (
                                                                    <SelectItem key={c.label} value={c.value} className="text-xs">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className={`w-3 h-3 rounded-full ${c.value.split(' ')[0]}`} />
                                                                            {c.label}
                                                                        </div>
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="sm" onClick={() => removeRule(rule.id)} className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>

                        <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2 hidden sm:flex">
                            <Download className="w-4 h-4" />
                            Export
                        </Button>

                        <Button variant="ghost" size="icon" onClick={handleShare}>
                            <Share2 className="w-4 h-4" />
                        </Button>

                        <div className="h-6 w-px bg-border mx-1" />

                        <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-destructive/10 hover:text-destructive">
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                {/* Table Body */}
                <div className="flex-1 overflow-auto bg-muted/5 relative">
                    {localData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                            <Database className="w-12 h-12 mb-4 opacity-20" />
                            <p>No preview data available</p>
                        </div>
                    ) : (
                        <div className="min-w-full inline-block align-middle">
                            <div className="border rounded-none">
                                <table className="min-w-full divide-y divide-border">
                                    <thead className="bg-background sticky top-0 z-10 shadow-sm">
                                        <tr className="divide-x divide-border">
                                            <th scope="col" className="w-[50px] py-3.5 px-3 text-left text-xs font-semibold text-muted-foreground sticky left-0 bg-background z-20">
                                                #
                                            </th>
                                            {displayHeaders.map((header) => (
                                                <th key={header} scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-foreground min-w-[150px]">
                                                    <div className="flex items-center gap-2">
                                                        {header}
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border bg-card">
                                        {localData.map((row, i) => (
                                            <tr key={i} className="divide-x divide-border">
                                                <td className="sticky left-0 bg-background/50 backdrop-blur whitespace-nowrap py-3 px-4 text-xs font-mono text-muted-foreground/50 w-[50px]">
                                                    {i + 1}
                                                </td>
                                                {displayHeaders.map((header) => {
                                                    const isEditing = editingCell?.rowIdx === i && editingCell?.colKey === header;

                                                    return (
                                                        <td
                                                            key={`${i}-${header}`}
                                                            className={getCellClass(row, header)}
                                                            onClick={() => !isEditing && startEditing(i, header, row[header])}
                                                        >
                                                            {isEditing ? (
                                                                <div className="flex items-center min-w-[120px]">
                                                                    <Input
                                                                        autoFocus
                                                                        className="h-7 text-xs px-1 rounded-sm bg-background shadow-sm border-primary"
                                                                        value={editValue}
                                                                        onChange={(e) => setEditValue(e.target.value)}
                                                                        onKeyDown={handleKeyDown}
                                                                        onBlur={saveEdit}
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <span className="block truncate max-w-[300px]" title={String(row[header] ?? '')}>
                                                                    {typeof row[header] === 'object'
                                                                        ? JSON.stringify(row[header])
                                                                        : String(row[header] ?? '')}
                                                                </span>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer status bar */}
                <div className="bg-muted/40 border-t p-2 px-4 flex justify-between items-center text-[10px] text-muted-foreground shrink-0">
                    <div>
                        {editingCell ? "Editing mode active (Press Enter to save)" : "Click any cell to edit"}
                    </div>
                    <div>
                        {localData.length} records loaded locally
                    </div>
                </div>
            </Card>
        </div>
    );
};
