import { lazy, Suspense, useEffect, useState } from "react";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { SplashScreen } from "@/components/SplashScreen";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import ResetPassword from "./pages/ResetPassword";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";
import { CookieConsent } from "./components/CookieConsent";
const CitiesIndex = lazy(() => import("./pages/CitiesIndex"));
const CityPage = lazy(() => import("./pages/CityPage"));
const EventPage = lazy(() => import("./pages/EventPage"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const NightlifePage = lazy(() => import("./pages/NightlifePage"));
const TagPage = lazy(() => import("./pages/TagPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const ContactLegalPage = lazy(() => import("./pages/ContactLegalPage"));
const IndexationDashboard = lazy(() => import("./pages/admin/IndexationDashboard"));
import { RetiredPageGuard } from "@/components/RetiredPageGuard";
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
              <Sonner position="top-center" offset="calc(env(safe-area-inset-top, 0px) + 96px)" />
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
                    <Route path="/sortir-ce-soir/:slug" element={<CityPage />} />
                    <Route path="/evenements/:slug" element={<EventPage />} />
                    <Route path="/categories/:slug" element={<RetiredPageGuard><CategoryPage /></RetiredPageGuard>} />
                    <Route path="/categories/:slug/:city" element={<RetiredPageGuard><CategoryPage /></RetiredPageGuard>} />
                    <Route path="/genres/:slug" element={<RetiredPageGuard><TagPage kind="genre" /></RetiredPageGuard>} />
                    <Route path="/genres/:slug/:city" element={<RetiredPageGuard><TagPage kind="genre" /></RetiredPageGuard>} />
                    <Route path="/ambiances/:slug" element={<RetiredPageGuard><TagPage kind="vibe" /></RetiredPageGuard>} />
                    <Route path="/ambiances/:slug/:city" element={<RetiredPageGuard><TagPage kind="vibe" /></RetiredPageGuard>} />
                    <Route path="/admin/indexation" element={<IndexationDashboard />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="/rgpd" element={<Navigate to="/privacy-policy" replace />} />
                    <Route path="/privacy-policy" element={<PrivacyPage />} />
                    <Route path="/terms" element={<TermsPage />} />
                    <Route path="/contact-legal" element={<ContactLegalPage />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
                <CookieConsent />
              </BrowserRouter>
            </TooltipProvider>
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;
