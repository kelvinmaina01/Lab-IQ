import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  X,
  ArrowRight,
  ArrowLeft,
  Check,
  Bot,
  Upload,
  Database,
  FlaskConical,
  Brain,
  TrendingUp,
  Zap,
  Target,
  Users,
  FileText,
  MessageSquare,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface TourStep {
  id: string;
  title: string;
  description: string;
  route: string;
  targetSelector: string; // CSS selector to highlight
  position: "top" | "bottom" | "left" | "right";
  spotlightPadding?: number;
}

const systemWalkthrough: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to LabIQ Health",
    description: "Hello! I'm your LabIQ Health guide. In just a few minutes, I will walk you through every feature of our platform. Let's explore what makes LabIQ Health the most powerful tool for your research.",
    route: "/dashboard",
    targetSelector: "",
    position: "bottom",
  },
  {
    id: "dashboard",
    title: "DASHBOARD - Your Command Center",
    description: "This is your home base. Here you see all your key metrics at a glance: active datasets, running experiments, AI requests, and automation status. Your recent activities appear here in real-time.",
    route: "/dashboard",
    targetSelector: "[data-tour='dashboard-stats']",
    position: "bottom",
  },
  {
    id: "upload",
    title: "UPLOAD - Start Your Research Journey",
    description: "Here you upload your research data. Drag and drop CSV, Excel, or JSON files. LabIQ Health automatically validates data quality, detects column types, and flags any issues before processing.",
    route: "/upload",
    targetSelector: "[data-tour='upload-zone']",
    position: "top",
  },
  {
    id: "datasets",
    title: "DATASETS - Your Data Library",
    description: "Here you manage all your uploaded datasets. Each dataset shows quality scores, row/column counts, and processing status. Click any dataset to explore its contents, statistics, and visualizations.",
    route: "/datasets",
    targetSelector: "[data-tour='datasets-grid']",
    position: "top",
  },
  {
    id: "experiments",
    title: "EXPERIMENTS - Track Your Science",
    description: "Here you document and track every experiment. Record hypotheses, parameters, methods, and results. Compare multiple experiment runs side-by-side to identify what works best.",
    route: "/experiments",
    targetSelector: "[data-tour='experiments-list']",
    position: "top",
  },
  {
    id: "models",
    title: "MODELS - AI Without Code",
    description: "Here you train machine learning models without writing a single line of code. Select your dataset, choose target variables, and our AutoML engine does the rest: algorithm selection, hyperparameter tuning, and cross-validation.",
    route: "/models",
    targetSelector: "[data-tour='models-grid']",
    position: "top",
  },
  {
    id: "analytics",
    title: "ANALYTICS - Deep Data Insights",
    description: "Here you explore your data through interactive charts and statistical analyses. Create custom visualizations, run correlation analyses, perform hypothesis tests, and detect outliers with AI assistance.",
    route: "/analytics",
    targetSelector: "[data-tour='analytics-charts']",
    position: "top",
  },
  {
    id: "automation",
    title: "AUTOMATION - Smart Workflows",
    description: "Here you create workflows that run automatically. Set up triggers (new data upload, schedule, threshold breach) and chain actions (quality check, model training, report generation). Choose from 18 industry-specific templates.",
    route: "/automation",
    targetSelector: "[data-tour='workflows-list']",
    position: "top",
  },
  {
    id: "insights",
    title: "INSIGHTS - AI-Powered Discoveries",
    description: "Here our AI continuously analyzes your data in the background. It discovers hidden patterns, detects anomalies, finds correlations you might miss, and provides actionable recommendations to improve your research.",
    route: "/insights",
    targetSelector: "[data-tour='insights-feed']",
    position: "top",
  },
  {
    id: "collaboration",
    title: "COLLABORATION - Teamwork & Sharing",
    description: "Here you invite team members and collaborate in real-time. Share datasets with granular permissions, comment on experiments, track who contributed what, and view team leaderboards to recognize top contributors.",
    route: "/collaboration",
    targetSelector: "[data-tour='team-section']",
    position: "top",
  },
  {
    id: "reports",
    title: "REPORTS - Professional Output",
    description: "Here you generate publication-ready reports automatically. Choose a template, select datasets and visualizations, and LabIQ Health compiles everything into PDF, Word, or HTML formats. Perfect for presentations, papers, or regulatory submissions.",
    route: "/reports",
    targetSelector: "[data-tour='reports-builder']",
    position: "top",
  },
  {
    id: "assistant",
    title: "AI ASSISTANT - Your Research Partner",
    description: "Here you can ask questions about your data in natural language. The AI assistant understands your research context, suggests analyses, generates code for custom operations, and helps troubleshoot issues 24/7.",
    route: "/assistant",
    targetSelector: "[data-tour='chat-interface']",
    position: "top",
  },
  {
    id: "complete",
    title: "Tour Complete - You're Ready!",
    description: "Excellent! You now know every major feature in LabIQ Health. Start by uploading your first dataset, or explore the automation templates. Remember, you can restart this tour anytime from Settings. Happy researching!",
    route: "/dashboard",
    targetSelector: "",
    position: "bottom",
  },
];

const dashboardWalkthrough: TourStep[] = [
  {
    id: "welcome",
    title: "Dashboard Tour",
    description: "Hello! Let me give you a quick tour of your Dashboard - your mission control for all research activities. This will only take 30 seconds!",
    route: "/dashboard",
    targetSelector: "",
    position: "bottom",
  },
  {
    id: "metrics",
    title: "KEY METRICS - Your Stats",
    description: "Here you see your current usage at a glance. Track how many datasets you've uploaded, experiments you're running, AI requests you've made, and automations you have active. Each card shows your limit so you know when to upgrade.",
    route: "/dashboard",
    targetSelector: "[data-tour='dashboard-stats']",
    position: "bottom",
  },
  {
    id: "insights",
    title: "PREDICTIVE INSIGHTS - AI Suggestions",
    description: "Here you get AI-powered predictions and recommendations. LabIQ Health analyzes your patterns and suggests next best actions, predicts experiment outcomes, and identifies potential bottlenecks before they slow you down.",
    route: "/dashboard",
    targetSelector: "",
    position: "left",
  },
  {
    id: "activities",
    title: "RECENT ACTIVITY - Live Feed",
    description: "Here you track everything happening in real-time. See when datasets are uploaded, experiments complete, models finish training, reports are generated, and workflows execute. It's your research pulse monitor.",
    route: "/dashboard",
    targetSelector: "",
    position: "left",
  },
  {
    id: "performance",
    title: "LAB EFFICIENCY - Your Score",
    description: "Here you see how your lab is performing. The efficiency score combines model accuracy, processing speed, data quality, and team collaboration. Track improvements over time and compare against industry benchmarks.",
    route: "/dashboard",
    targetSelector: "",
    position: "left",
  },
  {
    id: "complete",
    title: "Dashboard Mastered!",
    description: "Perfect! You now understand your Dashboard completely. This is your command center - come here anytime to monitor the pulse of your research. Ready to explore other features?",
    route: "/dashboard",
    targetSelector: "",
    position: "bottom",
  },
];

interface VirtualAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const VirtualAssistant = ({
  isOpen,
  onClose,
  onComplete,
}: VirtualAssistantProps) => {
  const [currentStep, setCurrentStep] = useState(-1); // -1 = choice screen
  const [tourType, setTourType] = useState<"system" | "dashboard" | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const tourSteps = tourType === "system" ? systemWalkthrough : tourType === "dashboard" ? dashboardWalkthrough : [];
  const step = currentStep >= 0 ? tourSteps[currentStep] : null;

  // Navigate to step's route
  useEffect(() => {
    if (step && step.route !== location.pathname) {
      navigate(step.route);
    }
  }, [currentStep, step, location.pathname, navigate]);

  // Highlight target element
  useEffect(() => {
    if (!step || !step.targetSelector) {
      // Remove all highlights
      document.querySelectorAll(".virtual-assistant-highlight").forEach((el) => {
        el.classList.remove("virtual-assistant-highlight");
      });
      return;
    }

    const target = document.querySelector(step.targetSelector);
    if (target) {
      target.classList.add("virtual-assistant-highlight");
      target.scrollIntoView({ behavior: "smooth", block: "center" });

      return () => {
        target.classList.remove("virtual-assistant-highlight");
      };
    }
  }, [step]);

  const handleSelectTour = (type: "system" | "dashboard") => {
    setTourType(type);
    setCurrentStep(0);
  };

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    onComplete();
    onClose();
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isOpen) return null;

  // Choice screen
  if (currentStep === -1) {
    return (
      <>
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" onClick={handleSkip} />
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[101]">
          <Card className="w-[400px] shadow-2xl border-2 border-primary/20">
            <CardContent className="p-6 space-y-6">
              {/* Assistant Avatar */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg animate-pulse">
                  <Bot className="w-9 h-9 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">LabIQ Health Virtual Assistant</h3>
                  <p className="text-sm text-muted-foreground">Your research guide</p>
                </div>
              </div>

              {/* Greeting */}
              <div className="space-y-2">
                <p className="text-base">
                  Hello! In just a few clicks I will guide you through our system interactively.
                </p>
                <p className="text-sm text-muted-foreground">
                  Choose how you'd like to explore:
                </p>
              </div>

              {/* Tour Options */}
              <div className="space-y-3">
                <Button
                  onClick={() => handleSelectTour("system")}
                  className="w-full h-auto py-4 flex flex-col items-start gap-2"
                  variant="outline"
                >
                  <div className="flex items-center gap-2 font-semibold">
                    <LayoutDashboard className="w-4 h-4" />
                    System Walkthrough
                    <Badge variant="secondary" className="ml-auto">13 steps</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground text-left font-normal">
                    Complete tour covering Dashboard, Upload, Datasets, Experiments, Models, Analytics, Automation, Insights, Collaboration, Reports, and AI Assistant
                  </p>
                </Button>

                <Button
                  onClick={() => handleSelectTour("dashboard")}
                  className="w-full h-auto py-4 flex flex-col items-start gap-2"
                  variant="outline"
                >
                  <div className="flex items-center gap-2 font-semibold">
                    <TrendingUp className="w-4 h-4" />
                    Dashboard Walkthrough
                    <Badge variant="secondary" className="ml-auto">6 steps</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground text-left font-normal">
                    Quick overview of metrics, insights, activities, and performance monitoring
                  </p>
                </Button>
              </div>

              {/* Skip */}
              <Button
                variant="ghost"
                onClick={handleSkip}
                className="w-full text-muted-foreground"
              >
                Skip for now
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // Tour screen
  if (!step) return null;

  return (
    <>
      {/* Floating Assistant Tooltip */}
      <div
        className={cn(
          "fixed z-[101] animate-in fade-in slide-in-from-bottom-4 duration-300",
          step.position === "top" && "bottom-20 left-1/2 transform -translate-x-1/2",
          step.position === "bottom" && "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
          step.position === "left" && "right-6 top-1/2 transform -translate-y-1/2",
          step.position === "right" && "left-6 top-1/2 transform -translate-y-1/2"
        )}
      >
        <Card className="w-[420px] shadow-2xl border-2 border-blue-500/40 bg-background/98 backdrop-blur-sm">
          <CardContent className="p-5 space-y-4">
            {/* Header with Avatar */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg flex-shrink-0 animate-pulse">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm mb-1">{step.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSkip}
                className="flex-shrink-0 h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
                />
              </div>
              <span className="whitespace-nowrap">
                {currentStep + 1} / {tourSteps.length}
              </span>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBack}
                disabled={currentStep === 0}
                className="gap-2"
              >
                <ArrowLeft className="w-3 h-3" />
                Back
              </Button>

              <Button
                size="sm"
                onClick={handleNext}
                className="gap-2"
              >
                {currentStep === tourSteps.length - 1 ? (
                  <>
                    Finish
                    <Check className="w-3 h-3" />
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-3 h-3" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pointer arrow - larger and more visible */}
        {step.targetSelector && (
          <div
            className={cn(
              "absolute",
              step.position === "top" && "top-full left-1/2 transform -translate-x-1/2 -translate-y-1",
              step.position === "bottom" && "bottom-full left-1/2 transform -translate-x-1/2 translate-y-1"
            )}
          >
            <div
              className={cn(
                "w-0 h-0",
                step.position === "top" && "border-l-[12px] border-r-[12px] border-t-[12px] border-transparent border-t-blue-500",
                step.position === "bottom" && "border-l-[12px] border-r-[12px] border-b-[12px] border-transparent border-b-blue-500"
              )}
            />
          </div>
        )}
      </div>

      {/* Global styles for highlight - soft glow, no background masking */}
      <style>{`
        .virtual-assistant-highlight {
          position: relative;
          z-index: 99 !important;
          box-shadow:
            0 0 0 3px rgba(59, 130, 246, 0.4),
            0 0 0 6px rgba(59, 130, 246, 0.2),
            0 0 20px rgba(59, 130, 246, 0.3) !important;
          border-radius: 8px;
          transition: all 0.4s ease;
          animation: pulse-highlight 2s infinite;
        }

        @keyframes pulse-highlight {
          0%, 100% {
            box-shadow:
              0 0 0 3px rgba(59, 130, 246, 0.4),
              0 0 0 6px rgba(59, 130, 246, 0.2),
              0 0 20px rgba(59, 130, 246, 0.3);
          }
          50% {
            box-shadow:
              0 0 0 3px rgba(59, 130, 246, 0.6),
              0 0 0 6px rgba(59, 130, 246, 0.3),
              0 0 25px rgba(59, 130, 246, 0.4);
          }
        }
      `}</style>
    </>
  );
};

export default VirtualAssistant;
