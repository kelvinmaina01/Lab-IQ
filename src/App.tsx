import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";

// Core Services & Layout
import { SidebarProvider } from "@/components/layout/SidebarContext";
import { ServiceProvider } from "@/core/ServiceProvider";
import { LabProvider } from "@/contexts/LabContext";
import { useToast } from "@/hooks/use-toast";
import { GlobalErrorFallback } from "@/components/ui/GlobalErrorFallback";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

// Lazy Loaded Pages
const Index = React.lazy(() => import("./pages/Index"));
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const Upload = React.lazy(() => import("./pages/Upload"));
const DatasetDetail = React.lazy(() => import("./pages/DatasetDetail"));
const Insights = React.lazy(() => import("./pages/Insights"));
const Analytics = React.lazy(() => import("./pages/Analytics"));
const Experiments = React.lazy(() => import("./pages/Experiments"));
const Automation = React.lazy(() => import("./pages/Automation"));
const WorkflowExecution = React.lazy(() => import("./pages/WorkflowExecution"));
const Collaboration = React.lazy(() => import("./pages/Collaboration"));
const Reports = React.lazy(() => import("./pages/Reports"));
const Assistant = React.lazy(() => import("./pages/Assistant"));
const Pricing = React.lazy(() => import("./pages/Pricing"));
const SettingsPage = React.lazy(() => import("./pages/Settings"));
const NotificationPreferences = React.lazy(() => import("./pages/NotificationPreferences"));
const Profile = React.lazy(() => import("./pages/Profile"));
const DeviceStreams = React.lazy(() => import("./pages/DeviceStreams"));
const DataAnonymization = React.lazy(() => import("./pages/DataAnonymization"));
const Models = React.lazy(() => import("./pages/Models"));
const Datasets = React.lazy(() => import("./pages/Datasets"));
const Dashboards = React.lazy(() => import("./pages/Dashboards"));
const Overview = React.lazy(() => import("./pages/Overview"));
const AuthPage = React.lazy(() => import("./components/auth/AuthPage").then(module => ({ default: module.AuthPage })));
const LandingPage = React.lazy(() => import("./pages/LandingPage").then(module => ({ default: module.LandingPage })));

// Placeholder components for missing pages to prevent build errors
const AcceptInvitation = () => <div>Accept Invitation Page</div>;
const NotFound = () => <div className="p-8 text-center">404 - Page Not Found</div>;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  const { toast } = useToast();

  React.useEffect(() => {
    // Initialize theme from local storage
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Warm Welcome Back Logic
  React.useEffect(() => {
    // Small delay to ensure UI is ready
    const timer = setTimeout(() => {
      // Check if we haven't welcomed them this session
      if (!sessionStorage.getItem('welcome_back_shown')) {
        toast({
          title: "Welcome back to LabIQ! 👋",
          description: "Ready to continue your research?",
          duration: 4000,
        });
        sessionStorage.setItem('welcome_back_shown', 'true');
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <ServiceProvider>
      <LabProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <SidebarProvider>
              <Toaster />
              <BrowserRouter>
                <ErrorBoundary FallbackComponent={GlobalErrorFallback} onReset={() => window.location.replace('/')}>
                  <Suspense fallback={<LoadingSpinner fullScreen text="Loading LabIQ Health..." />}>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/login" element={<AuthPage />} />
                      <Route path="/signup" element={<AuthPage />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/datasets" element={<Datasets />} />
                      <Route path="/dashboard/datasets/:id" element={<DatasetDetail />} />
                      <Route path="/upload" element={<Upload />} />
                      <Route path="/insights" element={<Insights />} />
                      <Route path="/analytics" element={<Analytics />} />
                      <Route path="/experiments" element={<Experiments />} />
                      <Route path="/automation" element={<Automation />} />
                      <Route path="/automation/execution/:executionId" element={<WorkflowExecution />} />
                      <Route path="/collaboration" element={<Collaboration />} />
                      <Route path="/reports" element={<Reports />} />
                      <Route path="/assistant" element={<Assistant />} />
                      <Route path="/assistant/:datasetId" element={<Assistant />} />
                      <Route path="/pricing" element={<Pricing />} />
                      <Route path="/settings" element={<SettingsPage />} />
                      <Route path="/settings/notifications" element={<NotificationPreferences />} />
                      <Route path="/notifications" element={<NotificationPreferences />} />
                      <Route path="/settings/profile" element={<Profile />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/device-streams" element={<DeviceStreams />} />
                      <Route path="/data-anonymization" element={<DataAnonymization />} />
                      <Route path="/models" element={<Models />} />
                      <Route path="/dashboards" element={<Dashboards />} />
                      <Route path="/overview" element={<Overview />} />
                      <Route path="/accept-invitation" element={<AcceptInvitation />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </ErrorBoundary>


              </BrowserRouter>
            </SidebarProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </LabProvider>
    </ServiceProvider>
  );
};

export default App;
