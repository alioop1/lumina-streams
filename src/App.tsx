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
import { useFocusMemory } from "@/hooks/useFocusMemory";
import { NetworkIndicator } from "@/components/NetworkIndicator";
import { StatusBar } from "@/components/StatusBar";
import { ScreenSaver } from "@/components/ScreenSaver";
import { ErrorBoundary } from "@/components/ErrorBoundary";
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
  useFocusMemory();

  return (
    <div className="min-h-screen bg-background text-foreground" dir={dir}>
      <AppSidebar collapsed={sidebarCollapsed} />
      <StatusBar />
      <NetworkIndicator />
      <ScreenSaver />

      {/* Main content area — offset from sidebar via padding, NOT margin */}
      <main
        className={`min-h-screen transition-[padding] duration-200 ${
          sidebarCollapsed
            ? 'ps-16 3xl:ps-20 4k:ps-24'
            : 'ps-56 3xl:ps-64 4k:ps-72'
        }`}
      >
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
          <ErrorBoundary>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppLayout />
            </BrowserRouter>
          </ErrorBoundary>
        </SettingsProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
