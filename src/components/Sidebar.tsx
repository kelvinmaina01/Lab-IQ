import { Link, useLocation } from "react-router-dom";
import { FlaskConical, Home, Upload, Brain, BarChart3, FlaskConicalIcon, Boxes, Users, FileText, Cpu, Database, ChevronLeft, ChevronRight, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/layout/SidebarContext";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const Sidebar = () => {
  const location = useLocation();
  const { isCollapsed, toggleSidebar } = useSidebar();

  const navItems = [
    { path: "/dashboard", label: "Overview", icon: Home },
    { path: "/datasets", label: "Datasets", icon: Database },
    { path: "/upload", label: "Data Ingestion", icon: Upload },
    { path: "/insights", label: "AI Assistant", icon: Brain },
    { path: "/models", label: "Models", icon: Cpu },
    { path: "/analytics", label: "Analytics", icon: BarChart3 },
    { path: "/experiments", label: "Experiments", icon: FlaskConicalIcon },
    { path: "/automation", label: "Automation", icon: Boxes },
    { path: "/collaboration", label: "Collaboration", icon: Users },
    { path: "/reports", label: "Reports", icon: FileText },
  ];

  return (
    <div
      className={cn(
        "hidden md:flex fixed left-0 top-0 h-screen bg-card/80 backdrop-blur-xl border-r border-border flex-col z-40 transition-all duration-300 ease-in-out shadow-lg",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Header */}
      <div className="h-16 flex items-center px-4 border-b border-border justify-between sticky top-0 bg-card/50 backdrop-blur-sm z-10">
        {!isCollapsed && (
          <Link to="/" className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
              <FlaskConical className="w-5 h-5 text-white" />
            </div>
            <div className="transition-opacity duration-300">
              <div className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">LabIQ</div>
            </div>
          </Link>
        )}
        {isCollapsed && (
          <div className="w-full flex justify-center">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
              <FlaskConical className="w-5 h-5 text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <TooltipProvider delayDuration={0}>
        <nav className="flex-1 p-3 space-y-2 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            if (isCollapsed) {
              return (
                <Tooltip key={item.path}>
                  <TooltipTrigger asChild>
                    <Link to={item.path} className="flex justify-center">
                      <div
                        className={cn(
                          "w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 scale-105"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return (
              <Link key={item.path} to={item.path}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className={cn("w-5 h-5 transition-transform duration-200", isActive && "scale-105")} />
                  <span className="text-sm truncate z-10">{item.label}</span>
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
      </TooltipProvider>

      {/* Footer / Settings */}
      <div className="p-3 border-t border-border mt-auto sticky bottom-0 bg-card z-10">
        <TooltipProvider delayDuration={0}>
          {isCollapsed ? (
            <div className="flex flex-col gap-3 items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link to="/settings">
                    <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl hover:bg-muted">
                      <Settings className="w-5 h-5 text-muted-foreground" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Settings</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    onClick={toggleSidebar}
                    className="w-10 h-10 rounded-xl hover:bg-muted"
                  >
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Expand</TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 px-1">
              <Link to="/settings" className="flex-1">
                <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground px-2">
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="shrink-0 text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          )}
        </TooltipProvider>
      </div>
    </div>
  );
};

export default Sidebar;
