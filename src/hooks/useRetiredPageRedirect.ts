// Redirige (avec noindex) les pages retirées vers la ville parente.
// Combiné à l'exclusion sitemap et au meta robots, émule un 410 Gone
// sur une SPA statique (le mieux atteignable sans SSR).

import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface RetiredState {
  loading: boolean;
  retired: boolean;
  reason?: string | null;
}

function extractParentCity(pathname: string): string | null {
  // /genres/techno/nimes  -> /sortir-ce-soir/nimes
  // /ambiances/rave/nimes -> /sortir-ce-soir/nimes
  // /categories/soirees/nimes -> /sortir-ce-soir/nimes
  const m = pathname.match(/^\/(genres|ambiances|categories)\/[^/]+\/([^/]+)$/);
  if (m) return `/sortir-ce-soir/${m[2]}`;
  return null;
}

export function useRetiredPageRedirect(): RetiredState {
  const location = useLocation();
  const navigate = useNavigate();
  const [state, setState] = useState<RetiredState>({ loading: true, retired: false });

  useEffect(() => {
    let cancelled = false;
    const base = "https://pulse-map.live";
    const url = base + location.pathname;

    (async () => {
      const { data } = await supabase
        .from("page_index_status")
        .select("retired_at, retire_reason")
        .eq("url", url)
        .maybeSingle();

      if (cancelled) return;

      if (data?.retired_at) {
        setState({ loading: false, retired: true, reason: data.retire_reason });
        const parent = extractParentCity(location.pathname);
        // Redirect after a tick so noindex meta has a chance to render for crawlers
        setTimeout(() => {
          if (!cancelled) navigate(parent || "/", { replace: true });
        }, 100);
      } else {
        setState({ loading: false, retired: false });
      }
    })();

    return () => { cancelled = true; };
  }, [location.pathname, navigate]);

  return state;
}
