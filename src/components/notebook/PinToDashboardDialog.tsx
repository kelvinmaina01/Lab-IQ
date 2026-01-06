
import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, LayoutGrid, Check, ChevronRight } from 'lucide-react';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from '@/lib/utils';;

interface PinToDashboardDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultTitle?: string;
    defaultDescription?: string;
    onConfirm: (title: string, description: string, dashboardId: string | null, newDashboardName?: string) => void;
    isPinning: boolean;
}

// Mock dashboards for prototype
const MOCK_DASHBOARDS = [
    { id: 'd1', name: 'Health Dataset Analysis' },
    { id: 'd2', name: 'Offshore production analysis' },
    { id: 'd3', name: 'Conversion rates by marketing channel' },
];

export const PinToDashboardDialog: React.FC<PinToDashboardDialogProps> = ({
    open,
    onOpenChange,
    defaultTitle = '',
    defaultDescription = '',
    onConfirm,
    isPinning
}) => {
    const [title, setTitle] = useState(defaultTitle);
    const [description, setDescription] = useState(defaultDescription);
    const [selectedDashboard, setSelectedDashboard] = useState<string | null>(null);
    const [newDashboardName, setNewDashboardName] = useState('');
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [openCombobox, setOpenCombobox] = useState(false)

    const handleConfirm = () => {
        onConfirm(title, description, selectedDashboard, newDashboardName);
        onOpenChange(false);
    };

    const selectedDashboardName = MOCK_DASHBOARDS.find(d => d.id === selectedDashboard)?.name;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Pin to Dashboard</DialogTitle>
                    <DialogDescription>
                        Save this insight to a dashboard for future monitoring.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">

                    {/* Dashboard Selection */}
                    <div className="grid gap-2">
                        <Label>Target Dashboard</Label>
                        <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openCombobox}
                                    className="w-full justify-between"
                                >
                                    {isCreatingNew ? (
                                        <span className="text-primary font-medium flex items-center gap-2"><Plus className="w-4 h-4" /> New: {newDashboardName || "Untitled"}</span>
                                    ) : selectedDashboard ? (
                                        <span className="flex items-center gap-2"><LayoutGrid className="w-4 h-4" /> {selectedDashboardName}</span>
                                    ) : (
                                        "Select dashboard..."
                                    )}
                                    <ChevronRight className="ml-2 h-4 w-4 shrink-0 opacity-50 rotate-90" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Search dashboards..." />
                                    <CommandList>
                                        <CommandEmpty>No dashboard found.</CommandEmpty>
                                        <CommandGroup>
                                            <CommandItem onSelect={() => {
                                                setIsCreatingNew(true);
                                                setNewDashboardName("Untitled Dashboard");
                                                setSelectedDashboard(null);
                                                setOpenCombobox(false);
                                            }} className="text-primary font-medium cursor-pointer">
                                                <Plus className="mr-2 h-4 w-4" />
                                                Create new dashboard
                                            </CommandItem>
                                            {MOCK_DASHBOARDS.map((dashboard) => (
                                                <CommandItem
                                                    key={dashboard.id}
                                                    value={dashboard.name}
                                                    onSelect={() => {
                                                        setSelectedDashboard(dashboard.id);
                                                        setIsCreatingNew(false);
                                                        setOpenCombobox(false);
                                                    }}
                                                >
                                                    <LayoutGrid className="mr-2 h-4 w-4 opacity-50" />
                                                    {dashboard.name}
                                                    {selectedDashboard === dashboard.id && <Check className="ml-auto h-4 w-4 opacity-100" />}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* If Creating New */}
                    {isCreatingNew && (
                        <div className="grid gap-2 animate-in fade-in slide-in-from-top-2">
                            <Label htmlFor="new-dash-name">Dashboard Name</Label>
                            <Input
                                id="new-dash-name"
                                value={newDashboardName}
                                onChange={(e) => setNewDashboardName(e.target.value)}
                                placeholder="E.g., Production Analysis Q1"
                            />
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="title">Insight Title</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Descriptive title for this insight"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add context about this finding..."
                            className="h-20 resize-none"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleConfirm} disabled={isPinning}>
                        {isPinning ? "Pinning..." : "Pin to Dashboard"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
