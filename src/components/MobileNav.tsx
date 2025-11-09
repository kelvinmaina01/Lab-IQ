import { Link, useLocation } from "react-router-dom";
import { Home, Upload, Brain, BarChart3, FlaskConicalIcon, Boxes, Users, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const MobileNav = () => {
  const location = useLocation();

  const navItems = [
    { path: "/dashboard", label: "Home", icon: Home },
    { path: "/upload", label: "Upload", icon: Upload },
    { path: "/insights", label: "AI", icon: Brain },
    { path: "/experiments", label: "Labs", icon: FlaskConicalIcon },
    { path: "/reports", label: "Reports", icon: FileText },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-bottom">
      <nav className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} className="flex-1">
              <div className="flex flex-col items-center justify-center gap-1 py-2">
                <Icon 
                  className={cn(
                    "w-5 h-5 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )} 
                />
                <span className={cn(
                  "text-xs font-medium transition-colors",
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