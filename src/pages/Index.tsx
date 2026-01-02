import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import { ScrollToTop } from "@/components/ScrollToTop";
import {
  HeartPulse,
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
  Activity,
  Mail,
  Github,
  Twitter,
  Linkedin
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
      title: "Interactive Visualization",
      description: "Charts and dashboards that update in real-time. Track trends, compare groups, and monitor indicators"
    },
    {
      icon: Workflow,
      title: "Smart Data Profiling",
      description: "Understand your dataset's structure, quality, and patterns instantly with automated profiling"
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
      title: "Wearables & Monitoring",
      description: "Smartwatches, fitness trackers, home health monitors",
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
      title: "Surveys & Programs",
      description: "Household surveys, cohort studies, NGO datasets",
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
      title: "Public Data APIs",
      description: "WHO, DHS, World Bank public datasets",
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
      title: "Research & Program Tracking",
      items: [
        "Analysis workflows",
        "Dataset versioning",
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
    "Public Health & Epidemiology",
    "Population Health Surveys",
    "NGO & Program Monitoring",
    "Environmental Health Data",
    "Health Informatics Education",
    "Digital Health Research"
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
              <span className="text-sm font-medium">AI-Powered Health Data Analysis Platform</span>
            </div>

            {/* Main Headline - Compact 2 Lines with Typing Effect */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.15] tracking-tight animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <span className="inline-block overflow-hidden whitespace-nowrap border-r-2 border-primary animate-typing">
                Launch better decisions
              </span>
              <br />
              <span className="text-muted-foreground">with intelligent health data</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              Turn messy health and public health data into insights, dashboards, and reports—no coding required.
              Upload CSVs from surveys, programs, and monitoring tools.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <Link to="/signup">
                <Button size="lg" className="gap-2 text-base h-12 px-8 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105">
                  <Play className="w-5 h-5" />
                  Get Started Free
                </Button>
              </Link>
              <Link to="/upload">
                <Button size="lg" variant="outline" className="gap-2 text-base h-12 px-8 rounded-full hover:scale-105 transition-all">
                  Explore Health Use Cases
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
                <span>Free tier for students & researchers</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Built for public health & research</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Student Discount - Elegant Inline */}
      <section className="border-y border-border/40 bg-muted/20">
        <div className="container mx-auto max-w-7xl">
          <Link
            to="/pricing"
            className="group flex items-center justify-between py-4 px-4 md:px-8 hover:bg-muted/40 transition-colors"
          >
            <div className="flex items-center gap-6">
              <span className="text-sm tracking-wide text-muted-foreground">
                For students & researchers
              </span>
              <span className="hidden sm:block w-px h-4 bg-border" />
              <span className="text-sm font-medium">
                Pro at <span className="text-foreground">$3.90/mo</span>
                <span className="text-muted-foreground ml-1.5">— 90% off with .edu</span>
              </span>
            </div>
            <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              Verify
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
        </div>
      </section>

      {/* What If... Section - Professional & Subtle */}
      <section className="relative py-24 px-4 bg-muted/20">
        <div className="container mx-auto max-w-6xl">
          <div className="space-y-16">
            {/* Main headline - Clean & Professional */}
            <div className="text-center space-y-6">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-foreground">
                What if every health dataset<br />revealed insights you didn't see before?
              </h2>
            </div>

            {/* Three scenarios - Clean cards without flashy colors */}
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: TrendingUp,
                  question: "What if reports were ready",
                  answer: "when funders asked for them?"
                },
                {
                  icon: Zap,
                  question: "What if analysis took",
                  answer: "minutes instead of days?"
                },
                {
                  icon: Database,
                  question: "What if health data from different sources",
                  answer: "just... worked together?"
                }
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className="p-6 rounded-lg border border-border bg-card hover:border-primary/50 transition-all duration-300 animate-fade-in-up"
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <div className="space-y-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          {item.question}
                        </p>
                        <p className="text-lg font-semibold text-foreground">
                          {item.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom tagline - Simple */}
            <div className="text-center space-y-6 pt-8">
              <p className="text-xl text-muted-foreground">
                Stop cleaning spreadsheets. <span className="text-foreground font-semibold">Start understanding your data.</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Data Sources Integration Section - NEW */}
      <section className="py-24 px-4 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center space-y-4 mb-16 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-bold">
              Connect Your Health Data
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Upload surveys, program data, and exports from monitoring tools.
              LabIQ Health supports multiple formats for comprehensive analysis.
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
          <div className="text-center space-y-6 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/upload">
                <Button size="lg" className="gap-2 text-base h-12 px-8 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105">
                  <Upload className="w-5 h-5" />
                  Upload Files
                </Button>
              </Link>
              <Link to="/upload?mode=connect">
                <Button size="lg" variant="outline" className="gap-2 text-base h-12 px-8 rounded-full hover:scale-105 transition-all border-primary/50 hover:border-primary">
                  <Cloud className="w-5 h-5" />
                  Connect Cloud Sources
                </Button>
              </Link>
              <Link to="/upload?mode=database">
                <Button size="lg" variant="outline" className="gap-2 text-base h-12 px-8 rounded-full hover:scale-105 transition-all">
                  <Server className="w-5 h-5" />
                  Link Database
                </Button>
              </Link>
            </div>
          </div>

          {/* Disclaimer */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            For research and analysis purposes only. Not for real-time clinical decision-making.
          </p>
        </div>
      </section>

      {/* NEW: Automation Intelligence Banner */}
      <section className="py-16 px-4 bg-gradient-to-r from-primary/5 via-background to-secondary/5 border-y border-border/40">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                <Zap className="w-4 h-4 text-primary animate-pulse" />
                <span className="text-sm font-medium text-primary">Automation-First Intelligence</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold leading-tight">
                Your data doesn't just sit there.<br />
                <span className="text-muted-foreground">It drives the entire system.</span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                When you connect a cloud source or upload a dataset, LabIQ Health doesn't wait for you to click buttons.
                The system <strong>automatically:</strong>
              </p>
              <ul className="space-y-3">
                {[
                  { icon: Database, text: "Validates & profiles your data" },
                  { icon: Brain, text: "Classifies the health domain" },
                  { icon: Workflow, text: "Triggers relevant analysis workflows" },
                  { icon: HeartPulse, text: "Detects anomalies & quality issues" },
                  { icon: TrendingUp, text: "Generates AI insights you didn't ask for" },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <li key={idx} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-foreground">{item.text}</span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <Card className="p-8 bg-card border-primary/20 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold">Connect Your First Data Source</h3>
                  <p className="text-sm text-muted-foreground">Watch the automation unfold</p>
                </div>

                <div className="space-y-3">
                  <Link to="/upload?mode=connect" className="block">
                    <Button size="lg" className="w-full gap-3 h-14 text-base justify-start px-6 rounded-xl hover:scale-[1.02] transition-all">
                      <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                        <Cloud className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">Cloud Platforms</div>
                        <div className="text-xs opacity-80">Google Drive, Dropbox, S3, Azure</div>
                      </div>
                    </Button>
                  </Link>

                  <Link to="/upload?mode=database" className="block">
                    <Button size="lg" variant="outline" className="w-full gap-3 h-14 text-base justify-start px-6 rounded-xl hover:scale-[1.02] transition-all">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Server className="w-5 h-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">Databases & Warehouses</div>
                        <div className="text-xs text-muted-foreground">PostgreSQL, Snowflake, BigQuery</div>
                      </div>
                    </Button>
                  </Link>

                  <Link to="/device-streams" className="block">
                    <Button size="lg" variant="outline" className="w-full gap-3 h-14 text-base justify-start px-6 rounded-xl hover:scale-[1.02] transition-all">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Activity className="w-5 h-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">Live Device Streams</div>
                        <div className="text-xs text-muted-foreground">Wearables, IoT, real-time APIs</div>
                      </div>
                    </Button>
                  </Link>
                </div>

                <div className="pt-4 border-t border-border/40">
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Lock className="w-3 h-3" />
                    <span>End-to-end encrypted. Your data never leaves your control.</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* What We Do Section - Clear Value Proposition */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center space-y-4 mb-16 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-bold">
              What is LabIQ Health?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              An AI-powered workspace that helps researchers, analysts, and program teams
              clean data, uncover insights, collaborate, and generate reports—all in one place
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
                  Complete Health Data Analysis Workspace
                </h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  From data upload to insights and reporting, LabIQ Health gives health and public health
                  teams everything they need to analyze data, collaborate, and communicate results.
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

      {/* Value Proposition Section - Clean & Professional */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center space-y-12">
            {/* Main Statement */}
            <div className="space-y-6">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-foreground">
                Every second counts.<br />Every insight matters.
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                LabIQ Health delivers real-time intelligence for modern research teams.
              </p>
            </div>

            {/* Stats - Clean version */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8">
              {[
                { value: "10x", label: "Faster Analysis" },
                { value: "5 min", label: "To First Insight" },
                { value: "24/7", label: "AI Assistant" },
                { value: "10+", label: "Data Sources" }
              ].map((stat, idx) => (
                <div
                  key={stat.label}
                  className="p-6 rounded-lg border border-border bg-card hover:border-primary/50 transition-all duration-300 animate-fade-in-up"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className="space-y-2 text-center">
                    <div className="text-4xl font-bold text-primary">
                      {stat.value}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {stat.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
                  LabIQ Health adapts to your field of study and research focus,
                  providing specialized analysis across multiple health domains
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
                      <BarChart3 className="w-5 h-5 text-white" />
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
                    { step: "2", text: "Upload your health dataset (CSV, Excel, JSON)", icon: Upload },
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

      {/* Call-to-Action Section - Professional & Confident */}
      <section className="py-24 px-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center space-y-6 mb-16 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-bold">
              Experience LabIQ Health in Action
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              See how leading research teams are transforming their data analysis workflow.
              Choose the best way to get started.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Book a Demo */}
            <Card className="p-8 border-primary/50 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group animate-fade-in-up bg-gradient-to-br from-primary/5 to-background">
              <div className="space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Book a Demo</h3>
                  <p className="text-muted-foreground">
                    See LabIQ Health's full capabilities in a personalized walkthrough with our team.
                  </p>
                </div>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>30-minute personalized demo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>Q&A with product experts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>Custom use-case discussion</span>
                  </li>
                </ul>
                <Button size="lg" className="w-full gap-2 group-hover:scale-105 transition-all">
                  <MessageSquare className="w-5 h-5" />
                  Schedule Demo
                </Button>
              </div>
            </Card>

            {/* Watch Demo Video */}
            <Card className="p-8 border-border/50 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Watch Demo</h3>
                  <p className="text-muted-foreground">
                    See a quick walkthrough of how LabIQ Health transforms research data into insights.
                  </p>
                </div>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>5-minute overview video</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>Real use-case examples</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>Key features showcase</span>
                  </li>
                </ul>
                <Button size="lg" variant="outline" className="w-full gap-2 group-hover:scale-105 transition-all">
                  <Play className="w-5 h-5" />
                  Watch Now
                </Button>
              </div>
            </Card>

            {/* Start Free */}
            <Card className="p-8 border-border/50 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Rocket className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Start Free</h3>
                  <p className="text-muted-foreground">
                    Jump right in and explore LabIQ Health with your own data. No credit card required.
                  </p>
                </div>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>Instant access</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>Upload your data immediately</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>Upgrade anytime</span>
                  </li>
                </ul>
                <Link to="/dashboard">
                  <Button size="lg" className="w-full gap-2 group-hover:scale-105 transition-all">
                    <Rocket className="w-5 h-5" />
                    Get Started
                  </Button>
                </Link>
              </div>
            </Card>
          </div>

          {/* Contact Options */}
          <div className="mt-16 text-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <p className="text-muted-foreground mb-4">Questions? We're here to help.</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button variant="ghost" className="gap-2">
                <MessageSquare className="w-4 h-4" />
                Chat with Sales
              </Button>
              <Button variant="ghost" className="gap-2">
                <FileText className="w-4 h-4" />
                View Documentation
              </Button>
              <Link to="/pricing">
                <Button variant="ghost" className="gap-2">
                  <TrendingUp className="w-4 h-4" />
                  See Pricing
                </Button>
              </Link>
            </div>
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
            Join researchers worldwide who trust LabIQ Health for intelligent data analysis.
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

      {/* Footer - Enhanced */}
      <footer className="py-16 px-4 border-t border-border bg-muted/30">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
            {/* Brand Section */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                  <HeartPulse className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  LabIQ Health
                </span>
              </div>
              <p className="text-muted-foreground leading-relaxed max-w-sm">
                AI-powered health data intelligence platform transforming how researchers analyze data and make discoveries.
              </p>
              {/* Social Links */}
              <div className="flex gap-3">
                <Button size="icon" variant="outline" className="rounded-lg hover:bg-primary/10 hover:border-primary transition-all">
                  <Twitter className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="outline" className="rounded-lg hover:bg-primary/10 hover:border-primary transition-all">
                  <Github className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="outline" className="rounded-lg hover:bg-primary/10 hover:border-primary transition-all">
                  <Linkedin className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="outline" className="rounded-lg hover:bg-primary/10 hover:border-primary transition-all">
                  <Mail className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Product Links */}
            <div className="space-y-4">
              <h4 className="font-bold text-foreground text-sm uppercase tracking-wider">Product</h4>
              <ul className="space-y-3">
                <li><Link to="/dashboard" className="text-muted-foreground hover:text-primary transition-colors font-medium">Dashboard</Link></li>
                <li><Link to="/upload" className="text-muted-foreground hover:text-primary transition-colors font-medium">Upload Data</Link></li>
                <li><Link to="/datasets" className="text-muted-foreground hover:text-primary transition-colors font-medium">Datasets</Link></li>
                <li><Link to="/experiments" className="text-muted-foreground hover:text-primary transition-colors font-medium">Experiments</Link></li>
                <li><Link to="/models" className="text-muted-foreground hover:text-primary transition-colors font-medium">AI Models</Link></li>
                <li><Link to="/automation" className="text-muted-foreground hover:text-primary transition-colors font-medium">Automation</Link></li>
              </ul>
            </div>

            {/* Features Links */}
            <div className="space-y-4">
              <h4 className="font-bold text-foreground text-sm uppercase tracking-wider">Features</h4>
              <ul className="space-y-3">
                <li><Link to="/analytics" className="text-muted-foreground hover:text-primary transition-colors font-medium">Analytics</Link></li>
                <li><Link to="/insights" className="text-muted-foreground hover:text-primary transition-colors font-medium">AI Insights</Link></li>
                <li><Link to="/assistant" className="text-muted-foreground hover:text-primary transition-colors font-medium">AI Assistant</Link></li>
                <li><Link to="/collaboration" className="text-muted-foreground hover:text-primary transition-colors font-medium">Collaboration</Link></li>
                <li><Link to="/reports" className="text-muted-foreground hover:text-primary transition-colors font-medium">Reports</Link></li>
                <li><Link to="/pricing" className="text-muted-foreground hover:text-primary transition-colors font-medium">Pricing</Link></li>
              </ul>
            </div>

            {/* Company Links */}
            <div className="space-y-4">
              <h4 className="font-bold text-foreground text-sm uppercase tracking-wider">Company</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors font-medium">About Us</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors font-medium">Blog</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors font-medium">Careers</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors font-medium">Contact</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors font-medium">Privacy Policy</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors font-medium">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-border">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-muted-foreground">
                © 2025 <span className="font-bold text-foreground">LabIQ Health</span>. All rights reserved.
              </p>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <a href="#" className="hover:text-foreground transition-colors font-medium">Privacy</a>
                <a href="#" className="hover:text-foreground transition-colors font-medium">Terms</a>
                <a href="#" className="hover:text-foreground transition-colors font-medium">Security</a>
                <a href="#" className="hover:text-foreground transition-colors font-medium">Status</a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      <ScrollToTop />
    </div>
  );
};

export default Index;
