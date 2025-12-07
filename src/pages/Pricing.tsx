import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import {
    CheckCircle2,
    Zap,
    Rocket,
    Building2,
    Users,
    Database,
    Shield,
    HeadphonesIcon,
    MessageSquare,
    ArrowRight,
    Sparkles,
    TrendingUp
} from "lucide-react";

const Pricing = () => {
    const tiers = [
        {
            name: "Free",
            description: "Perfect for students and exploring Lab-IQ",
            price: "$0",
            period: "/month",
            icon: Zap,
            iconColor: "from-blue-500 to-cyan-500",
            features: [
                "5 datasets",
                "100 MB storage",
                "Basic AutoML (3 models)",
                "Community support",
                "Public data only",
                "Standard charts & visualizations"
            ],
            cta: "Start Free",
            ctaLink: "/dashboard",
            popular: false,
            highlighted: false
        },
        {
            name: "Pro",
            description: "For serious researchers and small labs",
            price: "$49",
            period: "/month",
            annualPrice: "$470/year",
            savings: "Save $118/year",
            icon: Rocket,
            iconColor: "from-primary to-secondary",
            features: [
                "100 datasets",
                "10 GB storage",
                "Full AutoML (16+ algorithms)",
                "Domain-specific parsers",
                "Priority support",
                "Private data",
                "Team collaboration (5 users)",
                "API access",
                "Advanced visualizations",
                "Export to PDF/CSV"
            ],
            cta: "Start Pro Trial",
            ctaLink: "/dashboard",
            popular: true,
            highlighted: true
        },
        {
            name: "Team",
            description: "For multi-team labs and mid-size organizations",
            price: "$149",
            period: "/month",
            annualPrice: "$1,430/year",
            savings: "Save $358/year",
            icon: Users,
            iconColor: "from-purple-500 to-pink-500",
            features: [
                "500 datasets",
                "50 GB storage",
                "All Pro features",
                "Advanced compliance tools",
                "Team collaboration (25 users)",
                "Custom integrations",
                "Phone support",
                "SLA (99.5% uptime)",
                "Audit logs",
                "Version history"
            ],
            cta: "Contact Sales",
            ctaLink: "/dashboard",
            popular: false,
            highlighted: false
        },
        {
            name: "Enterprise",
            description: "For large pharma, hospitals, and research institutions",
            price: "Custom",
            period: "",
            icon: Building2,
            iconColor: "from-orange-500 to-red-500",
            features: [
                "Unlimited datasets",
                "Unlimited storage",
                "All features included",
                "White-label option",
                "On-premise deployment",
                "Custom integrations",
                "Dedicated support",
                "SLA (99.9% uptime)",
                "Training & onboarding",
                "Legal agreements",
                "SSO/SAML",
                "Custom SLA"
            ],
            cta: "Book Demo",
            ctaLink: "/dashboard",
            popular: false,
            highlighted: false
        }
    ];

    const comparisonFeatures = [
        {
            category: "Data & Storage",
            features: [
                { name: "Datasets", free: "5", pro: "100", team: "500", enterprise: "Unlimited" },
                { name: "Storage", free: "100 MB", pro: "10 GB", team: "50 GB", enterprise: "Unlimited" },
                { name: "File uploads", free: "✓", pro: "✓", team: "✓", enterprise: "✓" },
                { name: "Cloud sources", free: "✓", pro: "✓", team: "✓", enterprise: "✓" },
                { name: "Device streams", free: "-", pro: "10", team: "50", enterprise: "Unlimited" },
            ]
        },
        {
            category: "AI & ML",
            features: [
                { name: "AutoML models", free: "3", pro: "16+", team: "16+", enterprise: "16+ Custom" },
                { name: "Feature engineering", free: "Basic", pro: "Advanced", team: "Advanced", enterprise: "Custom" },
                { name: "Model accuracy", free: ">85%", pro: ">90%", team: ">90%", enterprise: ">95%" },
                { name: "Real-time progress", free: "✓", pro: "✓", team: "✓", enterprise: "✓" },
                { name: "Domain parsers", free: "-", pro: "✓", team: "✓", enterprise: "✓ Custom" },
            ]
        },
        {
            category: "Collaboration",
            features: [
                { name: "Team members", free: "1", pro: "5", team: "25", enterprise: "Unlimited" },
                { name: "Real-time chat", free: "-", pro: "✓", team: "✓", enterprise: "✓" },
                { name: "Comments", free: "-", pro: "✓", team: "✓", enterprise: "✓" },
                { name: "Task assignments", free: "-", pro: "✓", team: "✓", enterprise: "✓" },
                { name: "Email notifications", free: "Basic", pro: "✓", team: "✓", enterprise: "Custom" },
            ]
        },
        {
            category: "Compliance & Security",
            features: [
                { name: "Data encryption", free: "✓", pro: "✓", team: "✓", enterprise: "✓" },
                { name: "Audit logs", free: "Basic", pro: "✓", team: "Advanced", enterprise: "Custom" },
                { name: "Role-based access", free: "-", pro: "✓", team: "✓", enterprise: "Custom" },
                { name: "Data anonymization", free: "-", pro: "✓", team: "✓", enterprise: "✓" },
                { name: "SLA uptime", free: "-", pro: "-", team: "99.5%", enterprise: "99.9%" },
            ]
        },
        {
            category: "Support",
            features: [
                { name: "Support type", free: "Community", pro: "Priority email", team: "Phone + Email", enterprise: "Dedicated" },
                { name: "Response time", free: "Best effort", pro: "24 hours", team: "4 hours", enterprise: "1 hour" },
                { name: "Training", free: "-", pro: "Documentation", team: "Webinars", enterprise: "On-site" },
                { name: "Account manager", free: "-", pro: "-", team: "-", enterprise: "✓" },
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-background">
            <Navigation />

            {/* Hero Section */}
            <section className="relative pt-32 pb-16 px-4 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.05),transparent_50%),radial-gradient(circle_at_70%_60%,rgba(74,222,128,0.05),transparent_50%)]" />

                <div className="container mx-auto max-w-7xl relative">
                    <div className="text-center space-y-6 max-w-4xl mx-auto animate-fade-in-up">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background border border-border shadow-sm">
                            <TrendingUp className="w-4 h-4 text-primary animate-pulse" />
                            <span className="text-sm font-medium">Simple, Transparent Pricing</span>
                        </div>

                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight">
                            Pricing that scales
                            <br />
                            <span className="text-muted-foreground">with your research</span>
                        </h1>

                        <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                            From free exploration to enterprise deployment. Start with what you need, upgrade when you're ready.
                        </p>

                        {/* Billing Toggle */}
                        <div className="flex items-center justify-center gap-3 pt-4">
                            <span className="text-sm text-muted-foreground">Monthly</span>
                            <button className="relative w-14 h-7 rounded-full bg-primary transition-colors">
                                <div className="absolute left-1 top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform" />
                            </button>
                            <span className="text-sm font-medium">Annual</span>
                            <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-600 text-xs font-bold">Save 20%</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Tiers */}
            <section className="py-16 px-4">
                <div className="container mx-auto max-w-7xl">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {tiers.map((tier, idx) => {
                            const Icon = tier.icon;
                            return (
                                <Card
                                    key={tier.name}
                                    className={`p-6 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 animate-fade-in-up ${tier.highlighted ? 'border-primary shadow-xl scale-105 lg:scale-110 z-10' : 'border-border/50'
                                        }`}
                                    style={{ animationDelay: `${idx * 0.1}s` }}
                                >
                                    {tier.popular && (
                                        <div className="absolute top-0 right-0 px-3 py-1 bg-gradient-to-r from-primary to-secondary text-white text-xs font-bold rounded-bl-lg">
                                            POPULAR
                                        </div>
                                    )}

                                    <div className="space-y-6">
                                        {/* Icon */}
                                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tier.iconColor} flex items-center justify-center`}>
                                            <Icon className="w-7 h-7 text-white" />
                                        </div>

                                        {/* Name & Description */}
                                        <div>
                                            <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                                            <p className="text-sm text-muted-foreground">{tier.description}</p>
                                        </div>

                                        {/* Price */}
                                        <div>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-4xl font-bold">{tier.price}</span>
                                                {tier.period && <span className="text-muted-foreground">{tier.period}</span>}
                                            </div>
                                            {tier.annualPrice && (
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {tier.annualPrice} • <span className="text-green-600">{tier.savings}</span>
                                                </p>
                                            )}
                                        </div>

                                        {/* Features */}
                                        <ul className="space-y-3">
                                            {tier.features.map((feature) => (
                                                <li key={feature} className="flex items-start gap-2 text-sm">
                                                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                                    <span>{feature}</span>
                                                </li>
                                            ))}
                                        </ul>

                                        {/* CTA */}
                                        <Link to={tier.ctaLink} className="block mt-auto">
                                            <Button
                                                size="lg"
                                                className={`w-full ${tier.highlighted ? '' : 'variant="outline"'}`}
                                                variant={tier.highlighted ? 'default' : 'outline'}
                                            >
                                                {tier.cta}
                                            </Button>
                                        </Link>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Feature Comparison Table */}
            <section className="py-16 px-4 bg-muted/30">
                <div className="container mx-auto max-w-7xl">
                    <div className="text-center space-y-4 mb-12 animate-fade-in-up">
                        <h2 className="text-4xl md:text-5xl font-bold">
                            Compare Plans
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Detailed feature comparison across all tiers
                        </p>
                    </div>

                    <Card className="p-8 overflow-x-auto">
                        {comparisonFeatures.map((category, catIdx) => (
                            <div key={category.category} className={`${catIdx > 0 ? 'mt-8 pt-8 border-t' : ''}`}>
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-primary" />
                                    {category.category}
                                </h3>
                                <div className="space-y-3">
                                    {category.features.map((feature, featureIdx) => (
                                        <div
                                            key={feature.name}
                                            className={`grid grid-cols-5 gap-4 py-3 ${featureIdx > 0 ? 'border-t border-border/50' : ''}`}
                                        >
                                            <div className="font-medium text-sm">{feature.name}</div>
                                            <div className="text-sm text-center text-muted-foreground">{feature.free}</div>
                                            <div className="text-sm text-center font-medium text-primary">{feature.pro}</div>
                                            <div className="text-sm text-center text-muted-foreground">{feature.team}</div>
                                            <div className="text-sm text-center text-muted-foreground">{feature.enterprise}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </Card>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-16 px-4">
                <div className="container mx-auto max-w-4xl">
                    <div className="text-center space-y-4 mb-12 animate-fade-in-up">
                        <h2 className="text-4xl md:text-5xl font-bold">
                            Frequently Asked Questions
                        </h2>
                    </div>

                    <div className="space-y-6">
                        {[
                            {
                                q: "Can I change plans at any time?",
                                a: "Yes! Upgrade or downgrade your plan anytime. Changes take effect immediately, and we'll prorate any differences."
                            },
                            {
                                q: "What payment methods do you accept?",
                                a: "We accept all major credit cards (Visa, MasterCard, Amex), PayPal, and wire transfers for Enterprise plans."
                            },
                            {
                                q: "Is there a free trial for Pro plans?",
                                a: "Yes! Pro and Team plans come with a 14-day free trial. No credit card required to start."
                            },
                            {
                                q: "What happens to my data if I downgrade?",
                                a: "Your data is never deleted. If you exceed the new plan's limits, you'll have read-only access until you upgrade or remove data."
                            },
                            {
                                q: "Do you offer academic discounts?",
                                a: "Yes! We offer 50% discounts for verified academic institutions and non-profit research organizations."
                            },
                            {
                                q: "What's included in Enterprise support?",
                                a: "Enterprise plans include a dedicated account manager, 1-hour response SLA, on-site training, and custom integration support."
                            }
                        ].map((faq, idx) => (
                            <Card
                                key={idx}
                                className="p-6 hover:shadow-lg transition-all duration-300 animate-fade-in-up"
                                style={{ animationDelay: `${idx * 0.05}s` }}
                            >
                                <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5 text-primary" />
                                    {faq.q}
                                </h3>
                                <p className="text-muted-foreground">{faq.a}</p>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-16 px-4 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
                <div className="container mx-auto max-w-4xl text-center space-y-6 animate-fade-in-up">
                    <h2 className="text-4xl md:text-5xl font-bold">
                        Ready to Get Started?
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Join researchers worldwide using Lab-IQ to accelerate discoveries.
                        Start free today—no credit card required.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                        <Link to="/dashboard">
                            <Button size="lg" className="gap-2">
                                <Rocket className="w-5 h-5" />
                                Start Free Trial
                            </Button>
                        </Link>
                        <Button size="lg" variant="outline" className="gap-2">
                            <MessageSquare className="w-5 h-5" />
                            Talk to Sales
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Pricing;
