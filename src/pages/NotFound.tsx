import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { SEO } from "@/components/SEO";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <>
      <SEO
        title="Page introuvable (404) | PulseMap"
        description="Cette page n'existe pas ou a été déplacée. Retournez à la carte des événements PulseMap."
        canonical={location.pathname}
        noindex
      />
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold">404 — Page introuvable</h1>
          <p className="mb-4 text-xl text-muted-foreground">Cette page n'existe pas sur PulseMap.</p>
          <a href="/" className="text-primary underline hover:text-primary/90">
            Retour à la carte
          </a>
        </div>
      </div>
    </>
  );
};

export default NotFound;
