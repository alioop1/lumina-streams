import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { useTVGlobalNavigation } from "@/hooks/use-tv";
import Index from "./pages/Index";
import SearchRoute from "./pages/Search";
import Watchlist from "./pages/Watchlist";
import Downloads from "./pages/Downloads";
import SettingsPage from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppLayout = () => {
  const { dir } = useLanguage();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  // Collapse/expand sidebar based on focus location
  const handleFocusChange = useCallback(() => {
    const active = document.activeElement as HTMLElement;
    if (!active) return;
    const inSidebar = !!active.closest('[data-sidebar]');
    setSidebarCollapsed(!inSidebar);
  }, []);

  useEffect(() => {
    document.addEventListener('focusin', handleFocusChange);
    return () => document.removeEventListener('focusin', handleFocusChange);
  }, [handleFocusChange]);

  useTVGlobalNavigation(true);

  const mainMargin = sidebarCollapsed ? 'ms-16' : 'ms-56';

  return (
    <div className="min-h-screen flex w-full bg-background text-foreground" dir={dir}>
      <AppSidebar collapsed={sidebarCollapsed} />
      <main className={`flex-1 ${mainMargin} overflow-y-auto transition-all duration-200`}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/search" element={<SearchRoute />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/downloads" element={<Downloads />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <SettingsProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppLayout />
          </BrowserRouter>
        </SettingsProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
