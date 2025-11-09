import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Insights from "./pages/Insights";
import Assistant from "./pages/Assistant";
import Experiments from "./pages/Experiments";
import Automation from "./pages/Automation";
import Collaboration from "./pages/Collaboration";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";
import NotificationPreferences from "./pages/NotificationPreferences";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/assistant" element={<Assistant />} />
        <Route path="/experiments" element={<Experiments />} />
        <Route path="/automation" element={<Automation />} />
        <Route path="/collaboration" element={<Collaboration />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings/notifications" element={<NotificationPreferences />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
