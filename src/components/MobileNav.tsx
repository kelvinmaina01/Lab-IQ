import { Link, useLocation } from "react-router-dom";
import { Home, Upload, Brain, BarChart3, FlaskConicalIcon, Boxes, Users, FileText, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";

const MobileNav = () => {
  const location = useLocation();

  const navItems = [
    { path: "/dashboard", label: "Overview", icon: Home },
    { path: "/upload", label: "Upload", icon: Upload },
    { path: "/insights", label: "AI", icon: Brain },
    { path: "/models", label: "Models", icon: Cpu },
    { path: "/analytics", label: "Analytics", icon: BarChart3 },
    { path: "/experiments", label: "Experiments", icon: FlaskConicalIcon },
    { path: "/automation", label: "Auto", icon: Boxes },
    { path: "/collaboration", label: "Collab", icon: Users },
    { path: "/reports", label: "Reports", icon: FileText },
  ];

  // We might want to show only a subset on mobile or use a scrollable container
  // For now, let's just show the top 5 or make it scrollable
  // The previous code seemed to just map them all.

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <nav className="flex items-center justify-between px-2 overflow-x-auto no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} className="flex-1 min-w-[60px]">
              <div className="flex flex-col items-center justify-center gap-1 py-2">
                <Icon
                  className={cn(
                    "w-5 h-5 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                />
                <span className={cn(
                  "text-[10px] font-medium transition-colors truncate w-full text-center",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default MobileNav;