import { lazy, Suspense, useEffect, useState } from "react";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { SplashScreen } from "@/components/SplashScreen";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import ResetPassword from "./pages/ResetPassword";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";
const CitiesIndex = lazy(() => import("./pages/CitiesIndex"));
const CityPage = lazy(() => import("./pages/CityPage"));
const EventPage = lazy(() => import("./pages/EventPage"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { supabase } from "@/integrations/supabase/client";

const queryClient = new QueryClient();

function OAuthCallbackHandler() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listenerPromise = CapacitorApp.addListener("appUrlOpen", async ({ url }) => {
      if (url.startsWith("com.nightmap.app://auth")) {
        const urlObj = new URL(url.replace("com.nightmap.app://auth", "https://placeholder"));
        const code = urlObj.searchParams.get("code");
        if (code) {
          await supabase.auth.exchangeCodeForSession(code);
        }
        await Browser.close().catch(() => {});
      }
    });

    return () => { listenerPromise.then(l => l.remove()); };
  }, []);

  return null;
}

const App = () => {
  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window === 'undefined') return true;
    return !sessionStorage.getItem('pulse_splash_shown');
  });

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <OAuthCallbackHandler />
              {showSplash && (
                <SplashScreen
                  onComplete={() => {
                    sessionStorage.setItem('pulse_splash_shown', '1');
                    setShowSplash(false);
                  }}
                />
              )}
              <BrowserRouter>
                <Suspense fallback={null}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/villes" element={<CitiesIndex />} />
                    <Route path="/villes/:slug" element={<CityPage />} />
                    <Route path="/evenements/:slug" element={<EventPage />} />
                    <Route path="/categories/:slug" element={<CategoryPage />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </TooltipProvider>
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;
