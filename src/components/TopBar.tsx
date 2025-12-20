import { Search, Bell, Settings, Sun, Moon, Menu, User, LogOut, TrendingUp, Database, FlaskConical as Flask, Cpu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FlaskConical } from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";

const TopBar = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      navigate("/");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  // Search function
  const performSearch = async (query: string) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setSearching(true);
    setShowResults(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const results: any[] = [];

      // Search datasets
      const { data: datasets } = await supabase
        .from('datasets')
        .select('id, name, file_name, created_at')
        .eq('user_id', user.id)
        .or(`name.ilike.%${query}%,file_name.ilike.%${query}%`)
        .limit(5);

      if (datasets) {
        results.push(...datasets.map(d => ({
          ...d,
          type: 'dataset',
          icon: Database,
          path: `/dashboard/datasets/${d.id}`
        })));
      }

      // Search experiments (if table exists)
      try {
        const { data: experiments } = await supabase
          .from('experiments')
          .select('id, name, created_at')
          .eq('user_id', user.id)
          .ilike('name', `%${query}%`)
          .limit(5);

        if (experiments) {
          results.push(...experiments.map(e => ({
            ...e,
            type: 'experiment',
            icon: Flask,
            path: `/experiments/${e.id}`
          })));
        }
      } catch (e) {
        // Table might not exist yet
      }

      // Search models (if table exists)
      try {
        const { data: models } = await supabase
          .from('ml_models')
          .select('id, model_name, created_at')
          .eq('user_id', user.id)
          .ilike('model_name', `%${query}%`)
          .limit(5);

        if (models) {
          results.push(...models.map(m => ({
            ...m,
            name: m.model_name,
            type: 'model',
            icon: Cpu,
            path: `/models/${m.id}`
          })));
        }
      } catch (e) {
        // Table might not exist yet
      }

      setSearchResults(results);

    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        performSearch(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResultClick = (path: string) => {
    setShowResults(false);
    setSearchQuery("");
    navigate(path);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
  };

  return (
    <div className="h-16 border-b border-border bg-background/80 backdrop-blur-lg flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
      {/* Search Bar (Desktop) */}
      <div className="hidden md:flex flex-1 max-w-xl mx-6" ref={searchRef}>
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
          <Input
            placeholder="Search datasets, experiments, models..."
            className="pl-10 pr-10 bg-card border-border"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery && setShowResults(true)}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={clearSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          )}

          {/* Search Results Dropdown */}
          {showResults && (
            <Card className="absolute top-full mt-2 w-full max-h-96 overflow-y-auto shadow-lg border">
              {searching ? (
                <div className="p-4 text-center">
                  <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"></div>
                  <p className="text-sm text-muted-foreground mt-2">Searching...</p>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="py-2">
                  {searchResults.map((result, idx) => {
                    const Icon = result.icon;
                    return (
                      <button
                        key={idx}
                        className="w-full px-4 py-3 hover:bg-muted flex items-center gap-3 text-left transition-colors"
                        onClick={() => handleResultClick(result.path)}
                      >
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{result.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{result.type}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(result.created_at).toLocaleDateString()}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : searchQuery.length >= 2 ? (
                <div className="p-8 text-center">
                  <Search className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground">No results found for "{searchQuery}"</p>
                  <p className="text-xs text-muted-foreground mt-1">Try a different search term</p>
                </div>
              ) : null}
            </Card>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Mobile Search */}
        <Button variant="ghost" size="icon" className="md:hidden">
          <Search className="w-5 h-5" />
        </Button>

        {/* Pricing Link (Desktop) */}
        <Link to="/pricing" className="hidden md:block">
          <Button variant="ghost" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            <span className="font-medium">Pricing</span>
          </Button>
        </Link>

        {/* Dark Mode Toggle */}
        <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>

        {/* Notifications */}
        <NotificationBell />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-sm">
                  U
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings/profile')}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings/notifications')}>
              <Bell className="mr-2 h-4 w-4" />
              <span>Notifications</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default TopBar;
