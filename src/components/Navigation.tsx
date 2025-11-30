import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FlaskConical, LayoutDashboard, Upload, BarChart3, Settings, Sparkles } from "lucide-react";

const Navigation = () => {
  const location = useLocation();
  
  const navItems = [
    { path: "/", label: "Home", icon: FlaskConical },
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/upload", label: "Upload Data", icon: Upload },
    { path: "/insights", label: "Insights", icon: BarChart3 },
    { path: "/assistant", label: "AI Assistant", icon: Sparkles },
  ];

  return (
    <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-lg border-b border-border z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <FlaskConical className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            LabIQ
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className="gap-2"
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </div>

        <Button size="sm" className="gap-2">
          <Settings className="w-4 h-4" />
          Settings
        </Button>
      </div>
    </nav>
  );
};

export default Navigation;
