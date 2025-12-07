import React from "react";
import { Toaster } from "@/components/ui/toaster";

import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import DatasetDetail from "./pages/DatasetDetail";
import Insights from "./pages/Insights";
import Analytics from "./pages/Analytics";
import Experiments from "./pages/Experiments";
import Automation from "./pages/Automation";
import Collaboration from "./pages/Collaboration";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";
import NotificationPreferences from "./pages/NotificationPreferences";
import Profile from "./pages/Profile";
import SettingsPage from "./pages/Settings";
import DeviceStreams from "./pages/DeviceStreams";
import DataAnonymization from "./pages/DataAnonymization";
import Models from "./pages/Models";
import Pricing from "./pages/Pricing";
import Datasets from "./pages/Datasets";

const queryClient = new QueryClient();

import { SidebarProvider } from "@/components/layout/SidebarContext";

const App = () => {
  React.useEffect(() => {
    // Initialize theme from local storage
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  console.log("App rendering...");
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider>
          <Toaster />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/datasets" element={<Datasets />} />
              <Route path="/dashboard/datasets/:id" element={<DatasetDetail />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/experiments" element={<Experiments />} />
              <Route path="/automation" element={<Automation />} />
              <Route path="/collaboration" element={<Collaboration />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/settings/notifications" element={<NotificationPreferences />} />
              <Route path="/notifications" element={<NotificationPreferences />} />
              <Route path="/settings/profile" element={<Profile />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/device-streams" element={<DeviceStreams />} />
              <Route path="/data-anonymization" element={<DataAnonymization />} />
              <Route path="/models" element={<Models />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </SidebarProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
