import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FlaskConical, Activity, TrendingUp } from "lucide-react";

const Navigation = () => {
  return (
    <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-lg border-b border-border z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <FlaskConical className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            LabIQ
          </span>
        </Link>

        {/* Navigation Actions */}
        <div className="flex items-center gap-2">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <Activity className="w-4 h-4" />
              Dashboard
            </Button>
          </Link>

          <Link to="/pricing">
            <Button variant="ghost" size="sm" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Pricing
            </Button>
          </Link>

          <Link to="/dashboard">
            <Button size="sm" className="gap-2">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
