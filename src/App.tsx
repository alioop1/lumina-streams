import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { useTVGlobalNavigation } from "@/hooks/use-tv";
import { useFocusMemory } from "@/hooks/useFocusMemory";
import { NetworkIndicator } from "@/components/NetworkIndicator";
import { ScreenSaver } from "@/components/ScreenSaver";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Loader2 } from "lucide-react";

// Lazy load all pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const Movies = lazy(() => import("./pages/Movies"));
const TVShows = lazy(() => import("./pages/TVShows"));
const Anime = lazy(() => import("./pages/Anime"));
const LiveSports = lazy(() => import("./pages/LiveSports"));
const LiveTV = lazy(() => import("./pages/LiveTV"));
const SearchRoute = lazy(() => import("./pages/Search"));
const Watchlist = lazy(() => import("./pages/Watchlist"));
const History = lazy(() => import("./pages/History"));
const Downloads = lazy(() => import("./pages/Downloads"));
const Addons = lazy(() => import("./pages/Addons"));
const SettingsPage = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
      refetchOnWindowFocus: false,
    },
  },
});

const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <Loader2 className="w-8 h-8 text-primary animate-spin" />
  </div>
);

const AppLayout = () => {
  const { dir } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleFocusChange = useCallback(() => {
    const active = document.activeElement as HTMLElement;
    if (!active) return;
    const inSidebar = !!active.closest('[data-sidebar]');
    setSidebarOpen(inSidebar);
  }, []);

  useEffect(() => {
    document.addEventListener('focusin', handleFocusChange);
    return () => document.removeEventListener('focusin', handleFocusChange);
  }, [handleFocusChange]);

  useTVGlobalNavigation(true);
  useFocusMemory();

  return (
    <div className="min-h-screen bg-background text-foreground" dir={dir}>
      <AppSidebar collapsed={!sidebarOpen} />
      <NetworkIndicator />
      <ScreenSaver />

      {/* Main content — full width, sidebar overlays on top */}
      <main className="min-h-screen">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Navigate to="/movies" replace />} />
            <Route path="/movies" element={<Movies />} />
            <Route path="/tv-shows" element={<TVShows />} />
            <Route path="/anime" element={<Anime />} />
            <Route path="/live-sports" element={<LiveSports />} />
            <Route path="/live-tv" element={<LiveTV />} />
            <Route path="/search" element={<SearchRoute />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/history" element={<History />} />
            <Route path="/downloads" element={<Downloads />} />
            <Route path="/addons" element={<Addons />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
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
