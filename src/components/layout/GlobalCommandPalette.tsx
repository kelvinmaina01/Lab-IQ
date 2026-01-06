import { useState, useEffect } from "react";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import {
    FlaskConical,
    FileText,
    Users,
    MessageSquare,
    Plus,
    Mail,
    Moon,
    Sun,
    LayoutDashboard,
    Settings,
    Search
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useServices } from "@/core/ServiceProvider";

export const GlobalCommandPalette = () => {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    // Theme handling attempt - if useTheme doesn't exist we'll skip or mock
    // For now, let's assume standard vite-shadcn theme setup or just toggle class
    // Checking previous files, I haven't seen an explicit ThemeProvider context usage in viewed files, 
    // but standard shadcn adds it. Let's try to be safe.

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const runCommand = (command: () => void) => {
        setOpen(false);
        command();
    };

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput placeholder="Type a command or search..." />
            <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>

                <CommandGroup heading="Navigation">
                    <CommandItem onSelect={() => runCommand(() => navigate("/"))}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/experiments"))}>
                        <FlaskConical className="mr-2 h-4 w-4" />
                        Experiments
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/projects"))}>
                        <FileText className="mr-2 h-4 w-4" />
                        Projects
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/collaboration"))}>
                        <Users className="mr-2 h-4 w-4" />
                        Collaboration Team
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/collaboration?tab=chat"))}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Team Chat
                    </CommandItem>
                </CommandGroup>

                <CommandSeparator />

                <CommandGroup heading="Quick Actions">
                    <CommandItem onSelect={() => runCommand(() => navigate("/experiments?new=true"))}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Experiment
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/collaboration?action=invite"))}>
                        <Mail className="mr-2 h-4 w-4" />
                        Invite Member
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/settings"))}>
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                    </CommandItem>
                </CommandGroup>

                <CommandSeparator />

                <CommandGroup heading="Theme">
                    <CommandItem onSelect={() => runCommand(() => document.documentElement.classList.add('dark'))}>
                        <Moon className="mr-2 h-4 w-4" />
                        Dark Mode
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => document.documentElement.classList.remove('dark'))}>
                        <Sun className="mr-2 h-4 w-4" />
                        Light Mode
                    </CommandItem>
                </CommandGroup>

            </CommandList>
        </CommandDialog>
    );
};
