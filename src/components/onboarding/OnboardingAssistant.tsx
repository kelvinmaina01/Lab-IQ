import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  Check,
  Database,
  Upload,
  TrendingUp,
  Zap,
  Users,
  FileText,
  BarChart3,
  Beaker,
  Bot,
  Settings,
  PlayCircle,
  Target,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  route: string;
  highlightSelector?: string;
  position?: "center" | "left" | "right" | "top" | "bottom";
  action?: () => void;
  tips?: string[];
}

const tourSteps: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to LabIQ Health! 🎉",
    description: "I'm your AI assistant, here to guide you through the most powerful laboratory data platform. Let's discover how LabIQ Health transforms your research workflow with cutting-edge AI and automation.",
    icon: Sparkles,
    route: "/dashboard",
    position: "center",
    tips: [
      "LabIQ Health supports Biotech, Pharmaceutical, Chemistry, and Clinical research",
      "Everything you need is just a click away",
      "Your data security is our top priority"
    ]
  },
  {
    id: "dashboard",
    title: "Your Command Center",
    description: "The Dashboard provides a comprehensive overview of all your research activities. Monitor active experiments, track model performance, and stay updated with real-time insights—all in one beautifully designed interface.",
    icon: BarChart3,
    route: "/dashboard",
    highlightSelector: "[data-tour='dashboard-stats']",
    position: "top",
    tips: [
      "Quick stats show your research progress at a glance",
      "Recent activity keeps you connected to your team",
      "Smart notifications alert you to important events"
    ]
  },
  {
    id: "upload",
    title: "Effortless Data Upload",
    description: "Upload your research data with confidence. LabIQ Health intelligently processes CSV, Excel, and other formats, automatically detecting data types and quality issues. Drag, drop, and let our AI do the heavy lifting.",
    icon: Upload,
    route: "/upload",
    highlightSelector: "[data-tour='upload-zone']",
    position: "center",
    tips: [
      "Supports CSV, XLSX, and more formats",
      "Automatic data validation and quality checks",
      "Secure cloud storage with version control"
    ]
  },
  {
    id: "datasets",
    title: "Intelligent Data Management",
    description: "Your Datasets hub is where raw data becomes research gold. Browse, filter, and analyze your datasets with powerful AI tools. Each dataset comes with automatic quality metrics, statistical summaries, and visualization previews.",
    icon: Database,
    route: "/datasets",
    highlightSelector: "[data-tour='datasets-grid']",
    position: "left",
    tips: [
      "Advanced search and filtering",
      "Automatic quality scoring",
      "One-click data visualization"
    ]
  },
  {
    id: "experiments",
    title: "Track Your Scientific Journey",
    description: "Experiments keep your research organized and reproducible. Document hypotheses, track parameters, and compare results side-by-side. LabIQ Health automatically logs every detail, so you never lose track of what worked.",
    icon: Beaker,
    route: "/experiments",
    highlightSelector: "[data-tour='experiments-list']",
    position: "right",
    tips: [
      "Version control for experiments",
      "Compare multiple runs instantly",
      "Export results in publication-ready formats"
    ]
  },
  {
    id: "models",
    title: "AI-Powered Predictive Models",
    description: "Train machine learning models without writing a single line of code! Our AutoML engine automatically selects the best algorithms, tunes hyperparameters, and validates results. From regression to classification, we've got you covered.",
    icon: Bot,
    route: "/models",
    highlightSelector: "[data-tour='models-grid']",
    position: "center",
    tips: [
      "No coding required - just click and train",
      "Automatic feature engineering",
      "Model explanations with SHAP values"
    ]
  },
  {
    id: "analytics",
    title: "Deep Insights at Your Fingertips",
    description: "Analytics transforms data into decisions. Explore interactive visualizations, statistical analyses, and trend predictions. Our AI highlights anomalies and patterns you might miss, turning complex data into clear answers.",
    icon: TrendingUp,
    route: "/analytics",
    highlightSelector: "[data-tour='analytics-charts']",
    position: "top",
    tips: [
      "Interactive charts and graphs",
      "Statistical hypothesis testing",
      "AI-powered anomaly detection"
    ]
  },
  {
    id: "automation",
    title: "Workflow Automation Magic",
    description: "Stop repeating yourself! Create intelligent workflows that run automatically when new data arrives. From quality checks to model training to report generation—automate it all and focus on what matters: your science.",
    icon: Zap,
    route: "/automation",
    highlightSelector: "[data-tour='workflows-list']",
    position: "center",
    tips: [
      "18 industry-specific templates",
      "Visual workflow builder",
      "Real-time execution monitoring with AI insights"
    ]
  },
  {
    id: "insights",
    title: "AI-Generated Discoveries",
    description: "Insights is where LabIQ Health's AI shines. Our algorithms continuously analyze your data, discovering patterns, correlations, and anomalies. Get personalized recommendations tailored to your research goals.",
    icon: Target,
    route: "/insights",
    highlightSelector: "[data-tour='insights-feed']",
    position: "left",
    tips: [
      "Real-time AI analysis",
      "Actionable recommendations",
      "Priority-ranked discoveries"
    ]
  },
  {
    id: "collaboration",
    title: "Teamwork Made Seamless",
    description: "Science is better together. Share datasets, collaborate on experiments, and track team contributions with integrated leaderboards. Comment, discuss, and discover together in real-time.",
    icon: Users,
    route: "/collaboration",
    highlightSelector: "[data-tour='team-section']",
    position: "right",
    tips: [
      "Real-time collaboration",
      "Team leaderboards and achievements",
      "Secure sharing with granular permissions"
    ]
  },
  {
    id: "reports",
    title: "Professional Reporting",
    description: "Generate stunning, publication-ready reports in seconds. LabIQ Health compiles your data, visualizations, and insights into beautiful documents. Perfect for presentations, publications, or regulatory submissions.",
    icon: FileText,
    route: "/reports",
    highlightSelector: "[data-tour='reports-builder']",
    position: "center",
    tips: [
      "Customizable templates",
      "Export to PDF, Word, or HTML",
      "Automatic compliance formatting"
    ]
  },
  {
    id: "assistant",
    title: "Your AI Research Partner",
    description: "Meet your 24/7 AI assistant! Ask questions about your data, get analysis suggestions, or troubleshoot issues. Powered by advanced language models, it understands your research context and provides expert guidance.",
    icon: Sparkles,
    route: "/assistant",
    highlightSelector: "[data-tour='chat-interface']",
    position: "bottom",
    tips: [
      "Natural language queries",
      "Context-aware responses",
      "Code generation for custom analyses"
    ]
  },
  {
    id: "complete",
    title: "You're All Set! 🚀",
    description: "Congratulations! You've completed the tour. LabIQ Health is now your research superpower. Start by uploading your first dataset, or explore the templates in Automation. Remember, I'm always here if you need help—just click the help icon!",
    icon: Check,
    route: "/dashboard",
    position: "center",
    tips: [
      "Start with Upload to add your first dataset",
      "Try AutoML for quick model training",
      "Explore Templates in Automation for common workflows"
    ]
  }
];

interface OnboardingAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const OnboardingAssistant = ({ isOpen, onClose, onComplete }: OnboardingAssistantProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const step = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;
  const Icon = step.icon;

  useEffect(() => {
    if (isOpen && isPlaying && step.route !== location.pathname) {
      navigate(step.route);
    }
  }, [currentStep, isOpen, isPlaying, step.route, location.pathname, navigate]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      setIsPlaying(true);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const handleComplete = async () => {
    // Save completion to user preferences
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            onboarding_completed: true,
            onboarding_completed_at: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error('Error saving onboarding completion:', error);
    }

    onComplete();
    onClose();
  };

  const handleStepClick = (index: number) => {
    setCurrentStep(index);
    setIsPlaying(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-gradient-to-br from-purple-500 to-blue-500">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl">LabIQ Health Tour Guide</DialogTitle>
                <DialogDescription>
                  Let me show you around • Step {currentStep + 1} of {tourSteps.length}
                </DialogDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleSkip}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{Math.round(progress)}% Complete</span>
            <span>{tourSteps.length - currentStep - 1} steps remaining</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6 py-4">
          {/* Step Icon & Title */}
          <div className="text-center space-y-4">
            <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20">
              <Icon className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">{step.title}</h2>
          </div>

          {/* Description */}
          <Card className="p-6 bg-gradient-to-br from-background to-muted/50 border-2">
            <p className="text-lg leading-relaxed text-muted-foreground">
              {step.description}
            </p>
          </Card>

          {/* Tips */}
          {step.tips && step.tips.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="font-semibold">Pro Tips:</h3>
              </div>
              <div className="grid gap-2">
                {step.tips.map((tip, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10"
                  >
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">{index + 1}</span>
                    </div>
                    <p className="text-sm text-muted-foreground flex-1">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Navigation */}
          <div className="border-t pt-4">
            <p className="text-xs text-muted-foreground mb-3">Jump to:</p>
            <div className="flex flex-wrap gap-2">
              {tourSteps.map((s, index) => (
                <Button
                  key={s.id}
                  variant={index === currentStep ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleStepClick(index)}
                  className="text-xs"
                >
                  {index + 1}. {s.id === "welcome" ? "Start" : s.id === "complete" ? "Finish" : s.title.split(" ")[0]}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            <Button variant="ghost" onClick={handleSkip}>
              Skip Tour
            </Button>
          </div>

          <Button onClick={handleNext} className="gap-2">
            {currentStep === tourSteps.length - 1 ? (
              <>
                Complete Tour
                <Check className="w-4 h-4" />
              </>
            ) : (
              <>
                Next Step
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingAssistant;
