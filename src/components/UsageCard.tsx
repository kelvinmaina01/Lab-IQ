import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Crown, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface UsageCardProps {
  title: string;
  used: number;
  limit: number;
  unit: string;
  onUpgrade: () => void;
  isPro: boolean;
}

export const UsageCard = ({ title, used, limit, unit, onUpgrade, isPro }: UsageCardProps) => {
  const percentage = (used / limit) * 100;
  const isNearLimit = percentage >= 80;

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {used.toFixed(1)} / {limit} {unit}
          </p>
        </div>
        {isPro && (
          <Badge variant="secondary" className="gap-1">
            <Crown className="w-3 h-3" />
            Pro
          </Badge>
        )}
      </div>

      <Progress value={percentage} className="mb-4" />

      {isNearLimit && !isPro && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg">
          <TrendingUp className="w-4 h-4 text-destructive" />
          <p className="text-xs text-destructive flex-1">
            You're approaching your limit
          </p>
          <Button size="sm" variant="outline" onClick={onUpgrade}>
            Upgrade
          </Button>
        </div>
      )}
    </Card>
  );
};
