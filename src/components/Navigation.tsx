import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Activity, TrendingUp, Brain, BarChart3, Zap, FileText, Stethoscope, Workflow, ChevronDown } from "lucide-react";
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
    description: "Intelligent data analysis powered by advanced AI",
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
    description: "Generate comprehensive analysis reports",
    icon: FileText,
  },
  {
    title: "IoT & Device Streams",
    href: "/device-streams",
    description: "Connect and stream data from IoT devices",
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
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <img
                src="/dataiq-logo-transparent.png"
                alt="DataIQ Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              DataIQ
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
                  <div className="w-[340px] p-4">
                    <div className="mb-3 px-2 text-xs font-bold text-muted-foreground tracking-wider">
                      PLATFORM SOLUTIONS
                    </div>
                    <ul className="flex flex-col gap-2">
                      {solutions.map((solution) => (
                        <li key={solution.title}>
                          <NavigationMenuLink asChild>
                            <Link
                              to={solution.href}
                              className={cn(
                                "flex select-none gap-3 rounded-md p-3 leading-none no-underline outline-none transition-colors",
                                "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                              )}
                            >
                              <div className="mt-0.5 p-1 rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                <solution.icon className="h-5 w-5" />
                              </div>
                              <div className="space-y-1.5">
                                <div className="text-sm font-semibold leading-none">
                                  {solution.title}
                                </div>
                                <p className="text-xs leading-snug text-muted-foreground line-clamp-2">
                                  {solution.description}
                                </p>
                              </div>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </div>
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

