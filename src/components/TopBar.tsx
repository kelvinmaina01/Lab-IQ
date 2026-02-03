import { Search, Bell, Settings, Sun, Moon, Menu, User, LogOut, TrendingUp, Database, FlaskConical as Flask, Cpu, X, Brain, BarChart3, Zap, FileText, Stethoscope, Workflow, ChevronDown, Shield, Lock, EyeOff, Activity } from "lucide-react";
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
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FlaskConical } from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";

const productItems = [
  { title: "AI Data Ingestion", href: "/upload", description: "Pipeline with PII scrubbing", icon: Database },
  { title: "Intelligent Assistant", href: "/lab-assistant", description: "AI for complex queries", icon: Brain },
  { title: "Predictive Analytics", href: "/insights", description: "Pattern detection", icon: TrendingUp },
  { title: "Automated Reporting", href: "/reports", description: "PDF/HTML exports", icon: FileText },
];

const securityItems = [
  { title: "HIPAA Readiness", href: "/#security", description: "Health data compliance", icon: Shield },
  { title: "SOC 2 Type II", href: "/#security", description: "Process security", icon: Lock },
  { title: "PII Shield", href: "/#security", description: "Auto-anonymization", icon: EyeOff },
  { title: "E2E Encryption", href: "/#security", description: "AES-256 safe-state", icon: Zap },
];

const useCaseItems = [
  { title: "Clinical Research", href: "/#use-cases", description: "Scientific analysis", icon: Stethoscope },
  { title: "Business Intelligence", href: "/#use-cases", description: "Operations tracking", icon: BarChart3 },
  { title: "IoT Monitoring", href: "/#use-cases", description: "Device streams", icon: Activity },
  { title: "Workflows", href: "/#use-cases", description: "Process optimization", icon: Workflow },
];

const connectorItems = [
  { title: "Database Gateway", href: "/#connectors", description: "Secure SQL tunnels", icon: Database },
  { title: "Cloud Sync", href: "/#connectors", description: "GDrive/OneDrive", icon: Zap },
  { title: "Mobile IoT", href: "/#connectors", description: "FHIR APIs", icon: Stethoscope },
  { title: "API Hub", href: "/#connectors", description: "REST endpoints", icon: Zap },
];

const solutions = [
  {
    title: "AI Assistant",
    href: "/lab-assistant",
    description: "Intelligent AI analysis",
    icon: Brain,
  },
  {
    title: "Analytics Dashboard",
    href: "/dashboard",
    description: "Real-time visualizations",
    icon: BarChart3,
  },
  {
    title: "ML Models",
    href: "/models",
    description: "Custom ML models",
    icon: Zap,
  },
  {
    title: "Reports",
    href: "/reports",
    description: "Analysis exports",
    icon: FileText,
  },
];

const dashboardItems = [
  { title: "Datasets", href: "/dashboard", description: "Manage data", icon: Database },
  { title: "Insights", href: "/insights", description: "Analysis results", icon: Brain },
  { title: "Experiments", href: "/experiments", description: "Track models", icon: Flask },
  { title: "Reports", href: "/reports", description: "PDF/HTML exports", icon: FileText },
];

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
      <div className="hidden md:flex flex-1 max-w-sm lg:max-w-md" ref={searchRef}>
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
          <Input
            placeholder="Search..."
            className="pl-10 pr-10 bg-card border-border h-9 text-sm"
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
            <Card className="absolute top-full mt-2 w-full max-h-96 overflow-y-auto shadow-lg border z-50">
              {searching ? (
                <div className="p-4 text-center">
                  <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"></div>
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
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </Card>
          )}
        </div>
      </div>

      {/* Refined Navigation Group */}
      <div className="hidden md:flex flex-1 justify-center max-w-2xl px-4">
        <NavigationMenu>
          <NavigationMenuList className="gap-1 px-2 py-1 bg-muted/20 backdrop-blur-sm rounded-full border border-border/40">

            {/* Product Dropdown */}
            <NavigationMenuItem>
              <NavigationMenuTrigger className="bg-transparent h-8 px-3 rounded-full hover:bg-background/80 text-[11px] font-bold uppercase tracking-wider">
                Product
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="w-[280px] p-2 bg-background/95 backdrop-blur-md rounded-xl border border-border shadow-xl">
                  <ul className="flex flex-col gap-0.5">
                    {productItems.map((item) => (
                      <li key={item.title}>
                        <NavigationMenuLink asChild>
                          <Link
                            to={item.href}
                            className="flex select-none gap-2.5 rounded-lg p-2 leading-none no-underline outline-none transition-all hover:bg-primary/5 group"
                          >
                            <div className="p-1.5 rounded-md bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                              <item.icon className="h-3.5 w-3.5" />
                            </div>
                            <div className="space-y-0.5">
                              <div className="text-[11px] font-bold leading-none">{item.title}</div>
                              <p className="text-[9px] text-muted-foreground line-clamp-1">{item.description}</p>
                            </div>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Use Cases Dropdown */}
            <NavigationMenuItem>
              <NavigationMenuTrigger className="bg-transparent h-8 px-3 rounded-full hover:bg-background/80 text-[11px] font-bold uppercase tracking-wider">
                Use Cases
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="w-[280px] p-2 bg-background/95 backdrop-blur-md rounded-xl border border-border shadow-xl">
                  <ul className="flex flex-col gap-0.5">
                    {useCaseItems.map((item) => (
                      <li key={item.title}>
                        <NavigationMenuLink asChild>
                          <Link
                            to={item.href}
                            className="flex select-none gap-2.5 rounded-lg p-2 leading-none no-underline outline-none transition-all hover:bg-primary/5 group"
                          >
                            <div className="p-1.5 rounded-md bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                              <item.icon className="h-3.5 w-3.5" />
                            </div>
                            <div className="space-y-0.5">
                              <div className="text-[11px] font-bold leading-none">{item.title}</div>
                              <p className="text-[9px] text-muted-foreground line-clamp-1">{item.description}</p>
                            </div>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Connectors Dropdown */}
            <NavigationMenuItem>
              <NavigationMenuTrigger className="bg-transparent h-8 px-3 rounded-full hover:bg-background/80 text-[11px] font-bold uppercase tracking-wider">
                Connectors
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="w-[280px] p-2 bg-background/95 backdrop-blur-md rounded-xl border border-border shadow-xl">
                  <ul className="flex flex-col gap-0.5">
                    {connectorItems.map((item) => (
                      <li key={item.title}>
                        <NavigationMenuLink asChild>
                          <Link
                            to={item.href}
                            className="flex select-none gap-2.5 rounded-lg p-2 leading-none no-underline outline-none transition-all hover:bg-primary/5 group"
                          >
                            <div className="p-1.5 rounded-md bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                              <item.icon className="h-3.5 w-3.5" />
                            </div>
                            <div className="space-y-0.5">
                              <div className="text-[11px] font-bold leading-none">{item.title}</div>
                              <p className="text-[9px] text-muted-foreground line-clamp-1">{item.description}</p>
                            </div>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Security Dropdown */}
            <NavigationMenuItem>
              <NavigationMenuTrigger className="bg-transparent h-8 px-3 rounded-full hover:bg-background/80 text-[11px] font-bold uppercase tracking-wider">
                Security
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="w-[280px] p-2 bg-background/95 backdrop-blur-md rounded-xl border border-border shadow-xl">
                  <ul className="flex flex-col gap-0.5">
                    {securityItems.map((item) => (
                      <li key={item.title}>
                        <NavigationMenuLink asChild>
                          <Link
                            to={item.href}
                            className="flex select-none gap-2.5 rounded-lg p-2 leading-none no-underline outline-none transition-all hover:bg-primary/5 group"
                          >
                            <div className="p-1.5 rounded-md bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                              <item.icon className="h-3.5 w-3.5" />
                            </div>
                            <div className="space-y-0.5">
                              <div className="text-[11px] font-bold leading-none">{item.title}</div>
                              <p className="text-[9px] text-muted-foreground line-clamp-1">{item.description}</p>
                            </div>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Solutions Dropdown */}
            <NavigationMenuItem>
              <NavigationMenuTrigger className="bg-transparent h-8 px-3 rounded-full hover:bg-background/80 text-[11px] font-bold uppercase tracking-wider">
                Solutions
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="w-[280px] p-2 bg-background/95 backdrop-blur-md rounded-xl border border-border shadow-xl">
                  <ul className="flex flex-col gap-0.5">
                    {solutions.map((item) => (
                      <li key={item.title}>
                        <NavigationMenuLink asChild>
                          <Link
                            to={item.href}
                            className="flex select-none gap-2.5 rounded-lg p-2 leading-none no-underline outline-none transition-all hover:bg-primary/5 group"
                          >
                            <div className="p-1.5 rounded-md bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                              <item.icon className="h-3.5 w-3.5" />
                            </div>
                            <div className="space-y-0.5">
                              <div className="text-[11px] font-bold leading-none">{item.title}</div>
                              <p className="text-[9px] text-muted-foreground line-clamp-1">{item.description}</p>
                            </div>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Pricing (Direct Link) */}
            <NavigationMenuItem>
              <Link to="/pricing">
                <NavigationMenuLink className="flex items-center bg-transparent h-8 px-3 rounded-full hover:bg-background/80 text-[11px] font-bold uppercase tracking-wider">
                  Pricing
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>

          </NavigationMenuList>
        </NavigationMenu>
      </div>

      {/* Actions Area */}
      <div className="flex items-center gap-2">
        {/* Mobile Search */}
        <Button variant="ghost" size="icon" className="md:hidden">
          <Search className="w-5 h-5" />
        </Button>

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
