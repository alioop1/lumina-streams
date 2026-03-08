import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { useIsTVDevice, useTVGlobalNavigation } from "@/hooks/use-tv";
import { cn } from "@/lib/utils";
import Index from "./pages/Index";
import SearchRoute from "./pages/Search";
import Watchlist from "./pages/Watchlist";
import Downloads from "./pages/Downloads";
import SettingsPage from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppLayout = () => {
  const { dir } = useLanguage();
  const location = useLocation();
  const isTVDevice = useIsTVDevice();

  useTVGlobalNavigation(isTVDevice);

  useEffect(() => {
    document.documentElement.classList.toggle('tv-device', isTVDevice);
    document.body.classList.toggle('tv-device', isTVDevice);

    return () => {
      document.documentElement.classList.remove('tv-device');
      document.body.classList.remove('tv-device');
    };
  }, [isTVDevice]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (document.querySelector('[data-video-player="true"]')) return;
      const mainFocusable = document.querySelector<HTMLElement>('main .tv-focus, main button, main [tabindex], main a, main input');
      const active = document.activeElement as HTMLElement | null;

      if (!active || active === document.body || active.closest('[data-sidebar]')) {
        mainFocusable?.focus();
      }
    }, 140);

    return () => window.clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex w-full" dir={dir} data-tv-device={isTVDevice ? 'true' : 'false'}>
      <AppSidebar />
      <main className={cn('flex-1', isTVDevice ? 'ms-56' : 'ms-16')}>
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
