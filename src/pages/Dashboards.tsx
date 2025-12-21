import { MainLayout } from "@/components/layout/MainLayout";
import { Activity, Microscope } from "lucide-react";

export default function Dashboards() {
  return (
    <MainLayout>
      <div className="flex items-center justify-center min-h-[75vh]">
        <div className="text-center space-y-8 max-w-lg px-6">
          {/* Visual Element: Scientific Brand Aesthetic */}
          <div className="flex justify-center">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative px-8 py-6 bg-background border border-border/50 rounded-lg shadow-2xl flex items-center justify-center space-x-4">
                <Microscope className="w-12 h-12 text-cyan-500" />
                <div className="h-8 w-px bg-border/50" />
                <Activity className="w-10 h-10 text-purple-500" />
              </div>
            </div>
          </div>

          {/* Professional Messaging */}
          <div className="space-y-4">
            <h1 className="text-5xl font-extrabold tracking-tight">
              Coming <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Soon</span>
            </h1>
            <p className="text-2xl font-medium text-foreground/80">
              Integrated Health Intelligence Dashboards
            </p>
          </div>

          {/* Description: Medical/Scientific Context */}
          <p className="text-muted-foreground leading-relaxed text-lg max-w-md mx-auto">
            We are engineering a proprietary visualization engine for clinical diagnostics and longitudinal health data analysis.
            Real-time metric tracking and cross-parameter correlations are in final optimization.
          </p>

          {/* Status Indicator */}
          <div className="inline-flex items-center gap-2 px-6 py-2 border border-cyan-500/30 bg-cyan-500/5 rounded-md">
            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            <span className="text-sm font-semibold tracking-wider uppercase text-cyan-600 dark:text-cyan-400">
              Pipeline: Optimization Priority
            </span>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
