import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import {
  FlaskConical,
  Brain,
  Lock,
  Zap,
  TrendingUp,
  Users,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Database,
  LineChart,
  Workflow,
  Shield,
  Rocket,
  BarChart3,
  MessageSquare,
  FileText,
  Upload,
  Play,
  Watch,
  Cloud,
  Wifi,
  Smartphone,
  Server,
  HardDrive,
  Activity
} from "lucide-react";

const Index = () => {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Analysis",
      description: "Google Gemini AI analyzes your data with AutoML, providing instant insights in analysis, educator, and prediction modes"
    },
    {
      icon: Database,
      title: "Multi-Source Data Ingestion",
      description: "Upload files, connect live device streams, integrate cloud sources, or use our dataset registry with drag-and-drop validation"
    },
    {
      icon: LineChart,
      title: "Real-Time Visualization",
      description: "Interactive charts and dashboards with live data updates. Track experiments, metrics, and performance in real-time"
    },
    {
      icon: Workflow,
      title: "Bottleneck Detection",
      description: "AI automatically identifies workflow inefficiencies and suggests optimizations to accelerate your research"
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Real-time chat, comments, action assignments, and email notifications keep your team synchronized"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "End-to-end encryption, role-based access control, and complete audit logs for compliance"
    }
  ];

  const dataSources = [
    {
      icon: Watch,
      title: "Wearable Devices",
      description: "Smartwatches, fitness trackers, biosensors",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Cloud,
      title: "Cloud Platforms",
      description: "AWS, Google Cloud, Azure, Dropbox",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Activity,
      title: "Live Devices",
      description: "Lab equipment, IoT sensors, real-time streams",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: HardDrive,
      title: "File Upload",
      description: "CSV, Excel, JSON, XML, and more",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: Server,
      title: "Database Connect",
      description: "PostgreSQL, MySQL, MongoDB",
      color: "from-indigo-500 to-blue-500"
    },
    {
      icon: Wifi,
      title: "API Integration",
      description: "RESTful APIs, webhooks, custom endpoints",
      color: "from-teal-500 to-cyan-500"
    }
  ];

  const capabilities = [
    {
      title: "Intelligent Data Analysis",
      items: [
        "AutoML pattern detection",
        "Predictive modeling",
        "Natural language insights",
        "Multi-modal analysis"
      ]
    },
    {
      title: "Laboratory Management",
      items: [
        "Experiment tracking",
        "Automated workflows",
        "Report generation",
        "Version history (Pro)"
      ]
    },
    {
      title: "Collaboration Tools",
      items: [
        "Real-time chat",
        "Threaded comments",
        "Task assignments",
        "Email notifications"
      ]
    }
  ];

  const useCases = [
    "Chemistry & Materials Science",
    "Biology & Life Sciences",
    "Agricultural Research",
    "Clinical Trials & Diagnostics",
    "Environmental Science",
    "Quality Control & Testing"
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section - Antigravity Inspired with Animations */}
      <section className="relative pt-32 pb-24 px-4 overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.05),transparent_50%),radial-gradient(circle_at_70%_60%,rgba(74,222,128,0.05),transparent_50%)]" />

        {/* Floating particles animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-2 h-2 bg-primary/20 rounded-full animate-float" style={{ animationDelay: '0s', animationDuration: '6s' }} />
          <div className="absolute top-40 right-20 w-3 h-3 bg-secondary/20 rounded-full animate-float" style={{ animationDelay: '1s', animationDuration: '8s' }} />
          <div className="absolute bottom-40 left-1/4 w-2 h-2 bg-accent/20 rounded-full animate-float" style={{ animationDelay: '2s', animationDuration: '7s' }} />
          <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-primary/20 rounded-full animate-float" style={{ animationDelay: '3s', animationDuration: '9s' }} />
        </div>

        <div className="container mx-auto max-w-7xl relative">
          <div className="text-center space-y-8 max-w-5xl mx-auto animate-fade-in-up">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background border border-border shadow-sm animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-sm font-medium">AI-Powered Laboratory Intelligence Platform</span>
            </div>

            {/* Main Headline - Bold and Clear */}
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold leading-[1.1] tracking-tight animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              Experience liftoff
              <br />
              <span className="text-muted-foreground">with intelligent lab data</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              Transform raw experimental data into actionable insights with AI.
              Connect wearables, cloud sources, and live devices—no coding required.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <Link to="/dashboard">
                <Button size="lg" className="gap-2 text-base h-12 px-8 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105">
                  <Play className="w-5 h-5" />
                  Get Started Free
                </Button>
              </Link>
              <Link to="/upload">
                <Button size="lg" variant="outline" className="gap-2 text-base h-12 px-8 rounded-full hover:scale-105 transition-all">
                  Explore Use Cases
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>

            {/* Social Proof */}
            <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-muted-foreground animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Free tier available</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Enterprise-ready</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Data Sources Integration Section - NEW */}
      <section className="py-24 px-4 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center space-y-4 mb-16 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-bold">
              Connect Any Data Source
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Seamlessly integrate data from wearables, cloud platforms, live devices, and more.
              Lab-IQ supports 10+ data sources for comprehensive analysis.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {dataSources.map((source, idx) => {
              const Icon = source.icon;
              return (
                <Card
                  key={source.title}
                  className="p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-border/50 group animate-fade-in-up cursor-pointer"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className="space-y-4">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${source.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold">{source.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{source.description}</p>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* CTA in Data Sources Section */}
          <div className="text-center animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            <Link to="/upload">
              <Button size="lg" className="gap-2 text-base h-12 px-8 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105">
                <Upload className="w-5 h-5" />
                Start Uploading Data
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* What We Do Section - Clear Value Proposition */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center space-y-4 mb-16 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-bold">
              What is Lab-IQ?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              A comprehensive AI-powered platform that revolutionizes how laboratories collect,
              analyze, and collaborate on research data
            </p>
          </div>

          {/* Core Capabilities Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {capabilities.map((capability, idx) => (
              <Card
                key={capability.title}
                className="p-8 hover:shadow-lg transition-all duration-300 border-border/50 animate-fade-in-up"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <h3 className="text-xl font-bold mb-4">{capability.title}</h3>
                <ul className="space-y-3">
                  {capability.items.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>

          {/* Platform Overview */}
          <Card className="p-12 bg-gradient-to-br from-primary/5 via-background to-secondary/5 border-border/50 animate-fade-in-up">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h3 className="text-3xl font-bold">
                  Complete Laboratory Intelligence Suite
                </h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  From data ingestion to AI-powered insights, Lab-IQ provides everything modern
                  research teams need. Upload data from multiple sources, let our AI analyze patterns,
                  collaborate in real-time, and generate comprehensive reports—all in one platform.
                </p>
                <div className="flex flex-wrap gap-3 pt-4">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-background border border-border hover:border-primary/50 transition-colors">
                    <Upload className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">10+ Data Sources</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-background border border-border hover:border-primary/50 transition-colors">
                    <Brain className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">3 AI Modes</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-background border border-border hover:border-primary/50 transition-colors">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Real-time Charts</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { icon: Database, text: "Multi-source data ingestion hub" },
                  { icon: Sparkles, text: "Google Gemini AI integration" },
                  { icon: MessageSquare, text: "Streaming chat assistant" },
                  { icon: FileText, text: "Automated report generation" },
                  { icon: Users, text: "Team collaboration tools" },
                  { icon: Rocket, text: "Workflow automation" }
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-4 p-4 rounded-lg bg-background border border-border hover:border-primary/50 transition-all duration-300 hover:scale-105 cursor-pointer animate-fade-in-up"
                      style={{ animationDelay: `${idx * 0.05}s` }}
                    >
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <span className="font-medium">{item.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* CTA in What We Do Section */}
          <div className="text-center mt-12 animate-fade-in-up">
            <Link to="/dashboard">
              <Button size="lg" className="gap-2 text-base h-12 px-8 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105">
                <Rocket className="w-5 h-5" />
                Explore the Platform
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid - Detailed Capabilities */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center space-y-4 mb-16 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-bold">
              Powerful Features
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Everything you need to accelerate research and make data-driven discoveries
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={feature.title}
                  className="p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-border/50 group animate-fade-in-up"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className="space-y-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* CTA in Features Section */}
          <div className="text-center mt-12 animate-fade-in-up">
            <Link to="/insights">
              <Button size="lg" variant="outline" className="gap-2 text-base h-12 px-8 rounded-full hover:scale-105 transition-all">
                <Brain className="w-5 h-5" />
                See AI in Action
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 animate-fade-in-up">
              <div className="space-y-4">
                <h2 className="text-4xl md:text-5xl font-bold">
                  Built for Modern Research
                </h2>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Lab-IQ adapts to your field of study and experimental design,
                  providing specialized analysis across multiple disciplines
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {useCases.map((useCase, idx) => (
                  <div
                    key={useCase}
                    className="flex items-center gap-4 p-4 rounded-lg bg-background border border-border hover:border-primary/50 transition-all duration-300 hover:scale-105 cursor-pointer animate-fade-in-up"
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                      <FlaskConical className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-medium text-lg">{useCase}</span>
                  </div>
                ))}
              </div>
            </div>

            <Card className="p-10 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20 animate-fade-in-up">
              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold">Quick Start in 5 Steps</h3>
                  <p className="text-muted-foreground">
                    Get from raw data to actionable insights in minutes
                  </p>
                </div>

                <div className="space-y-5">
                  {[
                    { step: "1", text: "Create your project workspace", icon: Rocket },
                    { step: "2", text: "Upload experimental data", icon: Upload },
                    { step: "3", text: "Let AI analyze patterns", icon: Brain },
                    { step: "4", text: "Review insights & predictions", icon: TrendingUp },
                    { step: "5", text: "Generate & share reports", icon: FileText }
                  ].map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.step}
                        className="flex items-start gap-4 animate-fade-in-up"
                        style={{ animationDelay: `${idx * 0.1}s` }}
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold flex-shrink-0">
                          {item.step}
                        </div>
                        <div className="flex-1 pt-1.5">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-primary" />
                            <p className="font-medium">{item.text}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Link to="/dashboard" className="block">
                  <Button size="lg" className="w-full gap-2 hover:scale-105 transition-all">
                    Start Your First Project
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Subscription Tiers */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center space-y-4 mb-16 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-bold">
              Choose Your Plan
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Start free and upgrade as your research grows
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Free Tier */}
            <Card className="p-8 border-border/50 hover:shadow-xl transition-all duration-300 animate-fade-in-up">
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Free</h3>
                  <p className="text-muted-foreground">Perfect for getting started</p>
                </div>
                <div className="text-4xl font-bold">$0<span className="text-lg text-muted-foreground font-normal">/month</span></div>
                <ul className="space-y-3">
                  {[
                    "Basic AI analysis",
                    "Up to 5 projects",
                    "1GB storage",
                    "Community support",
                    "Standard charts"
                  ].map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/dashboard">
                  <Button variant="outline" size="lg" className="w-full hover:scale-105 transition-all">
                    Get Started Free
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Pro Tier */}
            <Card className="p-8 border-primary shadow-xl relative overflow-hidden hover:shadow-2xl transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="absolute top-4 right-4">
                <div className="px-3 py-1 rounded-full bg-gradient-to-r from-primary to-secondary text-white text-xs font-bold animate-pulse">
                  POPULAR
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Pro</h3>
                  <p className="text-muted-foreground">For serious researchers</p>
                </div>
                <div className="text-4xl font-bold">$49<span className="text-lg text-muted-foreground font-normal">/month</span></div>
                <ul className="space-y-3">
                  {[
                    "Advanced AI with all modes",
                    "Unlimited projects",
                    "100GB storage",
                    "10 device streams",
                    "Real-time collaboration",
                    "Version history",
                    "Priority support",
                    "Custom reports",
                    "Experiment templates"
                  ].map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/dashboard">
                  <Button size="lg" className="w-full hover:scale-105 transition-all">
                    Start Pro Trial
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 px-4 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="container mx-auto max-w-5xl text-center space-y-8 animate-fade-in-up">
          <h2 className="text-4xl md:text-5xl font-bold">
            Ready to Transform Your Research?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join researchers worldwide who trust Lab-IQ for intelligent data analysis.
            Start free today—no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link to="/dashboard">
              <Button size="lg" className="gap-2 text-base h-12 px-8 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105">
                <Rocket className="w-5 h-5" />
                Get Started Free
              </Button>
            </Link>
            <Link to="/upload">
              <Button size="lg" variant="outline" className="gap-2 text-base h-12 px-8 rounded-full hover:scale-105 transition-all">
                <Upload className="w-5 h-5" />
                Upload Your Data
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "10+", label: "Data Sources" },
              { value: "30+", label: "UI Components" },
              { value: "5+", label: "AI Functions" },
              { value: "99.9%", label: "Uptime" }
            ].map((stat, idx) => (
              <div
                key={stat.label}
                className="animate-fade-in-up hover:scale-110 transition-transform duration-300"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <FlaskConical className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Lab-IQ
              </span>
            </div>
            <div className="flex gap-8 text-sm text-muted-foreground">
              <Link to="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
              <Link to="/upload" className="hover:text-foreground transition-colors">Upload</Link>
              <Link to="/insights" className="hover:text-foreground transition-colors">Insights</Link>
              <Link to="/collaboration" className="hover:text-foreground transition-colors">Collaborate</Link>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2025 Lab-IQ. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
