import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, GraduationCap, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UpgradeDialog = ({ open, onOpenChange }: UpgradeDialogProps) => {
  const plans = [
    {
      name: "Free",
      icon: Sparkles,
      price: "$0",
      description: "Perfect for getting started",
      features: [
        "Up to 200MB storage",
        "5 datasets",
        "10 experiments",
        "3 automations",
        "2 collaborators",
        "100 AI requests/month",
        "Basic analytics",
      ],
      current: true,
    },
    {
      name: "Pro",
      icon: Crown,
      price: "$49",
      period: "/month",
      description: "For professional researchers",
      features: [
        "Up to 50GB storage",
        "Unlimited datasets",
        "Unlimited experiments",
        "Unlimited automations",
        "20 collaborators",
        "10,000 AI requests/month",
        "Advanced analytics",
        "Priority support",
        "Custom integrations",
        "API access",
      ],
      popular: true,
    },
    {
      name: "Student",
      icon: GraduationCap,
      price: "$4.90",
      period: "/month",
      description: "90% off for verified students",
      features: [
        "All Pro features",
        "Up to 50GB storage",
        "Unlimited datasets",
        "Unlimited experiments",
        "10,000 AI requests/month",
        "Verification required",
      ],
      badge: "90% OFF",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-center mb-2">
            Upgrade Your Research
          </DialogTitle>
          <DialogDescription className="text-center text-lg">
            Choose the plan that fits your needs
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-3 gap-6 mt-6">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.name}
                className={`relative rounded-2xl border-2 p-6 ${
                  plan.popular
                    ? "border-primary shadow-lg scale-105"
                    : "border-border"
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                    Most Popular
                  </Badge>
                )}
                {plan.badge && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent">
                    {plan.badge}
                  </Badge>
                )}

                <div className="flex flex-col items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground text-center mt-1">
                    {plan.description}
                  </p>
                </div>

                <div className="text-center mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className="text-muted-foreground">{plan.period}</span>
                  )}
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  disabled={plan.current}
                >
                  {plan.current ? "Current Plan" : "Upgrade Now"}
                </Button>
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <div className="flex items-start gap-3">
            <GraduationCap className="w-5 h-5 text-primary mt-1" />
            <div>
              <h4 className="font-semibold mb-1">Student Verification</h4>
              <p className="text-sm text-muted-foreground">
                To qualify for the student discount, you'll need to verify your status with a valid .edu email
                or student ID. Verification typically takes 24-48 hours.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
