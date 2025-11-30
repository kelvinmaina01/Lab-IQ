import { Link, useLocation } from "react-router-dom";
import { FlaskConical, Home, Upload, Brain, BarChart3, FlaskConicalIcon, Boxes, Users, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const Sidebar = () => {
  const location = useLocation();

  const navItems = [
    { path: "/dashboard", label: "Overview", icon: Home },
    { path: "/upload", label: "Data Ingestion", icon: Upload },
    { path: "/insights", label: "Interactive AI Agent", icon: Brain },
    { path: "/assistant", label: "Analytics", icon: BarChart3 },
    { path: "/experiments", label: "Experiments", icon: FlaskConicalIcon },
    { path: "/automation", label: "Automation", icon: Boxes },
    { path: "/collaboration", label: "Collaboration", icon: Users },
    { path: "/reports", label: "Reports", icon: FileText },
  ];

  return (
    <div className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-sidebar-background border-r border-sidebar-border flex-col z-40">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-3 p-6 border-b border-sidebar-border">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
          <FlaskConical className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="text-lg font-bold text-sidebar-foreground">LabIQ</div>
          <div className="text-xs text-muted-foreground">Lab OS</div>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path}>
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                  isActive
                    ? "bg-sidebar-accent text-primary font-medium"
                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;
