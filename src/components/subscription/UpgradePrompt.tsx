/**
 * Upgrade Prompt Component
 * Displays when users try to access Pro features without subscription
 */

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Crown,
  Sparkles,
  Lock,
  ArrowRight,
  Check,
  Zap,
  GraduationCap
} from 'lucide-react';

interface UpgradePromptProps {
  feature: string;
  description?: string;
  requiredPlan?: 'pro' | 'team' | 'enterprise';
  variant?: 'inline' | 'modal' | 'banner';
  isOpen?: boolean;
  onClose?: () => void;
}

const PLAN_FEATURES = {
  pro: {
    name: 'Pro',
    price: '$39',
    studentPrice: '$3.90',
    features: [
      '100 datasets',
      '10 GB storage',
      'Full AI analysis (16+ models)',
      'Priority support',
      'Team collaboration (5 members)',
      'API access'
    ]
  },
  team: {
    name: 'Team',
    price: '$119',
    studentPrice: '$11.90',
    features: [
      '500 datasets',
      '50 GB storage',
      'Everything in Pro',
      '25 team members',
      'Phone support',
      '99.5% SLA'
    ]
  },
  enterprise: {
    name: 'Enterprise',
    price: 'Custom',
    studentPrice: 'Custom',
    features: [
      'Unlimited everything',
      'On-premise option',
      'Dedicated support',
      'Custom SLA',
      'SSO/SAML',
      'White-label'
    ]
  }
};

export const UpgradePrompt = ({
  feature,
  description,
  requiredPlan = 'pro',
  variant = 'inline',
  isOpen,
  onClose
}: UpgradePromptProps) => {
  const plan = PLAN_FEATURES[requiredPlan];

  // Inline Card Variant
  if (variant === 'inline') {
    return (
      <Card className="p-6 border-violet-500/30 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-500" />
              {feature} requires {plan.name}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {description || `Upgrade to ${plan.name} to unlock ${feature.toLowerCase()} and more powerful features.`}
            </p>
          </div>
          <Link to="/pricing">
            <Button className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 gap-2">
              <Sparkles className="w-4 h-4" />
              Upgrade to {plan.name}
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  // Banner Variant
  if (variant === 'banner') {
    return (
      <div className="bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 text-white px-4 py-3">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5" />
            <span className="font-medium">
              {feature} is a {plan.name} feature
            </span>
          </div>
          <Link to="/pricing">
            <Button variant="secondary" size="sm" className="bg-white text-violet-600 hover:bg-white/90 gap-2">
              Upgrade Now
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Modal Variant
  if (variant === 'modal') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                <Crown className="w-5 h-5 text-white" />
              </div>
              Upgrade to {plan.name}
            </DialogTitle>
            <DialogDescription>
              {feature} requires a {plan.name} subscription
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Price */}
            <div className="text-center p-4 bg-muted/30 rounded-xl">
              <div className="flex items-center justify-center gap-2">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">billed annually</p>
            </div>

            {/* Features */}
            <div className="space-y-3">
              <p className="text-sm font-medium">What you'll get:</p>
              <ul className="space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Student discount hint */}
            <div className="flex items-center gap-2 p-3 bg-violet-500/10 rounded-lg text-sm">
              <GraduationCap className="w-4 h-4 text-violet-500" />
              <span>Students get 90% off! Only {plan.studentPrice}/mo</span>
            </div>

            {/* CTA */}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Maybe Later
              </Button>
              <Link to="/pricing" className="flex-1">
                <Button className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 gap-2">
                  <Zap className="w-4 h-4" />
                  Upgrade Now
                </Button>
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
};

// Feature Gate HOC - wraps components that require subscription
interface FeatureGateProps {
  children: React.ReactNode;
  feature: string;
  requiredPlan?: 'pro' | 'team' | 'enterprise';
  hasAccess: boolean;
  fallback?: 'blur' | 'lock' | 'hide';
}

export const FeatureGate = ({
  children,
  feature,
  requiredPlan = 'pro',
  hasAccess,
  fallback = 'lock'
}: FeatureGateProps) => {
  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback === 'hide') {
    return null;
  }

  if (fallback === 'blur') {
    return (
      <div className="relative">
        <div className="filter blur-sm pointer-events-none select-none">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-background/50">
          <UpgradePrompt feature={feature} requiredPlan={requiredPlan} variant="inline" />
        </div>
      </div>
    );
  }

  // Default: lock
  return <UpgradePrompt feature={feature} requiredPlan={requiredPlan} variant="inline" />;
};

// Quick access button for upgrade
export const UpgradeButton = ({ className = '' }: { className?: string }) => (
  <Link to="/pricing">
    <Button
      variant="outline"
      size="sm"
      className={`gap-2 border-violet-500/50 text-violet-600 hover:bg-violet-500/10 ${className}`}
    >
      <Crown className="w-4 h-4" />
      Upgrade
    </Button>
  </Link>
);
