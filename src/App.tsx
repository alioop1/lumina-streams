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
  const isTVDevice = useIsTVDevice();

  // Always enable global D-pad navigation
  useTVGlobalNavigation(true);

  useEffect(() => {
    document.documentElement.classList.toggle('tv-device', isTVDevice);
    document.body.classList.toggle('tv-device', isTVDevice);
    return () => {
      document.documentElement.classList.remove('tv-device');
      document.body.classList.remove('tv-device');
    };
  }, [isTVDevice]);

  return (
    <div className="min-h-screen flex w-full" dir={dir}>
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
