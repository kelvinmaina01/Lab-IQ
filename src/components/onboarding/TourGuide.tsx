import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  X,
  ArrowRight,
  ArrowLeft,
  Check,
  Bot,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface GuideStep {
  id: string;
  title: string;
  description: string;
  route: string;
  targetSelector: string;
  arrowSide: "top" | "bottom" | "left" | "right";
}

const fullTourSteps: GuideStep[] = [
  {
    id: "welcome",
    title: "Welcome to Lab-IQ!",
    description: "Let me guide you through every feature. Use Next/Back to navigate at your pace.",
    route: "/dashboard",
    targetSelector: "",
    arrowSide: "left",
  },
  {
    id: "dashboard",
    title: "Dashboard Overview",
    description: "Your command center showing key metrics, activities, and performance scores.",
    route: "/dashboard",
    targetSelector: "[data-tour='dashboard-stats']",
    arrowSide: "bottom",
  },
  {
    id: "sidebar-upload",
    title: "Upload Data",
    description: "Click here to upload CSV, Excel, or JSON files for analysis.",
    route: "/dashboard",
    targetSelector: "a[href='/upload']",
    arrowSide: "right",
  },
  {
    id: "upload-zone",
    title: "Drop Zone",
    description: "Drag and drop files here. Auto-validation and quality checks included.",
    route: "/upload",
    targetSelector: "[data-tour='upload-zone']",
    arrowSide: "top",
  },
  {
    id: "sidebar-datasets",
    title: "Datasets Library",
    description: "Manage all your uploaded datasets with quality metrics and search.",
    route: "/upload",
    targetSelector: "a[href='/datasets']",
    arrowSide: "right",
  },
  {
    id: "datasets-grid",
    title: "Browse Datasets",
    description: "View all datasets with quality scores, size, and status at a glance.",
    route: "/datasets",
    targetSelector: "[data-tour='datasets-grid']",
    arrowSide: "top",
  },
  {
    id: "sidebar-experiments",
    title: "Experiments",
    description: "Document and track all your research experiments with full reproducibility.",
    route: "/datasets",
    targetSelector: "a[href='/experiments']",
    arrowSide: "right",
  },
  {
    id: "experiments-list",
    title: "Experiment Log",
    description: "View and compare all experiments side-by-side.",
    route: "/experiments",
    targetSelector: "[data-tour='experiments-list']",
    arrowSide: "top",
  },
  {
    id: "sidebar-models",
    title: "AI Models",
    description: "Train machine learning models without writing code - AutoML powered.",
    route: "/experiments",
    targetSelector: "a[href='/models']",
    arrowSide: "right",
  },
  {
    id: "models-interface",
    title: "Model Training",
    description: "Select dataset and target - AutoML handles algorithms and tuning.",
    route: "/models",
    targetSelector: "[data-tour='models-grid']",
    arrowSide: "top",
  },
  {
    id: "sidebar-analytics",
    title: "Analytics",
    description: "Explore data through interactive visualizations and statistical tests.",
    route: "/models",
    targetSelector: "a[href='/analytics']",
    arrowSide: "right",
  },
  {
    id: "analytics-charts",
    title: "Data Visualizations",
    description: "Create custom charts, run correlations, and export for presentations.",
    route: "/analytics",
    targetSelector: "[data-tour='analytics-charts']",
    arrowSide: "top",
  },
  {
    id: "sidebar-automation",
    title: "Automation",
    description: "Create intelligent workflows with triggers and actions.",
    route: "/analytics",
    targetSelector: "a[href='/automation']",
    arrowSide: "right",
  },
  {
    id: "automation-workflows",
    title: "Smart Workflows",
    description: "Build pipelines using 18 industry-specific templates.",
    route: "/automation",
    targetSelector: "[data-tour='workflows-list']",
    arrowSide: "top",
  },
  {
    id: "sidebar-insights",
    title: "AI Insights",
    description: "AI continuously analyzes data and discovers patterns automatically.",
    route: "/automation",
    targetSelector: "a[href='/insights']",
    arrowSide: "right",
  },
  {
    id: "insights-feed",
    title: "Discoveries Feed",
    description: "AI-generated insights ranked by importance with recommendations.",
    route: "/insights",
    targetSelector: "[data-tour='insights-feed']",
    arrowSide: "top",
  },
  {
    id: "sidebar-collaboration",
    title: "Collaboration",
    description: "Invite team members and work together in real-time.",
    route: "/insights",
    targetSelector: "a[href='/collaboration']",
    arrowSide: "right",
  },
  {
    id: "collaboration-team",
    title: "Team Hub",
    description: "Share resources, track contributions, and view leaderboards.",
    route: "/collaboration",
    targetSelector: "[data-tour='team-section']",
    arrowSide: "top",
  },
  {
    id: "sidebar-reports",
    title: "Reports",
    description: "Generate publication-ready documents in PDF, Word, or HTML.",
    route: "/collaboration",
    targetSelector: "a[href='/reports']",
    arrowSide: "right",
  },
  {
    id: "reports-builder",
    title: "Report Builder",
    description: "Drag-drop sections and customize layouts for professional reports.",
    route: "/reports",
    targetSelector: "[data-tour='reports-builder']",
    arrowSide: "top",
  },
  {
    id: "sidebar-assistant",
    title: "AI Assistant",
    description: "Ask questions about your data in plain English - 24/7 support.",
    route: "/reports",
    targetSelector: "a[href='/assistant']",
    arrowSide: "right",
  },
  {
    id: "assistant-chat",
    title: "Chat Interface",
    description: "Have conversations with your data and get instant visual answers.",
    route: "/assistant",
    targetSelector: "[data-tour='chat-interface']",
    arrowSide: "top",
  },
  {
    id: "sidebar-settings",
    title: "Settings",
    description: "Manage profile, notifications, billing, and privacy settings.",
    route: "/assistant",
    targetSelector: "a[href='/settings']",
    arrowSide: "right",
  },
  {
    id: "complete",
    title: "Tour Complete! 🎉",
    description: "You're ready to start! Restart this tour anytime from Settings.",
    route: "/dashboard",
    targetSelector: "",
    arrowSide: "left",
  },
];

interface TourGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const TourGuide = ({ isOpen, onClose, onComplete }: TourGuideProps) => {
  const [currentStep, setCurrentStep] = useState(-1); // -1 = welcome screen, 0+ = tour steps
  const [cardPosition, setCardPosition] = useState({ top: "50%", left: "50%", transform: "translate(-50%, -50%)" });
  const [arrowStyle, setArrowStyle] = useState<React.CSSProperties>({});
  const [isNavigating, setIsNavigating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const step = currentStep >= 0 ? fullTourSteps[currentStep] : null;
  const progress = currentStep >= 0 ? ((currentStep + 1) / fullTourSteps.length) * 100 : 0;

  // Navigate to step's route
  useEffect(() => {
    if (!isOpen || !step) return;

    if (step.route !== location.pathname) {
      setIsNavigating(true);
      // Center card during navigation
      setCardPosition({
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      });
      setArrowStyle({ display: "none" });

      navigate(step.route);

      // Reset navigating state after navigation completes
      const timeout = setTimeout(() => {
        setIsNavigating(false);
      }, 300);

      return () => clearTimeout(timeout);
    } else {
      setIsNavigating(false);
    }
  }, [currentStep, step, location.pathname, navigate, isOpen]);

  // Position card and arrow
  useEffect(() => {
    if (!isOpen || !step || isNavigating) return;

    // Start with card centered while positioning
    setCardPosition({
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
    });
    setArrowStyle({ display: "none" });

    const positionElements = () => {
      if (!step.targetSelector) {
        // Center on screen
        setCardPosition({
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        });
        setArrowStyle({ display: "none" });
        return;
      }

      const target = document.querySelector(step.targetSelector) as HTMLElement;
      if (!target) {
        // If target not found, center the card and keep it visible
        console.log(`Target not found for ${step.id}: ${step.targetSelector}, centering card...`);
        setCardPosition({
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        });
        setArrowStyle({ display: "none" });
        return;
      }

      if (!cardRef.current) {
        console.log("Card ref not ready, centering...");
        return; // Don't update position yet
      }

      const targetRect = target.getBoundingClientRect();
      const cardWidth = 380;
      const cardHeight = cardRef.current.offsetHeight || 180;
      const gap = 20;

      let newPosition: any = {};
      let newArrowStyle: React.CSSProperties = {};

      // Highlight target with smooth scroll
      target.classList.add("tour-guide-highlight");

      // Use requestAnimationFrame for smoother scroll
      requestAnimationFrame(() => {
        target.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "center"
        });
      });

      // Calculate position based on arrow side
      switch (step.arrowSide) {
        case "right":
          // Card on right of target
          newPosition = {
            top: `${targetRect.top + targetRect.height / 2}px`,
            left: `${targetRect.right + gap}px`,
            transform: "translateY(-50%)",
          };
          newArrowStyle = {
            position: "absolute",
            left: "0px",
            top: "50%",
            transform: "translate3d(-12px, -50%, 0px)",
            width: "16px",
            height: "16px",
            background: "hsl(var(--card))",
            border: "2px solid hsl(183 90% 45%)",
            borderRight: "none",
            borderBottom: "none",
            rotate: "-45deg",
            zIndex: 1001,
          };
          break;
        case "left":
          // Card on left of target
          newPosition = {
            top: `${targetRect.top + targetRect.height / 2}px`,
            left: `${targetRect.left - cardWidth - gap}px`,
            transform: "translateY(-50%)",
          };
          newArrowStyle = {
            position: "absolute",
            right: "0px",
            top: "50%",
            transform: "translate3d(12px, -50%, 0px)",
            width: "16px",
            height: "16px",
            background: "hsl(var(--card))",
            border: "2px solid hsl(183 90% 45%)",
            borderLeft: "none",
            borderTop: "none",
            rotate: "-45deg",
            zIndex: 1001,
          };
          break;
        case "top":
          // Card above target
          newPosition = {
            top: `${targetRect.top - cardHeight - gap}px`,
            left: `${targetRect.left + targetRect.width / 2}px`,
            transform: "translateX(-50%)",
          };
          newArrowStyle = {
            position: "absolute",
            bottom: "0px",
            left: "50%",
            transform: "translate3d(-50%, 12px, 0px)",
            width: "16px",
            height: "16px",
            background: "hsl(var(--card))",
            border: "2px solid hsl(183 90% 45%)",
            borderTop: "none",
            borderRight: "none",
            rotate: "-45deg",
            zIndex: 1001,
          };
          break;
        case "bottom":
          // Card below target
          newPosition = {
            top: `${targetRect.bottom + gap}px`,
            left: `${targetRect.left + targetRect.width / 2}px`,
            transform: "translateX(-50%)",
          };
          newArrowStyle = {
            position: "absolute",
            top: "0px",
            left: "50%",
            transform: "translate3d(-50%, -12px, 0px)",
            width: "16px",
            height: "16px",
            background: "hsl(var(--card))",
            border: "2px solid hsl(183 90% 45%)",
            borderBottom: "none",
            borderLeft: "none",
            rotate: "-45deg",
            zIndex: 1001,
          };
          break;
      }

      // Ensure card stays within viewport
      const leftNum = parseInt(newPosition.left);
      const topNum = parseInt(newPosition.top);

      if (leftNum + cardWidth > window.innerWidth) {
        newPosition.left = `${window.innerWidth - cardWidth - 20}px`;
      }
      if (leftNum < 20) {
        newPosition.left = "20px";
      }
      if (topNum + cardHeight > window.innerHeight) {
        newPosition.top = `${window.innerHeight - cardHeight - 20}px`;
      }
      if (topNum < 20) {
        newPosition.top = "20px";
      }

      setCardPosition(newPosition);
      setArrowStyle(newArrowStyle);
    };

    // Aggressive retry positioning to handle page transitions and DOM loading
    const timeout1 = setTimeout(positionElements, 100);
    const timeout2 = setTimeout(positionElements, 300);
    const timeout3 = setTimeout(positionElements, 600);
    const timeout4 = setTimeout(positionElements, 1000);
    const timeout5 = setTimeout(positionElements, 1500);
    const timeout6 = setTimeout(positionElements, 2000);

    window.addEventListener("resize", positionElements);

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
      clearTimeout(timeout4);
      clearTimeout(timeout5);
      clearTimeout(timeout6);
      window.removeEventListener("resize", positionElements);
      document.querySelectorAll(".tour-guide-highlight").forEach((el) => {
        el.classList.remove("tour-guide-highlight");
      });
    };
  }, [currentStep, step, isOpen, isNavigating, location.pathname]);

  const handleNext = () => {
    if (currentStep < fullTourSteps.length - 1) {
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

  if (!isOpen) return null;

  // Welcome screen - Show before tour starts
  if (currentStep === -1) {
    return (
      <>
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" onClick={onClose} />
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[101]">
          <Card className="w-[450px] shadow-2xl border-2 border-primary/30 bg-card">
            <div className="p-8 space-y-6">
              {/* Assistant Avatar */}
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[hsl(183,90%,45%)] via-[hsl(190,80%,45%)] to-[hsl(280,65%,60%)] flex items-center justify-center shadow-lg animate-pulse">
                  <Bot className="w-11 h-11 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-2xl mb-2">Welcome to Lab-IQ!</h3>
                  <p className="text-sm text-muted-foreground">Your intelligent research companion</p>
                </div>
              </div>

              {/* Welcome Message */}
              <div className="space-y-3 text-center">
                <p className="text-base leading-relaxed text-foreground">
                  Let me show you around! I'll guide you through every feature of Lab-IQ in an interactive tour.
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="w-4 h-4 text-[hsl(280,65%,60%)]" />
                  <span>{fullTourSteps.length} steps · ~5 minutes</span>
                </div>
              </div>

              {/* Tour Features */}
              <div className="space-y-2 bg-primary/10 dark:bg-primary/20 rounded-lg p-4 border border-primary/20">
                <p className="text-xs font-semibold text-primary mb-2">TOUR INCLUDES:</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-foreground/80">
                  <div>✓ Dashboard</div>
                  <div>✓ Upload & Datasets</div>
                  <div>✓ Experiments</div>
                  <div>✓ AI Models</div>
                  <div>✓ Analytics</div>
                  <div>✓ Automation</div>
                  <div>✓ Insights</div>
                  <div>✓ AI Assistant</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <Button
                  onClick={() => setCurrentStep(0)}
                  className="w-full h-12 text-base gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all"
                >
                  <Sparkles className="w-5 h-5" />
                  Start Tour
                  <ArrowRight className="w-5 h-5" />
                </Button>

                <Button
                  variant="ghost"
                  onClick={onClose}
                  className="w-full text-muted-foreground hover:text-foreground"
                >
                  Skip for now
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </>
    );
  }

  // Tour hasn't started yet or invalid step
  if (!step) return null;

  return (
    <>
      {/* Guide Card */}
      <div
        ref={cardRef}
        style={{
          position: "fixed",
          ...cardPosition,
          zIndex: 1000,
          transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        className={cn(
          "animate-in fade-in zoom-in duration-300",
          isNavigating && "opacity-75"
        )}
      >
        <Card className="w-[380px] shadow-2xl border-2 border-primary bg-card relative">
          {/* Arrow protruding from card border */}
          {step.targetSelector && (
            <>
              <div
                className="popover-arrow"
                style={{
                  ...arrowStyle,
                  filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
                  transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              />
              <div
                className="popover-arrow-border"
                style={arrowStyle}
              />
            </>
          )}

          <div className="p-5 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[hsl(183,90%,45%)] via-[hsl(190,80%,45%)] to-[hsl(280,65%,60%)] flex items-center justify-center shadow-lg flex-shrink-0">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-base text-center flex items-center justify-center gap-2">
                    {step.title}
                    {step.id === "complete" && <Sparkles className="w-4 h-4 text-[hsl(280,65%,60%)]" />}
                  </h3>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="flex-shrink-0 h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Description - Centered */}
            <p className="text-sm text-foreground/80 text-center leading-relaxed px-2">
              {step.description}
            </p>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium">Progress</span>
                <span>
                  {currentStep + 1} / {fullTourSteps.length}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[hsl(183,90%,45%)] to-[hsl(280,65%,60%)] transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Navigation - Centered */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBack}
                disabled={currentStep === 0}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>

              <Badge variant="secondary" className="text-xs px-3">
                {Math.round(progress)}%
              </Badge>

              <Button
                size="sm"
                onClick={handleNext}
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {currentStep === fullTourSteps.length - 1 ? (
                  <>
                    Finish
                    <Check className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Global Styles */}
      <style>{`
        .popover-arrow {
          background: hsl(var(--card));
        }

        .dark .popover-arrow {
          background: hsl(var(--card));
        }

        .tour-guide-highlight {
          position: relative;
          z-index: 998 !important;
          box-shadow:
            0 0 0 4px hsl(183 90% 45% / 0.5),
            0 0 0 8px hsl(183 90% 45% / 0.2),
            0 0 30px hsl(183 90% 45% / 0.4) !important;
          border-radius: 8px;
          transition: all 0.3s ease;
          animation: pulse-glow 2s infinite;
        }

        @keyframes pulse-glow {
          0%, 100% {
            box-shadow:
              0 0 0 4px hsl(183 90% 45% / 0.5),
              0 0 0 8px hsl(183 90% 45% / 0.2),
              0 0 30px hsl(183 90% 45% / 0.4);
          }
          50% {
            box-shadow:
              0 0 0 4px hsl(183 90% 45% / 0.7),
              0 0 0 8px hsl(183 90% 45% / 0.3),
              0 0 40px hsl(280 65% 60% / 0.3);
          }
        }
      `}</style>
    </>
  );
};

export default TourGuide;
