import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Activity, TrendingUp, Brain, BarChart3, Zap, FileText, Stethoscope, Workflow, ChevronDown, Shield, Lock, EyeOff, Database } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

const productItems = [
  { title: "AI Data Ingestion", href: "/upload", description: "Seamless data pipeline with PII scrubbing", icon: Database },
  { title: "Intelligent Assistant", href: "/lab-assistant", description: "AI interface for complex data queries", icon: Brain },
  { title: "Predictive Analytics", href: "/insights", description: "Automated pattern detection and forecasting", icon: TrendingUp },
  { title: "Automated Reporting", href: "/reports", description: "Enterprise-grade PDF and HTML exports", icon: FileText },
];

const securityItems = [
  { title: "HIPAA Readiness", href: "/#security", description: "Health data compliance by design", icon: Shield },
  { title: "SOC 2 Type II", href: "/#security", description: "Rigorous process and data security", icon: Lock },
  { title: "PII Shield", href: "/#security", description: "Automated anonymization and masking", icon: EyeOff },
  { title: "E2E Encryption", href: "/#security", description: "AES-256 safe-state data storage", icon: Zap },
];

const useCaseItems = [
  { title: "Clinical Research", href: "/#use-cases", description: "Advanced scientific data analysis", icon: Stethoscope },
  { title: "Business Intelligence", href: "/#use-cases", description: "Transform operations with data", icon: BarChart3 },
  { title: "IoT Monitoring", href: "/#use-cases", description: "Real-time device stream tracking", icon: Activity },
  { title: "Automated Workflows", href: "/#use-cases", description: "Enterprise process optimization", icon: Workflow },
];

const connectorItems = [
  { title: "Database Gateway", href: "/#connectors", description: "Secure tunnels for SQL sources", icon: Database },
  { title: "Cloud Sync", href: "/#connectors", description: "Google Drive, MS OneDrive/SharePoint", icon: Zap },
  { title: "Mobile IoT Streams", href: "/#connectors", description: "Epic, Cerner, FHIR APIs", icon: Stethoscope },
  { title: "API Hub", href: "/#connectors", description: "Custom webhooks and REST endpoints", icon: Zap },
];

const solutions = [
  {
    title: "AI Assistant",
    href: "/lab-assistant",
    description: "Intelligent data analysis powered by AI",
    icon: Brain,
  },
  {
    title: "Analytics Dashboard",
    href: "/dashboard",
    description: "Real-time insights and visualizations",
    icon: BarChart3,
  },
  {
    title: "ML Models",
    href: "/models",
    description: "Deploy custom machine learning models",
    icon: Zap,
  },
  {
    title: "Reports",
    href: "/reports",
    description: "Generate comprehensive analysis reports",
    icon: FileText,
  },
  {
    title: "IoT Systems",
    href: "/device-streams",
    description: "Connect and stream from IoT devices",
    icon: Stethoscope,
  },
  {
    title: "Automation",
    href: "/automation",
    description: "Automated workflows for processing",
    icon: Workflow,
  },
];

const Navigation = () => {
  return (
    <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-lg border-b border-border z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo and Nav Links */}
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-3 group mr-6">
            <div className="w-10 h-10 flex items-center justify-center transition-transform duration-300 group-hover:rotate-12">
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

          {/* Grouped Navigation Menu */}
          <div className="hidden lg:flex items-center">
            <NavigationMenu>
              <NavigationMenuList className="gap-1 px-2 py-1.5 bg-muted/20 backdrop-blur-sm rounded-full border border-border/50">

                {/* Product Dropdown */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent h-9 px-4 rounded-full hover:bg-background/80 hover:shadow-sm transition-all text-sm font-semibold">
                    Product
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[340px] p-4 bg-background/95 backdrop-blur-md rounded-2xl border border-border shadow-2xl">
                      <div className="mb-3 px-2 text-[10px] font-bold text-primary tracking-[0.2em] uppercase">
                        Product Stack
                      </div>
                      <ul className="flex flex-col gap-1">
                        {productItems.map((item) => (
                          <li key={item.title}>
                            <NavigationMenuLink asChild>
                              <Link
                                to={item.href}
                                className="flex select-none gap-3 rounded-xl p-2.5 leading-none no-underline outline-none transition-all hover:bg-primary/5 group"
                              >
                                <div className="mt-0.5 p-2 rounded-lg bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                  <item.icon className="h-4 w-4" />
                                </div>
                                <div className="space-y-1">
                                  <div className="text-sm font-bold leading-none tracking-tight">
                                    {item.title}
                                  </div>
                                  <p className="text-[11px] leading-snug text-muted-foreground line-clamp-1">
                                    {item.description}
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

                {/* Use Cases Dropdown */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent h-9 px-4 rounded-full hover:bg-background/80 hover:shadow-sm transition-all text-sm font-semibold">
                    Use Cases
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[340px] p-4 bg-background/95 backdrop-blur-md rounded-2xl border border-border shadow-2xl">
                      <div className="mb-3 px-2 text-[10px] font-bold text-primary tracking-[0.2em] uppercase">
                        Industry Solutions
                      </div>
                      <ul className="flex flex-col gap-1">
                        {useCaseItems.map((item) => (
                          <li key={item.title}>
                            <NavigationMenuLink asChild>
                              <Link
                                to={item.href}
                                className="flex select-none gap-3 rounded-xl p-2.5 leading-none no-underline outline-none transition-all hover:bg-primary/5 group"
                              >
                                <div className="mt-0.5 p-2 rounded-lg bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                  <item.icon className="h-4 w-4" />
                                </div>
                                <div className="space-y-1">
                                  <div className="text-sm font-bold leading-none tracking-tight">
                                    {item.title}
                                  </div>
                                  <p className="text-[11px] leading-snug text-muted-foreground line-clamp-1">
                                    {item.description}
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

                {/* Connectors Dropdown */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent h-9 px-4 rounded-full hover:bg-background/80 hover:shadow-sm transition-all text-sm font-semibold">
                    Connectors
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[340px] p-4 bg-background/95 backdrop-blur-md rounded-2xl border border-border shadow-2xl">
                      <div className="mb-3 px-2 text-[10px] font-bold text-primary tracking-[0.2em] uppercase">
                        Data Integrations
                      </div>
                      <ul className="flex flex-col gap-1">
                        {connectorItems.map((item) => (
                          <li key={item.title}>
                            <NavigationMenuLink asChild>
                              <Link
                                to={item.href}
                                className="flex select-none gap-3 rounded-xl p-2.5 leading-none no-underline outline-none transition-all hover:bg-primary/5 group"
                              >
                                <div className="mt-0.5 p-2 rounded-lg bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                  <item.icon className="h-4 w-4" />
                                </div>
                                <div className="space-y-1">
                                  <div className="text-sm font-bold leading-none tracking-tight">
                                    {item.title}
                                  </div>
                                  <p className="text-[11px] leading-snug text-muted-foreground line-clamp-1">
                                    {item.description}
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

                {/* Security Dropdown */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent h-9 px-4 rounded-full hover:bg-background/80 hover:shadow-sm transition-all text-sm font-semibold">
                    Security
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[340px] p-4 bg-background/95 backdrop-blur-md rounded-2xl border border-border shadow-2xl">
                      <div className="mb-3 px-2 text-[10px] font-bold text-primary tracking-[0.2em] uppercase">
                        Security & Trust
                      </div>
                      <ul className="flex flex-col gap-1">
                        {securityItems.map((item) => (
                          <li key={item.title}>
                            <NavigationMenuLink asChild>
                              <Link
                                to={item.href}
                                className="flex select-none gap-3 rounded-xl p-2.5 leading-none no-underline outline-none transition-all hover:bg-primary/5 group"
                              >
                                <div className="mt-0.5 p-2 rounded-lg bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                  <item.icon className="h-4 w-4" />
                                </div>
                                <div className="space-y-1">
                                  <div className="text-sm font-bold leading-none tracking-tight">
                                    {item.title}
                                  </div>
                                  <p className="text-[11px] leading-snug text-muted-foreground line-clamp-1">
                                    {item.description}
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

                {/* Solutions Dropdown */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent h-9 px-4 rounded-full hover:bg-background/80 hover:shadow-sm transition-all text-sm font-semibold">
                    Solutions
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[340px] p-4 bg-background/95 backdrop-blur-md rounded-2xl border border-border shadow-2xl">
                      <div className="mb-3 px-2 text-[10px] font-bold text-primary tracking-[0.2em] uppercase">
                        Specific Utilities
                      </div>
                      <ul className="flex flex-col gap-1">
                        {solutions.map((item) => (
                          <li key={item.title}>
                            <NavigationMenuLink asChild>
                              <Link
                                to={item.href}
                                className="flex select-none gap-3 rounded-xl p-2.5 leading-none no-underline outline-none transition-all hover:bg-primary/5 group"
                              >
                                <div className="mt-0.5 p-2 rounded-lg bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                  <item.icon className="h-4 w-4" />
                                </div>
                                <div className="space-y-1">
                                  <div className="text-sm font-bold leading-none tracking-tight">
                                    {item.title}
                                  </div>
                                  <p className="text-[11px] leading-snug text-muted-foreground line-clamp-1">
                                    {item.description}
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

                {/* Pricing (Direct Link) */}
                <NavigationMenuItem>
                  <Link to="/pricing">
                    <NavigationMenuLink className="flex items-center bg-transparent h-9 px-4 rounded-full hover:bg-background/80 hover:shadow-sm transition-all text-sm font-semibold">
                      Pricing
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>

              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="hidden sm:block">
            <Button variant="ghost" className="text-sm font-bold">Log In</Button>
          </Link>
          <Link to="/signup">
            <Button className="rounded-full px-6 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all hover:scale-105 active:scale-95">
              Get Started Free
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;

