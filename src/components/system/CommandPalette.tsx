"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { nativeNavigate } from "@/lib/utils";
import { 
    Calendar, 
    CheckSquare, 
    FileText, 
    LayoutDashboard, 
    Package, 
    Plus, 
    Search, 
    Users, 
    Bell
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import { CanonicalDataService } from "@/services/canonicalDataService";
import useDebouncedValue from "@/hooks/useDebouncedValue";

export type Command = {
    id: string;
    label: string;
    shortcut?: string;
    run: () => void;
};

interface CommandPaletteProps {
    open: boolean;
    onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
    const router = useRouter();
    const [search, setSearch] = React.useState("");
    const debouncedSearch = useDebouncedValue(search, 300);

    const { data: results, isLoading } = useQuery({
        queryKey: ["global-search", debouncedSearch],
        queryFn: () => CanonicalDataService.globalSearch(debouncedSearch),
        enabled: open && debouncedSearch.length >= 2,
    });

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                // Handled in ShellCommands, but good to have here as secondary toggle
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const onSelect = (callback: () => void) => {
        callback();
        onClose();
        setSearch("");
    };

    return (
        <CommandDialog open={open} onOpenChange={onClose}>
            <CommandInput 
                placeholder="Type a command or search..." 
                value={search}
                onValueChange={setSearch}
            />
            <CommandList className="max-h-[450px]">
                <CommandEmpty>No results found.</CommandEmpty>
                
                {/* Static Commands filtered by cmdk internally when search is small */}
                {search.length < 2 && (
                    <>
                        <CommandGroup heading="Quick Actions">
                            <CommandItem onSelect={() => onSelect(() => window.dispatchEvent(new CustomEvent('open-new-task')))}>
                                <Plus className="mr-2 h-4 w-4" />
                                <span>Create Task</span>
                            </CommandItem>
                            <CommandItem onSelect={() => onSelect(() => nativeNavigate("/events", router))}>
                                <Plus className="mr-2 h-4 w-4" />
                                <span>Create Event</span>
                            </CommandItem>
                            <CommandItem onSelect={() => onSelect(() => nativeNavigate("/campaigns", router))}>
                                <Plus className="mr-2 h-4 w-4" />
                                <span>Create Campaign</span>
                            </CommandItem>
                            <CommandItem onSelect={() => onSelect(() => nativeNavigate("/notifications", router))}>
                                <Bell className="mr-2 h-4 w-4" />
                                <span>Notify Team</span>
                            </CommandItem>
                        </CommandGroup>
                        <CommandSeparator />
                        <CommandGroup heading="Navigation">
                            <CommandItem onSelect={() => onSelect(() => nativeNavigate("/home", router))}>
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                <span>Dashboard</span>
                            </CommandItem>
                            <CommandItem onSelect={() => onSelect(() => nativeNavigate("/tasks", router))}>
                                <CheckSquare className="mr-2 h-4 w-4" />
                                <span>Tasks</span>
                            </CommandItem>
                            <CommandItem onSelect={() => onSelect(() => nativeNavigate("/chat", router))}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-square mr-2 h-4 w-4"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                                <span>Chat</span>
                            </CommandItem>
                            <CommandItem onSelect={() => onSelect(() => nativeNavigate("/events", router))}>
                                <Calendar className="mr-2 h-4 w-4" />
                                <span>Events</span>
                            </CommandItem>
                            <CommandItem onSelect={() => onSelect(() => nativeNavigate("/inventory", router))}>
                                <Package className="mr-2 h-4 w-4" />
                                <span>Inventory</span>
                            </CommandItem>
                            <CommandItem onSelect={() => onSelect(() => nativeNavigate("/reports", router))}>
                                <FileText className="mr-2 h-4 w-4" />
                                <span>Reports</span>
                            </CommandItem>
                        </CommandGroup>
                    </>
                )}

                {/* Search Results */}
                {search.length >= 2 && (
                    <>
                        {isLoading && <div className="p-4 text-sm text-center text-muted-foreground">Searching...</div>}
                        
                        {results?.tasks && results.tasks.length > 0 && (
                            <CommandGroup heading="Tasks">
                                {results.tasks.map((task) => (
                                    <CommandItem 
                                        key={task.id} 
                                        onSelect={() => onSelect(() => nativeNavigate(`/tasks/${task.id}`, router))}
                                    >
                                        <CheckSquare className="mr-2 h-4 w-4" />
                                        <span>{task.title}</span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}

                        {results?.events && results.events.length > 0 && (
                            <CommandGroup heading="Events">
                                {results.events.map((event) => (
                                    <CommandItem 
                                        key={event.id} 
                                        onSelect={() => onSelect(() => nativeNavigate(`/events/${event.id}`, router))}
                                    >
                                        <Calendar className="mr-2 h-4 w-4" />
                                        <span>{event.title}</span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}

                        {results?.inventory && results.inventory.length > 0 && (
                            <CommandGroup heading="Equipment">
                                {results.inventory.map((item) => (
                                    <CommandItem 
                                        key={item.id} 
                                        onSelect={() => onSelect(() => nativeNavigate(`/inventory/${item.id}`, router))}
                                    >
                                        <Package className="mr-2 h-4 w-4" />
                                        <span>{item.name}</span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}

                        {results?.users && results.users.length > 0 && (
                            <CommandGroup heading="Users">
                                {results.users.map((user) => (
                                    <CommandItem 
                                        key={user.id} 
                                        onSelect={() => onSelect(() => nativeNavigate(`/profiles/${user.id}`, router))}
                                    >
                                        <Users className="mr-2 h-4 w-4" />
                                        <span>{user.full_name}</span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                    </>
                )}
            </CommandList>
        </CommandDialog>
    );
}
