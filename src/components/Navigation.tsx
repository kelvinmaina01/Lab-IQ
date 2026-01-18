import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { HeartPulse, Activity, TrendingUp, Brain, BarChart3, Zap, FileText, Stethoscope, Workflow, ChevronDown } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

const solutions = [
  {
    title: "AI Assistant",
    href: "/lab-assistant",
    description: "Intelligent health data analysis powered by advanced AI",
    icon: Brain,
  },
  {
    title: "Analytics Dashboard",
    href: "/dashboard",
    description: "Real-time insights and visualizations for your data",
    icon: BarChart3,
  },
  {
    title: "ML Models",
    href: "/models",
    description: "Train and deploy custom machine learning models",
    icon: Zap,
  },
  {
    title: "Reports",
    href: "/reports",
    description: "Generate comprehensive health analysis reports",
    icon: FileText,
  },
  {
    title: "Medical Devices",
    href: "/device-streams",
    description: "Connect and stream data from medical devices",
    icon: Stethoscope,
  },
  {
    title: "Automation",
    href: "/automation",
    description: "Create automated workflows for data processing",
    icon: Workflow,
  },
];

const Navigation = () => {
  return (
    <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-lg border-b border-border z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo and Nav Links */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <HeartPulse className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              LabIQ Health
            </span>
          </Link>

          {/* Solutions Dropdown */}
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent hover:bg-muted/50 data-[state=open]:bg-muted/50">
                  Solutions
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    {solutions.map((solution) => (
                      <li key={solution.title}>
                        <NavigationMenuLink asChild>
                          <Link
                            to={solution.href}
                            className={cn(
                              "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors",
                              "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <solution.icon className="h-4 w-4 text-primary" />
                              <div className="text-sm font-medium leading-none">
                                {solution.title}
                              </div>
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground mt-1">
                              {solution.description}
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

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

