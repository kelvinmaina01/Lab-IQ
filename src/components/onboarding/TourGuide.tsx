/**
 * 🎯 LabIQ Health Tour Guide
 * World-class interactive product tour with spotlight highlighting,
 * keyboard navigation, step categories, and smart positioning
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  X,
  ArrowRight,
  ArrowLeft,
  Check,
  Bot,
  Sparkles,
  Upload,
  Database,
  FlaskConical,
  Brain,
  BarChart3,
  Workflow,
  Lightbulb,
  Users,
  FileText,
  MessageSquare,
  Settings,
  ChevronDown,
  ChevronUp,
  Keyboard,
  SkipForward,
  RotateCcw,
  Home,
  Play,
  Pause,
  Volume2,
  VolumeX
} from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// TYPES
// =============================================================================

export interface GuideStep {
  id: string;
  title: string;
  description: string;
  detailedTip?: string;
  route: string;
  targetSelector: string;
  arrowSide: "top" | "bottom" | "left" | "right" | "auto";
  category: TourCategory;
  hotkey?: string;
  action?: () => void;
}

type TourCategory =
  | "welcome"
  | "data"
  | "analysis"
  | "automation"
  | "collaboration"
  | "settings";

interface CategoryInfo {
  name: string;
  icon: React.ElementType;
  color: string;
  description: string;
}

// =============================================================================
// CATEGORY CONFIGURATION
// =============================================================================

const CATEGORIES: Record<TourCategory, CategoryInfo> = {
  welcome: {
    name: "Getting Started",
    icon: Home,
    color: "from-blue-500 to-cyan-400",
    description: "Welcome and overview"
  },
  data: {
    name: "Data Management",
    icon: Database,
    color: "from-emerald-500 to-teal-400",
    description: "Upload, store, and manage datasets"
  },
  analysis: {
    name: "Analysis & ML",
    icon: Brain,
    color: "from-purple-500 to-pink-400",
    description: "Experiments, models, and insights"
  },
  automation: {
    name: "Automation",
    icon: Workflow,
    color: "from-orange-500 to-amber-400",
    description: "Workflows and automated processes"
  },
  collaboration: {
    name: "Collaboration",
    icon: Users,
    color: "from-indigo-500 to-blue-400",
    description: "Team features and reports"
  },
  settings: {
    name: "Settings",
    icon: Settings,
    color: "from-gray-500 to-slate-400",
    description: "Configure your preferences"
  }
};

// =============================================================================
// TOUR STEPS CONFIGURATION
// =============================================================================

const fullTourSteps: GuideStep[] = [
  // Welcome
  {
    id: "welcome",
    title: "Welcome to LabIQ Health!",
    description: "Your AI-powered workspace for public health data analysis.",
    detailedTip: "Use ← → arrow keys or click Next/Back. Press ESC to exit anytime.",
    route: "/dashboard",
    targetSelector: "",
    arrowSide: "auto",
    category: "welcome"
  },

  // Data Management
  {
    id: "dashboard",
    title: "Your Dashboard",
    description: "Your command center with key metrics, recent activities, and quick actions.",
    detailedTip: "Pin important datasets and experiments for quick access.",
    route: "/dashboard",
    targetSelector: "[data-tour='dashboard-stats']",
    arrowSide: "bottom",
    category: "data",
    hotkey: "D"
  },
  {
    id: "sidebar-upload",
    title: "Upload Data",
    description: "Click here to upload CSV, Excel, or JSON files for analysis.",
    detailedTip: "Supports drag-and-drop with automatic format detection.",
    route: "/dashboard",
    targetSelector: "a[href='/upload']",
    arrowSide: "right",
    category: "data"
  },
  {
    id: "upload-zone",
    title: "Smart Upload Zone",
    description: "Drag and drop files here. Auto-validation and quality checks included.",
    detailedTip: "We support CSV, Excel (.xlsx), JSON, and XML formats up to 50MB.",
    route: "/upload",
    targetSelector: "[data-tour='upload-zone']",
    arrowSide: "top",
    category: "data",
    hotkey: "U"
  },
  {
    id: "sidebar-datasets",
    title: "Datasets Library",
    description: "All your uploaded datasets with quality metrics and search.",
    route: "/upload",
    targetSelector: "a[href='/datasets']",
    arrowSide: "right",
    category: "data"
  },
  {
    id: "datasets-grid",
    title: "Dataset Browser",
    description: "View all datasets with quality scores, size, and status at a glance.",
    detailedTip: "Click any dataset to explore data, generate visualizations, or train models.",
    route: "/datasets",
    targetSelector: "[data-tour='datasets-grid']",
    arrowSide: "top",
    category: "data"
  },

  // Analysis & ML
  {
    id: "sidebar-experiments",
    title: "Experiments",
    description: "Document and track all your research experiments.",
    detailedTip: "Create reproducible experiments with full version history.",
    route: "/datasets",
    targetSelector: "a[href='/experiments']",
    arrowSide: "right",
    category: "analysis"
  },
  {
    id: "experiments-list",
    title: "Experiment Log",
    description: "View, compare, and manage all your experiments.",
    detailedTip: "Use templates to quickly set up common experiment types.",
    route: "/experiments",
    targetSelector: "[data-tour='experiments-list']",
    arrowSide: "top",
    category: "analysis",
    hotkey: "E"
  },
  {
    id: "sidebar-models",
    title: "AI Models",
    description: "Train machine learning models without writing code.",
    route: "/experiments",
    targetSelector: "a[href='/models']",
    arrowSide: "right",
    category: "analysis"
  },
  {
    id: "models-interface",
    title: "AutoML Training",
    description: "Select dataset and target column - AutoML handles the rest.",
    detailedTip: "Our multi-agent system automatically selects algorithms, tunes hyperparameters, and evaluates models.",
    route: "/models",
    targetSelector: "[data-tour='models-grid']",
    arrowSide: "top",
    category: "analysis",
    hotkey: "M"
  },
  {
    id: "sidebar-analytics",
    title: "Analytics",
    description: "Explore data through interactive visualizations.",
    route: "/models",
    targetSelector: "a[href='/analytics']",
    arrowSide: "right",
    category: "analysis"
  },
  {
    id: "analytics-charts",
    title: "Data Visualizations",
    description: "Create custom charts, run statistical tests, and export results.",
    detailedTip: "Charts can be exported as PNG/SVG for publications.",
    route: "/analytics",
    targetSelector: "[data-tour='analytics-charts']",
    arrowSide: "top",
    category: "analysis",
    hotkey: "A"
  },

  // Automation
  {
    id: "sidebar-automation",
    title: "Automation",
    description: "Create intelligent workflows with triggers and actions.",
    route: "/analytics",
    targetSelector: "a[href='/automation']",
    arrowSide: "right",
    category: "automation"
  },
  {
    id: "automation-workflows",
    title: "Smart Workflows",
    description: "Build data pipelines using industry-specific templates.",
    detailedTip: "Workflows can trigger on schedule, data upload, or custom conditions.",
    route: "/automation",
    targetSelector: "[data-tour='workflows-list']",
    arrowSide: "top",
    category: "automation",
    hotkey: "W"
  },
  {
    id: "sidebar-insights",
    title: "AI Insights",
    description: "AI continuously analyzes your data and discovers patterns.",
    route: "/automation",
    targetSelector: "a[href='/insights']",
    arrowSide: "right",
    category: "analysis"
  },
  {
    id: "insights-feed",
    title: "Discoveries Feed",
    description: "AI-generated insights ranked by importance.",
    detailedTip: "Insights include trend analysis, anomaly detection, and recommendations.",
    route: "/insights",
    targetSelector: "[data-tour='insights-feed']",
    arrowSide: "top",
    category: "analysis",
    hotkey: "I"
  },

  // Collaboration
  {
    id: "sidebar-collaboration",
    title: "Collaboration",
    description: "Invite team members and work together in real-time.",
    route: "/insights",
    targetSelector: "a[href='/collaboration']",
    arrowSide: "right",
    category: "collaboration"
  },
  {
    id: "collaboration-team",
    title: "Team Hub",
    description: "Chat, share resources, and track team contributions.",
    detailedTip: "Real-time presence shows who's online and what they're working on.",
    route: "/collaboration",
    targetSelector: "[data-tour='team-section']",
    arrowSide: "top",
    category: "collaboration",
    hotkey: "T"
  },
  {
    id: "sidebar-reports",
    title: "Reports",
    description: "Generate publication-ready documents.",
    route: "/collaboration",
    targetSelector: "a[href='/reports']",
    arrowSide: "right",
    category: "collaboration"
  },
  {
    id: "reports-builder",
    title: "Report Builder",
    description: "Create professional reports with AI-powered content.",
    detailedTip: "Export to PDF, Word, or HTML with customizable templates.",
    route: "/reports",
    targetSelector: "[data-tour='reports-builder']",
    arrowSide: "top",
    category: "collaboration",
    hotkey: "R"
  },
  {
    id: "sidebar-assistant",
    title: "AI Assistant",
    description: "Ask questions about your data in plain English.",
    route: "/reports",
    targetSelector: "a[href='/assistant']",
    arrowSide: "right",
    category: "collaboration"
  },
  {
    id: "assistant-chat",
    title: "Chat Interface",
    description: "Have conversations with your data and get instant answers.",
    detailedTip: "The AI assistant can generate visualizations, run analyses, and explain results.",
    route: "/assistant",
    targetSelector: "[data-tour='chat-interface']",
    arrowSide: "top",
    category: "collaboration"
  },

  // Settings
  {
    id: "sidebar-settings",
    title: "Settings",
    description: "Manage profile, notifications, and preferences.",
    route: "/assistant",
    targetSelector: "a[href='/settings']",
    arrowSide: "right",
    category: "settings",
    hotkey: "S"
  },

  // Complete
  {
    id: "complete",
    title: "You're All Set! 🎉",
    description: "You've completed the tour and are ready to start analyzing data.",
    detailedTip: "Restart this tour anytime from Settings → Help → Take a Tour.",
    route: "/dashboard",
    targetSelector: "",
    arrowSide: "auto",
    category: "welcome"
  }
];

// =============================================================================
// COMPONENT PROPS
// =============================================================================

interface TourGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const TourGuide = ({ isOpen, onClose, onComplete }: TourGuideProps) => {
  // State
  const [currentStep, setCurrentStep] = useState(-1); // -1 = welcome screen
  const [cardPosition, setCardPosition] = useState({ top: "50%", left: "50%", transform: "translate(-50%, -50%)" });
  const [arrowStyle, setArrowStyle] = useState<React.CSSProperties>({});
  const [isNavigating, setIsNavigating] = useState(false);
  const [showStepList, setShowStepList] = useState(false);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(false);

  // Refs
  const cardRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  // Hooks
  const navigate = useNavigate();
  const location = useLocation();

  // Derived state
  const step = currentStep >= 0 ? fullTourSteps[currentStep] : null;
  const progress = currentStep >= 0 ? ((currentStep + 1) / fullTourSteps.length) * 100 : 0;
  const categoryInfo = step ? CATEGORIES[step.category] : null;

  // Group steps by category for the step list
  const stepsByCategory = useMemo(() => {
    const grouped: Record<TourCategory, { step: GuideStep; index: number }[]> = {
      welcome: [],
      data: [],
      analysis: [],
      automation: [],
      collaboration: [],
      settings: []
    };

    fullTourSteps.forEach((s, index) => {
      grouped[s.category].push({ step: s, index });
    });

    return grouped;
  }, []);

  // ==========================================================================
  // KEYBOARD NAVIGATION
  // ==========================================================================

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if ((e.target as HTMLElement).tagName === 'INPUT' ||
        (e.target as HTMLElement).tagName === 'TEXTAREA') return;

      switch (e.key) {
        case 'ArrowRight':
        case 'Enter':
          e.preventDefault();
          handleNext();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleBack();
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case ' ': // Space - toggle pause
          e.preventDefault();
          setIsPaused(p => !p);
          break;
        case 'm': // Toggle step list
        case 'M':
          e.preventDefault();
          setShowStepList(p => !p);
          break;
        case 'Home':
          e.preventDefault();
          setCurrentStep(0);
          break;
        case 'End':
          e.preventDefault();
          setCurrentStep(fullTourSteps.length - 1);
          break;
        default:
          // Check for hotkey navigation
          const hotkey = e.key.toUpperCase();
          const stepWithHotkey = fullTourSteps.findIndex(s => s.hotkey === hotkey);
          if (stepWithHotkey !== -1) {
            e.preventDefault();
            setCurrentStep(stepWithHotkey);
          }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep]);

  // ==========================================================================
  // AUTO-PLAY
  // ==========================================================================

  useEffect(() => {
    if (!autoPlayEnabled || isPaused || !isOpen || currentStep < 0) {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
        autoPlayRef.current = null;
      }
      return;
    }

    autoPlayRef.current = setInterval(() => {
      if (currentStep < fullTourSteps.length - 1) {
        setCurrentStep(c => c + 1);
      } else {
        setAutoPlayEnabled(false);
      }
    }, 5000);

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [autoPlayEnabled, isPaused, isOpen, currentStep]);

  // ==========================================================================
  // NAVIGATION EFFECT
  // ==========================================================================

  useEffect(() => {
    if (!isOpen || !step) return;

    if (step.route !== location.pathname) {
      setIsNavigating(true);
      setSpotlightRect(null);
      setCardPosition({
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      });
      setArrowStyle({ display: "none" });

      navigate(step.route);

      const timeout = setTimeout(() => {
        setIsNavigating(false);
      }, 400);

      return () => clearTimeout(timeout);
    } else {
      setIsNavigating(false);
    }
  }, [currentStep, step, location.pathname, navigate, isOpen]);

  // ==========================================================================
  // POSITIONING EFFECT
  // ==========================================================================

  useEffect(() => {
    if (!isOpen || !step || isNavigating) return;

    const positionElements = () => {
      if (!step.targetSelector) {
        setSpotlightRect(null);
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
        console.log(`Target not found: ${step.targetSelector}`);
        setSpotlightRect(null);
        setCardPosition({
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        });
        setArrowStyle({ display: "none" });
        return;
      }

      const targetRect = target.getBoundingClientRect();
      setSpotlightRect(targetRect);

      // Scroll target into view
      requestAnimationFrame(() => {
        target.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "center"
        });
      });

      if (!cardRef.current) return;

      const cardWidth = 400;
      const cardHeight = cardRef.current.offsetHeight || 220;
      const gap = 24;
      const padding = 20;

      // Determine best arrow side if 'auto'
      let arrowSide = step.arrowSide;
      if (arrowSide === 'auto') {
        const spaceTop = targetRect.top;
        const spaceBottom = window.innerHeight - targetRect.bottom;
        const spaceLeft = targetRect.left;
        const spaceRight = window.innerWidth - targetRect.right;

        const spaces = [
          { side: 'bottom', space: spaceBottom },
          { side: 'top', space: spaceTop },
          { side: 'right', space: spaceRight },
          { side: 'left', space: spaceLeft }
        ].sort((a, b) => b.space - a.space);

        arrowSide = spaces[0].side as any;
      }

      let newPosition: any = {};
      let newArrowStyle: React.CSSProperties = {};

      const arrowBase = {
        position: "absolute" as const,
        width: "16px",
        height: "16px",
        background: "hsl(var(--card))",
        border: "2px solid hsl(var(--primary))",
        zIndex: 1001,
      };

      switch (arrowSide) {
        case "right":
          newPosition = {
            top: `${Math.max(padding, Math.min(targetRect.top + targetRect.height / 2, window.innerHeight - cardHeight - padding))}px`,
            left: `${targetRect.right + gap}px`,
            transform: "translateY(-50%)",
          };
          newArrowStyle = {
            ...arrowBase,
            left: "0px",
            top: "50%",
            transform: "translate(-12px, -50%) rotate(-45deg)",
            borderRight: "none",
            borderBottom: "none",
          };
          break;
        case "left":
          newPosition = {
            top: `${Math.max(padding, Math.min(targetRect.top + targetRect.height / 2, window.innerHeight - cardHeight - padding))}px`,
            left: `${targetRect.left - cardWidth - gap}px`,
            transform: "translateY(-50%)",
          };
          newArrowStyle = {
            ...arrowBase,
            right: "0px",
            top: "50%",
            transform: "translate(12px, -50%) rotate(-45deg)",
            borderLeft: "none",
            borderTop: "none",
          };
          break;
        case "top":
          newPosition = {
            top: `${targetRect.top - cardHeight - gap}px`,
            left: `${Math.max(padding, Math.min(targetRect.left + targetRect.width / 2 - cardWidth / 2, window.innerWidth - cardWidth - padding))}px`,
            transform: "none",
          };
          newArrowStyle = {
            ...arrowBase,
            bottom: "0px",
            left: "50%",
            transform: "translate(-50%, 12px) rotate(-45deg)",
            borderTop: "none",
            borderRight: "none",
          };
          break;
        case "bottom":
        default:
          newPosition = {
            top: `${targetRect.bottom + gap}px`,
            left: `${Math.max(padding, Math.min(targetRect.left + targetRect.width / 2 - cardWidth / 2, window.innerWidth - cardWidth - padding))}px`,
            transform: "none",
          };
          newArrowStyle = {
            ...arrowBase,
            top: "0px",
            left: "50%",
            transform: "translate(-50%, -12px) rotate(-45deg)",
            borderBottom: "none",
            borderLeft: "none",
          };
          break;
      }

      // Ensure card stays within viewport
      const leftNum = parseFloat(newPosition.left);
      const topNum = parseFloat(newPosition.top);

      if (leftNum + cardWidth > window.innerWidth - padding) {
        newPosition.left = `${window.innerWidth - cardWidth - padding}px`;
      }
      if (leftNum < padding) {
        newPosition.left = `${padding}px`;
      }
      if (topNum + cardHeight > window.innerHeight - padding) {
        newPosition.top = `${window.innerHeight - cardHeight - padding}px`;
      }
      if (topNum < padding) {
        newPosition.top = `${padding}px`;
      }

      setCardPosition(newPosition);
      setArrowStyle(newArrowStyle);
    };

    // Position with retries for DOM loading
    const timeouts = [50, 150, 350, 600, 1000].map(delay =>
      setTimeout(positionElements, delay)
    );

    window.addEventListener("resize", positionElements);
    window.addEventListener("scroll", positionElements);

    return () => {
      timeouts.forEach(clearTimeout);
      window.removeEventListener("resize", positionElements);
      window.removeEventListener("scroll", positionElements);
    };
  }, [currentStep, step, isOpen, isNavigating, location.pathname]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleNext = useCallback(() => {
    if (currentStep < fullTourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  }, [currentStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleComplete = useCallback(() => {
    setAutoPlayEnabled(false);
    onComplete();
    onClose();
  }, [onComplete, onClose]);

  const handleJumpToStep = useCallback((index: number) => {
    setCurrentStep(index);
    setShowStepList(false);
  }, []);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  if (!isOpen) return null;

  // Welcome Screen
  if (currentStep === -1) {
    return (
      <>
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100]" onClick={onClose} />
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[101]">
          <Card className="w-[500px] max-w-[95vw] shadow-2xl border-2 border-primary/40 bg-card overflow-hidden">
            {/* Header gradient */}
            <div className="h-2 bg-gradient-to-r from-[hsl(183,90%,45%)] via-[hsl(220,80%,55%)] to-[hsl(280,65%,60%)]" />

            <div className="p-8 space-y-6">
              {/* Avatar and Title */}
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[hsl(183,90%,45%)] via-[hsl(190,80%,45%)] to-[hsl(280,65%,60%)] flex items-center justify-center shadow-xl">
                    <Bot className="w-14 h-14 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-green-500 border-4 border-card flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div>
                  <h2 className="font-bold text-2xl mb-1">Welcome to LabIQ Health!</h2>
                  <p className="text-muted-foreground">Your AI-powered public health analysis workspace</p>
                </div>
              </div>

              {/* Description */}
              <p className="text-center text-foreground/80 leading-relaxed">
                Let me show you around! This interactive tour will guide you through
                all the powerful features of LabIQ Health in just a few minutes.
              </p>

              {/* Features Grid */}
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(CATEGORIES).filter(([key]) => key !== 'welcome').map(([key, cat]) => (
                  <div
                    key={key}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border transition-all",
                      "bg-muted/50 hover:bg-muted"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br",
                      cat.color
                    )}>
                      <cat.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{cat.name}</p>
                      <p className="text-xs text-muted-foreground">{cat.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Keyboard shortcuts hint */}
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Keyboard className="w-4 h-4" />
                <span>Use ← → arrow keys to navigate, ESC to exit</span>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => setCurrentStep(0)}
                  className="w-full h-12 text-base gap-2 bg-gradient-to-r from-[hsl(183,90%,45%)] to-[hsl(280,65%,60%)] hover:opacity-90 text-white shadow-lg"
                >
                  <Play className="w-5 h-5" />
                  Start Interactive Tour
                  <span className="text-xs opacity-80">({fullTourSteps.length} steps)</span>
                </Button>

                <Button
                  variant="ghost"
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Skip for now · I'll explore on my own
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </>
    );
  }

  if (!step) return null;

  return (
    <>
      {/* Spotlight Overlay */}
      <div className="fixed inset-0 z-[99] pointer-events-none">
        <svg className="w-full h-full">
          <defs>
            <mask id="spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {spotlightRect && (
                <rect
                  x={spotlightRect.left - 8}
                  y={spotlightRect.top - 8}
                  width={spotlightRect.width + 16}
                  height={spotlightRect.height + 16}
                  rx="12"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.7)"
            mask="url(#spotlight-mask)"
          />
        </svg>
      </div>

      {/* Spotlight Border */}
      {spotlightRect && (
        <div
          className="fixed z-[100] pointer-events-none rounded-xl animate-pulse"
          style={{
            top: spotlightRect.top - 8,
            left: spotlightRect.left - 8,
            width: spotlightRect.width + 16,
            height: spotlightRect.height + 16,
            boxShadow: `
              0 0 0 3px hsl(var(--primary)),
              0 0 20px hsl(var(--primary) / 0.5),
              0 0 40px hsl(var(--primary) / 0.3)
            `
          }}
        />
      )}

      {/* Step List Panel */}
      {showStepList && (
        <div className="fixed left-4 top-1/2 -translate-y-1/2 z-[102] w-72">
          <Card className="shadow-2xl border-2 border-primary/30 max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b bg-muted/50">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Tour Steps</h4>
                <Button size="icon" variant="ghost" onClick={() => setShowStepList(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <ScrollArea className="h-[60vh]">
              <div className="p-2 space-y-2">
                {Object.entries(stepsByCategory).map(([categoryKey, steps]) => {
                  if (steps.length === 0) return null;
                  const cat = CATEGORIES[categoryKey as TourCategory];
                  return (
                    <div key={categoryKey}>
                      <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-muted-foreground">
                        <cat.icon className="w-3.5 h-3.5" />
                        {cat.name}
                      </div>
                      {steps.map(({ step: s, index }) => (
                        <button
                          key={s.id}
                          onClick={() => handleJumpToStep(index)}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-md text-sm transition-all",
                            "hover:bg-muted",
                            index === currentStep && "bg-primary/10 text-primary font-medium"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {index < currentStep ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : index === currentStep ? (
                              <div className="w-4 h-4 rounded-full bg-primary animate-pulse" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />
                            )}
                            <span className="truncate">{s.title}</span>
                            {s.hotkey && (
                              <kbd className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">
                                {s.hotkey}
                              </kbd>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </Card>
        </div>
      )}

      {/* Main Tour Card */}
      <div
        ref={cardRef}
        style={{
          position: "fixed",
          ...cardPosition,
          zIndex: 101,
          width: 400,
          transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        className={cn(
          "animate-in fade-in zoom-in-95 duration-300",
          isNavigating && "opacity-60 scale-95"
        )}
      >
        <Card className="shadow-2xl border-2 border-primary overflow-hidden">
          {/* Arrow */}
          {step.targetSelector && arrowStyle.position && (
            <div style={arrowStyle} />
          )}

          {/* Category Header */}
          {categoryInfo && (
            <div className={cn(
              "px-5 py-3 bg-gradient-to-r flex items-center gap-3",
              categoryInfo.color
            )}>
              <categoryInfo.icon className="w-5 h-5 text-white" />
              <span className="font-semibold text-white text-sm">{categoryInfo.name}</span>
              <Badge variant="secondary" className="ml-auto bg-white/20 text-white border-0">
                Step {currentStep + 1} of {fullTourSteps.length}
              </Badge>
            </div>
          )}

          <div className="p-5 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[hsl(183,90%,45%)] via-[hsl(190,80%,45%)] to-[hsl(280,65%,60%)] flex items-center justify-center shadow-lg">
                  <Bot className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{step.title}</h3>
                  {step.hotkey && (
                    <span className="text-xs text-muted-foreground">
                      Press <kbd className="bg-muted px-1.5 py-0.5 rounded font-mono">{step.hotkey}</kbd> to jump here
                    </span>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Description */}
            <p className="text-foreground/80 leading-relaxed">{step.description}</p>

            {/* Detailed Tip */}
            {step.detailedTip && (
              <div className="flex gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                <Lightbulb className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-foreground/70">{step.detailedTip}</p>
              </div>
            )}

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <button
                  onClick={() => setShowStepList(true)}
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span>Progress</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
                <span className="text-muted-foreground font-medium">{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[hsl(183,90%,45%)] to-[hsl(280,65%,60%)] transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBack}
                  disabled={currentStep === 0}
                  className="gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowStepList(p => !p)}
                  title="Show all steps (M)"
                >
                  <ChevronUp className="w-4 h-4" />
                </Button>
              </div>

              <Button
                size="sm"
                onClick={handleNext}
                className="gap-2 bg-primary hover:bg-primary/90 min-w-[100px]"
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
    </>
  );
};

export default TourGuide;
