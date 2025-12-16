import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import Navigation from "@/components/Navigation";
import { AIAssistant } from "@/components/pricing/AIAssistant";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
    Check,
    ArrowRight,
    CreditCard,
    GraduationCap,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    Heart,
    Globe,
    ShieldCheck,
    Mail,
    CheckCircle2,
    Clock,
    Building2
} from "lucide-react";

const Pricing = () => {
    const [isAnnual, setIsAnnual] = useState(true);
    const [studentModalOpen, setStudentModalOpen] = useState(false);
    const [studentEmail, setStudentEmail] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [verificationStep, setVerificationStep] = useState<'email' | 'sent' | 'verified'>('email');
    const [paymentIndex, setPaymentIndex] = useState(0);
    const carouselRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    const paymentMethods = [
        { name: "Visa", logo: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" },
        { name: "Mastercard", logo: "https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" },
        { name: "American Express", logo: "https://upload.wikimedia.org/wikipedia/commons/f/fa/American_Express_logo_%282018%29.svg" },
        { name: "PayPal", logo: "https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" },
        { name: "Apple Pay", logo: "https://upload.wikimedia.org/wikipedia/commons/b/b0/Apple_Pay_logo.svg" },
        { name: "Google Pay", logo: "https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg" },
        { name: "Stripe", logo: "https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" },
    ];

    // Auto-scroll payment carousel
    useEffect(() => {
        const interval = setInterval(() => {
            setPaymentIndex(prev => (prev + 1) % paymentMethods.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const tiers = [
        {
            name: "Free",
            description: "For exploration",
            monthlyPrice: 0,
            annualPrice: 0,
            features: [
                "5 datasets",
                "100 MB storage",
                "Basic analysis",
                "Community support"
            ],
            cta: "Get Started",
            ctaLink: "/signup"
        },
        {
            name: "Pro",
            description: "For researchers",
            monthlyPrice: 49,
            annualPrice: 39,
            features: [
                "100 datasets",
                "10 GB storage",
                "Full AI analysis",
                "Priority support",
                "Team collaboration",
                "API access"
            ],
            cta: "Start Trial",
            ctaLink: "/signup",
            popular: true
        },
        {
            name: "Team",
            description: "For organizations",
            monthlyPrice: 149,
            annualPrice: 119,
            features: [
                "500 datasets",
                "50 GB storage",
                "Everything in Pro",
                "25 team members",
                "Phone support",
                "99.5% SLA"
            ],
            cta: "Start Trial",
            ctaLink: "/signup"
        },
        {
            name: "Enterprise",
            description: "For institutions",
            monthlyPrice: null,
            annualPrice: null,
            features: [
                "Unlimited everything",
                "On-premise option",
                "Dedicated support",
                "Custom SLA",
                "SSO/SAML",
                "White-label"
            ],
            cta: "Contact Sales",
            ctaLink: "/signup"
        }
    ];

    const features = [
        {
            category: "Data",
            items: [
                { name: "Datasets", values: ["5", "100", "500", "Unlimited"] },
                { name: "Storage", values: ["100 MB", "10 GB", "50 GB", "Unlimited"] },
                { name: "File size limit", values: ["10 MB", "50 MB", "100 MB", "200 MB+"] }
            ]
        },
        {
            category: "AI & Analysis",
            items: [
                { name: "AI models", values: ["3", "16+", "16+", "Custom"] },
                { name: "Analysis modes", values: ["1", "3", "3", "3+"] },
                { name: "Real-time insights", values: [false, true, true, true] }
            ]
        },
        {
            category: "Collaboration",
            items: [
                { name: "Team members", values: ["1", "5", "25", "Unlimited"] },
                { name: "Real-time chat", values: [false, true, true, true] },
                { name: "Comments & tasks", values: [false, true, true, true] }
            ]
        },
        {
            category: "Support",
            items: [
                { name: "Response time", values: ["72h", "24h", "4h", "1h"] },
                { name: "Phone support", values: [false, false, true, true] },
                { name: "Dedicated manager", values: [false, false, false, true] }
            ]
        }
    ];

    const verifyStudent = async () => {
        if (!studentEmail.includes('.edu') && !studentEmail.includes('.ac.')) {
            toast({
                title: "Invalid email",
                description: "Please use a valid educational email (.edu or .ac.)",
                variant: "destructive"
            });
            return;
        }

        setVerifying(true);

        try {
            // Step 1: Send verification email (simulated)
            await new Promise(resolve => setTimeout(resolve, 1500));
            setVerificationStep('sent');

            // Step 2: Simulate email click verification (auto-verify for demo)
            await new Promise(resolve => setTimeout(resolve, 3000));

            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                // Update user metadata with student status
                await supabase.auth.updateUser({
                    data: {
                        student_verified: true,
                        student_email: studentEmail,
                        student_discount: 90,
                        verified_at: new Date().toISOString()
                    }
                });
            }

            setVerificationStep('verified');

            // Show success state briefly then close
            await new Promise(resolve => setTimeout(resolve, 2000));

            toast({
                title: "Verification successful!",
                description: "90% student discount applied to your account."
            });

            setStudentModalOpen(false);
            setStudentEmail('');
            setVerificationStep('email');
        } catch (error) {
            toast({
                title: "Verification failed",
                description: "Please try again or contact support.",
                variant: "destructive"
            });
            setVerificationStep('email');
        } finally {
            setVerifying(false);
        }
    };

    const resetStudentModal = () => {
        setStudentModalOpen(false);
        setStudentEmail('');
        setVerificationStep('email');
        setVerifying(false);
    };

    return (
        <div className="min-h-screen bg-background">
            <Navigation />

            {/* Hero */}
            <section className="pt-32 pb-16 px-4">
                <div className="max-w-5xl mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-4">
                        Simple, transparent pricing
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                        Start free. Scale as you grow. No hidden fees.
                    </p>

                    {/* Billing toggle */}
                    <div className="inline-flex items-center gap-3 p-1 rounded-full bg-muted/50">
                        <button
                            onClick={() => setIsAnnual(false)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${!isAnnual ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setIsAnnual(true)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${isAnnual ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
                        >
                            Annual
                            <span className="ml-2 text-xs text-green-600">-20%</span>
                        </button>
                    </div>
                </div>
            </section>

            {/* Pricing Cards */}
            <section className="pb-16 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {tiers.map((tier) => {
                            const price = isAnnual ? tier.annualPrice : tier.monthlyPrice;

                            return (
                                <Card
                                    key={tier.name}
                                    className={`p-6 relative transition-all duration-200 hover:shadow-lg ${tier.popular ? 'ring-2 ring-foreground' : ''}`}
                                >
                                    {tier.popular && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-foreground text-background text-xs font-medium rounded-full">
                                            Most popular
                                        </div>
                                    )}

                                    <div className="mb-6">
                                        <h3 className="text-lg font-semibold">{tier.name}</h3>
                                        <p className="text-sm text-muted-foreground">{tier.description}</p>
                                    </div>

                                    <div className="mb-6">
                                        {price !== null ? (
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-4xl font-semibold">${price}</span>
                                                <span className="text-muted-foreground">/mo</span>
                                            </div>
                                        ) : (
                                            <span className="text-4xl font-semibold">Custom</span>
                                        )}
                                        {isAnnual && tier.monthlyPrice !== null && tier.monthlyPrice > 0 && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                billed annually
                                            </p>
                                        )}
                                    </div>

                                    <ul className="space-y-3 mb-6">
                                        {tier.features.map((feature) => (
                                            <li key={feature} className="flex items-start gap-2 text-sm">
                                                <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <Link to={tier.ctaLink}>
                                        <Button
                                            className="w-full"
                                            variant={tier.popular ? 'default' : 'outline'}
                                        >
                                            {tier.cta}
                                        </Button>
                                    </Link>
                                </Card>
                            );
                        })}
                    </div>

                    <p className="text-center text-sm text-muted-foreground mt-6">
                        14-day free trial on Pro & Team. No credit card required.
                    </p>
                </div>
            </section>

            {/* Student Discount - Enhanced */}
            <section className="py-16 px-4 bg-gradient-to-b from-violet-500/5 via-purple-500/5 to-fuchsia-500/5">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 text-violet-600 text-sm font-medium mb-4">
                            <Heart className="w-4 h-4" />
                            Supporting Education
                        </div>
                        <h2 className="text-2xl md:text-3xl font-semibold mb-3">
                            We believe in empowering the next generation
                        </h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Science advances through accessible tools. That's why we offer students and academic researchers
                            massive discounts—because breakthrough discoveries shouldn't be limited by budget.
                        </p>
                    </div>

                    <Card className="p-8 border-violet-500/20 bg-gradient-to-br from-background to-violet-500/5">
                        <div className="grid md:grid-cols-2 gap-8 items-center">
                            {/* Left: Benefits */}
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0">
                                        <GraduationCap className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-1">90% Student Discount</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Full Pro features for just $3.90/month. Same powerful AI, same unlimited analysis.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                                        <Building2 className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-1">50% Academic Institution</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Universities and research labs qualify for institutional discounts on Team plans.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center flex-shrink-0">
                                        <Globe className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-1">Non-Profit Organizations</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Registered non-profits advancing scientific research receive 50% off all plans.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Right: CTA */}
                            <div className="bg-background rounded-2xl p-6 border shadow-lg">
                                <div className="text-center mb-6">
                                    <div className="inline-flex items-center gap-1 text-3xl font-bold">
                                        <span className="text-muted-foreground line-through text-xl">$39</span>
                                        <span className="text-violet-600">$3.90</span>
                                        <span className="text-sm font-normal text-muted-foreground">/mo</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">Pro plan with student discount</p>
                                </div>

                                <div className="space-y-3 mb-6">
                                    {['Full AI analysis suite', '100 datasets', '10 GB storage', 'Priority support'].map((feature) => (
                                        <div key={feature} className="flex items-center gap-2 text-sm">
                                            <Check className="w-4 h-4 text-green-500" />
                                            <span>{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                <Button
                                    onClick={() => setStudentModalOpen(true)}
                                    className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 shadow-lg shadow-purple-500/20"
                                >
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Verify Student Status
                                </Button>

                                <p className="text-xs text-center text-muted-foreground mt-3">
                                    Instant verification with .edu email
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </section>

            {/* Feature Comparison */}
            <section className="py-16 px-4">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-2xl font-semibold text-center mb-2">Compare plans</h2>
                    <p className="text-muted-foreground text-center mb-10">
                        Everything you need to make the right choice
                    </p>

                    <div className="space-y-8">
                        {features.map((section) => (
                            <div key={section.category}>
                                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
                                    {section.category}
                                </h3>
                                <div className="border rounded-lg overflow-hidden">
                                    {section.items.map((item, idx) => (
                                        <div
                                            key={item.name}
                                            className={`grid grid-cols-5 ${idx > 0 ? 'border-t' : ''}`}
                                        >
                                            <div className="p-4 text-sm font-medium bg-muted/30">
                                                {item.name}
                                            </div>
                                            {item.values.map((value, i) => (
                                                <div key={i} className="p-4 text-sm text-center">
                                                    {typeof value === 'boolean' ? (
                                                        value ? (
                                                            <Check className="w-4 h-4 text-green-600 mx-auto" />
                                                        ) : (
                                                            <span className="text-muted-foreground/30">—</span>
                                                        )
                                                    ) : (
                                                        <span className={i === 1 ? 'font-medium' : ''}>{value}</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Payment Methods Carousel */}
            <section className="py-12 px-4 border-t">
                <div className="max-w-5xl mx-auto">
                    <p className="text-sm text-muted-foreground text-center mb-6">
                        Secure payments powered by industry leaders
                    </p>

                    <div className="relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background to-transparent z-10" />
                        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent z-10" />

                        <div
                            ref={carouselRef}
                            className="flex items-center justify-center gap-12 transition-transform duration-500"
                            style={{ transform: `translateX(-${paymentIndex * 100}px)` }}
                        >
                            {[...paymentMethods, ...paymentMethods].map((method, idx) => (
                                <div
                                    key={`${method.name}-${idx}`}
                                    className="flex-shrink-0 h-8 opacity-50 hover:opacity-100 transition-opacity grayscale hover:grayscale-0"
                                >
                                    <img
                                        src={method.logo}
                                        alt={method.name}
                                        className="h-full w-auto object-contain"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-2 mt-6">
                        <button
                            onClick={() => setPaymentIndex(prev => Math.max(0, prev - 1))}
                            className="p-1 rounded hover:bg-muted transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="flex gap-1">
                            {paymentMethods.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === paymentIndex % paymentMethods.length ? 'bg-foreground' : 'bg-muted-foreground/30'}`}
                                />
                            ))}
                        </div>
                        <button
                            onClick={() => setPaymentIndex(prev => prev + 1)}
                            className="p-1 rounded hover:bg-muted transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </section>

            {/* FAQ with AI */}
            <section className="py-16 px-4 bg-muted/20">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-2xl font-semibold mb-2">Questions?</h2>
                    <p className="text-muted-foreground mb-8">
                        Our assistant can help with pricing, features, and more.
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-3">
                        {["What's in Pro?", "Student pricing", "Enterprise options", "Data security"].map((q) => (
                            <button
                                key={q}
                                className="px-4 py-2 rounded-full border bg-background text-sm hover:border-foreground/50 transition-colors"
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-20 px-4">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-3xl font-semibold mb-4">
                        Ready to get started?
                    </h2>
                    <p className="text-muted-foreground mb-8">
                        Join thousands of researchers accelerating their work.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link to="/signup">
                            <Button size="lg" className="min-w-[160px]">
                                Start free trial
                            </Button>
                        </Link>
                        <Button size="lg" variant="outline" className="min-w-[160px]">
                            Talk to sales
                        </Button>
                    </div>
                </div>
            </section>

            {/* Student Verification Modal - Google Style */}
            <Dialog open={studentModalOpen} onOpenChange={resetStudentModal}>
                <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
                    {/* Progress Steps */}
                    <div className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-violet-500/5 to-fuchsia-500/5">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            {['email', 'sent', 'verified'].map((step, idx) => (
                                <div key={step} className="flex items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                                        verificationStep === step
                                            ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white scale-110'
                                            : idx < ['email', 'sent', 'verified'].indexOf(verificationStep)
                                            ? 'bg-green-500 text-white'
                                            : 'bg-muted text-muted-foreground'
                                    }`}>
                                        {idx < ['email', 'sent', 'verified'].indexOf(verificationStep) ? (
                                            <Check className="w-4 h-4" />
                                        ) : (
                                            idx + 1
                                        )}
                                    </div>
                                    {idx < 2 && (
                                        <div className={`w-12 h-0.5 mx-1 transition-colors duration-300 ${
                                            idx < ['email', 'sent', 'verified'].indexOf(verificationStep)
                                                ? 'bg-green-500'
                                                : 'bg-muted'
                                        }`} />
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="text-center">
                            <h3 className="font-semibold text-lg">
                                {verificationStep === 'email' && 'Verify Your Student Status'}
                                {verificationStep === 'sent' && 'Check Your Email'}
                                {verificationStep === 'verified' && 'Verification Complete!'}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                {verificationStep === 'email' && 'Enter your educational email to get 90% off'}
                                {verificationStep === 'sent' && 'We sent a verification link to your email'}
                                {verificationStep === 'verified' && 'Your student discount has been applied'}
                            </p>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {verificationStep === 'email' && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="student-email" className="text-sm font-medium">
                                        Educational Email Address
                                    </Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            id="student-email"
                                            type="email"
                                            placeholder="you@university.edu"
                                            value={studentEmail}
                                            onChange={(e) => setStudentEmail(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Accepted: .edu, .ac.uk, .edu.au, and other academic domains
                                    </p>
                                </div>

                                {/* Why we verify */}
                                <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                        <ShieldCheck className="w-4 h-4 text-violet-500" />
                                        Why we verify
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        We use institutional email verification to ensure these generous discounts reach
                                        genuine students and researchers. This simple step helps us keep pricing sustainable
                                        so we can continue supporting the academic community for years to come.
                                    </p>
                                </div>

                                {/* Supported institutions */}
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span>Trusted by students from:</span>
                                    <div className="flex items-center gap-2">
                                        {['MIT', 'Stanford', 'Harvard', 'Oxford'].map((uni) => (
                                            <span key={uni} className="px-2 py-0.5 bg-muted rounded text-foreground/70">
                                                {uni}
                                            </span>
                                        ))}
                                        <span>+1000 more</span>
                                    </div>
                                </div>

                                <Button
                                    onClick={verifyStudent}
                                    disabled={!studentEmail || verifying}
                                    className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600"
                                >
                                    {verifying ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Sending verification...
                                        </>
                                    ) : (
                                        <>
                                            <Mail className="w-4 h-4 mr-2" />
                                            Send Verification Email
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}

                        {verificationStep === 'sent' && (
                            <div className="text-center space-y-6 py-4">
                                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 rounded-full flex items-center justify-center">
                                    <Mail className="w-10 h-10 text-violet-500 animate-bounce" />
                                </div>

                                <div className="space-y-2">
                                    <p className="font-medium">Verification email sent to</p>
                                    <p className="text-violet-600 font-mono text-sm bg-violet-500/10 px-3 py-1 rounded-full inline-block">
                                        {studentEmail}
                                    </p>
                                </div>

                                <div className="bg-muted/30 rounded-xl p-4 text-left space-y-2">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Clock className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">Waiting for verification...</span>
                                        <Loader2 className="w-4 h-4 animate-spin ml-auto text-violet-500" />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Click the link in your email to verify. This demo will auto-verify in a few seconds.
                                    </p>
                                </div>

                                <p className="text-xs text-muted-foreground">
                                    Didn't receive it? Check spam or{' '}
                                    <button className="text-violet-500 hover:underline" onClick={() => setVerificationStep('email')}>
                                        try again
                                    </button>
                                </p>
                            </div>
                        )}

                        {verificationStep === 'verified' && (
                            <div className="text-center space-y-6 py-4">
                                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center">
                                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                                </div>

                                <div className="space-y-2">
                                    <h4 className="text-xl font-semibold text-green-600">You're verified!</h4>
                                    <p className="text-muted-foreground">
                                        90% student discount is now active on your account
                                    </p>
                                </div>

                                <div className="bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 rounded-xl p-4 border border-violet-500/20">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-muted-foreground">Pro Plan</span>
                                        <span className="text-sm line-through text-muted-foreground">$39/mo</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold">Your Price</span>
                                        <span className="text-2xl font-bold text-violet-600">$3.90/mo</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                                    <Sparkles className="w-4 h-4" />
                                    <span>Discount valid for 4 years or until graduation</span>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* AI Assistant */}
            <AIAssistant />
        </div>
    );
};

export default Pricing;
