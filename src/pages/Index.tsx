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
  CheckCircle2
} from "lucide-react";

const Index = () => {
  const features = [
    {
      icon: Brain,
      title: "AutoML Intelligence",
      description: "Automatically detect data patterns and build predictive models without coding"
    },
    {
      icon: Lock,
      title: "Enterprise Security",
      description: "End-to-end encryption with role-based access control and audit logs"
    },
    {
      icon: Zap,
      title: "Real-Time Insights",
      description: "Get instant natural-language explanations of your experimental data"
    },
    {
      icon: TrendingUp,
      title: "Predictive Analytics",
      description: "Forecast outcomes and identify key factors driving your results"
    },
    {
      icon: Users,
      title: "Collaborative Workspace",
      description: "Share datasets, models, and insights with your research team"
    },
    {
      icon: FlaskConical,
      title: "Lab-Ready Integration",
      description: "Connect with your existing laboratory systems via API"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6">
            <div className="inline-block">
              <div className="px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 text-sm font-medium">
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  AI-Powered Laboratory Intelligence
                </span>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
              Transform Lab Data
              <br />
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Into Discoveries
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              LabIQ uses AutoML to analyze experimental data and generate instant, explainable insights.
              No coding required. Just upload your data and let AI do the science.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link to="/dashboard">
                <Button size="lg" className="gap-2 text-lg h-14 px-8">
                  Get Started
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/upload">
                <Button size="lg" variant="outline" className="gap-2 text-lg h-14 px-8">
                  <FlaskConical className="w-5 h-5" />
                  Upload Data
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              Everything Your Lab Needs
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From data ingestion to model deployment, LabIQ provides a complete platform for laboratory intelligence
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="p-6 hover:shadow-lg transition-all hover:-translate-y-1">
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                Built for Modern Research
              </h2>
              <p className="text-lg text-muted-foreground">
                LabIQ adapts to your field of study and experimental design, providing specialized analysis for:
              </p>
              <div className="space-y-3">
                {[
                  "Chemistry & Materials Science",
                  "Biology & Life Sciences",
                  "Agricultural Research",
                  "Clinical Trials & Diagnostics",
                  "Environmental Science",
                  "Quality Control & Testing"
                ].map((useCase) => (
                  <div key={useCase} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                    <span className="text-foreground">{useCase}</span>
                  </div>
                ))}
              </div>
              <Link to="/dashboard">
                <Button size="lg" className="gap-2 mt-4">
                  Start Your First Project
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
            
            <Card className="p-8 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
              <div className="space-y-6">
                <h3 className="text-2xl font-bold">Quick Start Guide</h3>
                <div className="space-y-4">
                  {[
                    { step: "1", text: "Create a new project" },
                    { step: "2", text: "Upload your experimental data" },
                    { step: "3", text: "Let AutoML analyze patterns" },
                    { step: "4", text: "Review insights and predictions" },
                    { step: "5", text: "Deploy models or export results" }
                  ].map((item) => (
                    <div key={item.step} className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold flex-shrink-0">
                        {item.step}
                      </div>
                      <p className="text-foreground pt-1">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="container mx-auto max-w-4xl text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">
            Ready to Transform Your Lab Data?
          </h2>
          <p className="text-lg text-muted-foreground">
            Join researchers worldwide who trust LabIQ for intelligent data analysis
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link to="/dashboard">
              <Button size="lg" className="gap-2">
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline">
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
