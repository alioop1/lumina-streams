import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
import Index from "./pages/Index";
import SearchRoute from "./pages/Search";
import Watchlist from "./pages/Watchlist";
import Downloads from "./pages/Downloads";
import SettingsPage from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppLayout = () => {
  const { dir } = useLanguage();
  const isRTL = dir === 'rtl';

  return (
    <div className="min-h-screen flex w-full" dir={dir}>
      <AppSidebar />
      <main className={isRTL ? 'flex-1 mr-16' : 'flex-1 ml-16'}>
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
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
