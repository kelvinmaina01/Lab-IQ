import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Brain, Database, BarChart3, Mail, Check } from "lucide-react";

interface ProUnlocksDrawerProps {
  onUpgrade: () => void;
}

export const ProUnlocksDrawer = ({ onUpgrade }: ProUnlocksDrawerProps) => {
  const features = [
    {
      icon: Brain,
      title: "Predictive Insight Engine",
      description: "AI forecasts next breakthrough with 89% accuracy"
    },
    {
      icon: Database,
      title: "Unlimited Datasets & Models",
      description: "No caps on storage, experiments, or automations"
    },
    {
      icon: BarChart3,
      title: "Cross-Lab Benchmark Percentile",
      description: "Compare your data analysis performance against industry peers"
    },
    {
      icon: Mail,
      title: "Scheduled PI Summary Exports",
      description: "Auto-generated weekly reports for stakeholders"
    }
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
          <Crown className="w-4 h-4" />
          <span className="text-sm">See Pro Features</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            Pro Unlocks
          </SheetTitle>
          <SheetDescription>
            Unlock the full power of your health data analysis
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm">{feature.title}</h4>
                    <Badge variant="secondary" className="text-xs">Pro</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 space-y-3">
          <Button onClick={onUpgrade} className="w-full gap-2" size="lg">
            <Crown className="w-4 h-4" />
            Upgrade to Pro
          </Button>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Students save 90% • Cancel anytime
            </p>
          </div>

          <div className="pt-4 border-t">
            <h4 className="text-sm font-semibold mb-2">Also includes:</h4>
            <div className="space-y-2">
              {["Priority support", "Advanced analytics", "Team collaboration", "Custom integrations"].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <Check className="w-3 h-3 text-primary" />
                  <span className="text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
