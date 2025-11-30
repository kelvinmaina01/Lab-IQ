import React, { useState, useMemo } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
    ChevronLeft,
    ChevronRight,
    Columns,
    Search,
    Download,
    Maximize2,
    MoreHorizontal,
    ArrowUpDown,
    Filter
} from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, Cell } from "recharts";

interface ColumnSchema {
    id: string;
    column_name: string;
    data_type: string;
    stats?: any;
    unique_values_count?: number;
    nullable?: boolean;
}

interface DataExplorerProps {
    data: any[];
    columns: ColumnSchema[];
    loading?: boolean;
    fileName?: string;
}

export const DataExplorer = ({ data, columns, loading, fileName }: DataExplorerProps) => {
    const [pageSize, setPageSize] = useState(50);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
        new Set(columns.map(c => c.column_name))
    );
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    // Filter and Sort Data
    const processedData = useMemo(() => {
        let filtered = data;

        // 1. Search
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(row =>
                Object.values(row).some(val =>
                    String(val).toLowerCase().includes(lowerTerm)
                )
            );
        }

        // 2. Sort
        if (sortConfig) {
            filtered = [...filtered].sort((a, b) => {
                const aVal = a[sortConfig.key];
                const bVal = b[sortConfig.key];

                if (aVal === bVal) return 0;
                if (aVal === null || aVal === undefined) return 1;
                if (bVal === null || bVal === undefined) return -1;

                const comparison = aVal < bVal ? -1 : 1;
                return sortConfig.direction === 'asc' ? comparison : -comparison;
            });
        }

        return filtered;
    }, [data, searchTerm, sortConfig]);

    // Pagination
    const totalPages = Math.ceil(processedData.length / pageSize);
    const paginatedData = processedData.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const handleSort = (columnName: string) => {
        setSortConfig(current => ({
            key: columnName,
            direction: current?.key === columnName && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const toggleColumn = (columnName: string) => {
        const newSet = new Set(visibleColumns);
        if (newSet.has(columnName)) {
            newSet.delete(columnName);
        } else {
            newSet.add(columnName);
        }
        setVisibleColumns(newSet);
    };

    // Mini Histogram Component for Headers
    const ColumnDistribution = ({ stats }: { stats: any }) => {
        if (!stats?.distribution) return null;

        // Take first 10 bins/categories
        const data = stats.distribution.slice(0, 15).map((d: any) => ({
            name: d.value,
            value: d.count
        }));

        return (
            <div className="h-8 w-24 mt-1 opacity-50 hover:opacity-100 transition-opacity">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <Bar dataKey="value" fill="currentColor" radius={[1, 1, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        );
    };

    if (loading) {
        return <div className="h-96 flex items-center justify-center text-muted-foreground">Loading data explorer...</div>;
    }

    return (
        <div className="space-y-4 animate-fade-in">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-card p-4 rounded-lg border shadow-sm">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search data..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" title="Columns">
                                <Columns className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56 max-h-96 overflow-y-auto">
                            <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {columns.map((col) => (
                                <DropdownMenuCheckboxItem
                                    key={col.id}
                                    checked={visibleColumns.has(col.column_name)}
                                    onCheckedChange={() => toggleColumn(col.column_name)}
                                >
                                    {col.column_name}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="outline" size="icon" title="Filter">
                        <Filter className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Show:</span>
                        <select
                            className="bg-transparent border rounded px-2 py-1"
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                        >
                            <option value={10}>10</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                            <option value={500}>500</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm min-w-[3rem] text-center">
                            {currentPage} / {totalPages || 1}
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2">
                        <Download className="h-4 w-4" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Main Grid */}
            <div className="border rounded-lg bg-card shadow-sm overflow-hidden flex flex-col h-[600px]">
                <ScrollArea className="flex-1 w-full">
                    <div className="min-w-max">
                        <Table>
                            <TableHeader className="sticky top-0 z-10 bg-card shadow-sm">
                                <TableRow className="hover:bg-transparent border-b-2 border-border">
                                    <TableHead className="w-[60px] text-center bg-card">#</TableHead>
                                    {columns.filter(c => visibleColumns.has(c.column_name)).map((col) => (
                                        <TableHead key={col.id} className="min-w-[180px] bg-card p-4">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center justify-between gap-2 group">
                                                    <span className="font-semibold text-foreground truncate" title={col.column_name}>
                                                        {col.column_name}
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => handleSort(col.column_name)}
                                                    >
                                                        <ArrowUpDown className="h-3 w-3" />
                                                    </Button>
                                                </div>

                                                {/* Column Metadata */}
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 font-mono">
                                                        {col.data_type}
                                                    </Badge>
                                                    <span>{col.unique_values_count} unique</span>
                                                </div>

                                                {/* Mini Distribution Chart */}
                                                {col.stats && (
                                                    <div className="text-primary/50">
                                                        <ColumnDistribution stats={col.stats} />
                                                    </div>
                                                )}
                                            </div>
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedData.length > 0 ? (
                                    paginatedData.map((row, idx) => (
                                        <TableRow key={idx} className="hover:bg-muted/50 transition-colors">
                                            <TableCell className="text-center font-mono text-xs text-muted-foreground bg-muted/20 w-[60px]">
                                                {(currentPage - 1) * pageSize + idx + 1}
                                            </TableCell>
                                            {columns.filter(c => visibleColumns.has(c.column_name)).map((col) => {
                                                const val = row[col.column_name];
                                                const isNull = val === null || val === undefined || val === "";

                                                return (
                                                    <TableCell key={col.id} className="p-3">
                                                        {isNull ? (
                                                            <span className="text-xs text-destructive/50 italic bg-destructive/5 px-1.5 py-0.5 rounded">
                                                                null
                                                            </span>
                                                        ) : (
                                                            <span className={`text-sm ${typeof val === 'number' ? 'font-mono' : ''}`}>
                                                                {typeof val === 'boolean' ? (
                                                                    <Badge variant={val ? "default" : "secondary"} className="text-[10px]">
                                                                        {String(val)}
                                                                    </Badge>
                                                                ) : (
                                                                    String(val).length > 50
                                                                        ? <span title={String(val)}>{String(val).substring(0, 50)}...</span>
                                                                        : String(val)
                                                                )}
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                );
                                            })}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={columns.length + 1} className="h-32 text-center text-muted-foreground">
                                            No data found matching your search.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </div>

            <div className="text-xs text-muted-foreground text-right">
                Showing {paginatedData.length} of {processedData.length} rows
            </div>
        </div>
    );
};
