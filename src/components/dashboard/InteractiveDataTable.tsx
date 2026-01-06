/**
 * Interactive Data Table Component
 * Julius AI-style table with:
 * - Pagination (Page 1 of X, Next/Previous)
 * - Export to Google Sheets / CSV
 * - Column sorting
 * - Row count display
 */

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    ChevronLeft,
    ChevronRight,
    Download,
    Table as TableIcon,
    ArrowUpRight,
    FileSpreadsheet,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DataTableProps {
    data: Record<string, any>[];
    columns?: string[];
    title?: string;
    pageSize?: number;
    showExport?: boolean;
}

export function InteractiveDataTable({
    data,
    columns,
    title,
    pageSize = 5,
    showExport = true
}: DataTableProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const { toast } = useToast();

    // Derive columns from data if not provided
    const tableColumns = useMemo(() => {
        if (columns) return columns;
        if (data.length === 0) return [];
        return Object.keys(data[0]);
    }, [data, columns]);

    // Sort data
    const sortedData = useMemo(() => {
        if (!sortColumn) return data;
        return [...data].sort((a, b) => {
            const aVal = a[sortColumn];
            const bVal = b[sortColumn];
            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data, sortColumn, sortDirection]);

    // Pagination
    const totalPages = Math.ceil(sortedData.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedData = sortedData.slice(startIndex, startIndex + pageSize);

    // Format column header
    const formatColumnHeader = (col: string) => {
        return col
            .replace(/_/g, ' ')
            .replace(/([A-Z])/g, ' $1')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ')
            .trim();
    };

    // Handle sort
    const handleSort = (column: string) => {
        if (sortColumn === column) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    // Export to CSV
    const handleExportCSV = () => {
        const headers = tableColumns.join(',');
        const rows = data.map(row =>
            tableColumns.map(col => {
                const val = row[col];
                // Escape commas and quotes
                if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
                    return `"${val.replace(/"/g, '""')}"`;
                }
                return val;
            }).join(',')
        );
        const csv = [headers, ...rows].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title || 'data'}_export.csv`;
        a.click();
        URL.revokeObjectURL(url);

        toast({
            title: "Export Complete",
            description: `Exported ${data.length} rows to CSV`,
        });
    };

    if (!data.length) {
        return (
            <Card className="p-8 text-center text-muted-foreground">
                <TableIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No data available</p>
            </Card>
        );
    }

    return (
        <Card className="overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                <div className="flex items-center gap-2">
                    <TableIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                        {tableColumns.length} cols, {paginatedData.length} rows returned
                    </span>
                </div>

                {showExport && (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1 text-xs"
                            onClick={handleExportCSV}
                        >
                            <FileSpreadsheet className="h-3.5 w-3.5" />
                            Google Sheets
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={handleExportCSV}
                        >
                            <Download className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                        >
                            <ArrowUpRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b">
                            {/* Row number column */}
                            <th className="px-4 py-3 text-left text-muted-foreground w-12">
                                <span className="sr-only">Row</span>
                            </th>
                            {tableColumns.map((col) => (
                                <th
                                    key={col}
                                    className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors whitespace-nowrap"
                                    onClick={() => handleSort(col)}
                                >
                                    <div className="flex items-center gap-1">
                                        {formatColumnHeader(col)}
                                        {sortColumn === col && (
                                            sortDirection === 'asc'
                                                ? <ChevronUp className="h-3 w-3" />
                                                : <ChevronDown className="h-3 w-3" />
                                        )}
                                        {sortColumn !== col && (
                                            <ChevronDown className="h-3 w-3 opacity-0 group-hover:opacity-50" />
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.map((row, rowIdx) => (
                            <tr
                                key={rowIdx}
                                className="border-b hover:bg-muted/20 transition-colors"
                            >
                                <td className="px-4 py-3 text-muted-foreground text-center">
                                    {startIndex + rowIdx + 1}
                                </td>
                                {tableColumns.map((col) => (
                                    <td key={col} className="px-4 py-3 whitespace-nowrap">
                                        {formatCellValue(row[col])}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {
                totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
                        <span className="text-sm text-muted-foreground">
                            Total results: {data.length} rows × {tableColumns.length} columns
                        </span>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Previous
                            </Button>
                            <span className="text-sm">
                                Page {currentPage} of {totalPages}
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                            >
                                Next
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                )
            }
        </Card >
    );
}

// Helper to format cell values
function formatCellValue(value: any): string {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'number') {
        if (Number.isInteger(value)) return value.toLocaleString();
        return value.toFixed(2);
    }
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (value instanceof Date) return value.toLocaleDateString();
    return String(value);
}

export default InteractiveDataTable;
