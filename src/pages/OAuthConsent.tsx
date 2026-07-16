import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AuthScreen } from "@/components/AuthScreen";
import { SEO } from "@/components/SEO";

type AuthDetails = {
  client?: { name?: string; client_uri?: string; redirect_uri?: string };
  scope?: string;
  redirect_url?: string;
  redirect_to?: string;
};

// Local typed shim for the beta supabase.auth.oauth namespace.
type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: AuthDetails | null; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: AuthDetails | null; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: AuthDetails | null; error: { message: string } | null }>;
};
const oauth = (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<AuthDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (!authorizationId) {
      setError("Paramètre authorization_id manquant.");
      return;
    }
    if (authLoading || !user || fetched) return;
    let active = true;
    (async () => {
      const { data, error } = await oauth.getAuthorizationDetails(authorizationId);
      if (!active) return;
      setFetched(true);
      if (error) return setError(error.message);
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId, authLoading, user, fetched]);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error } = approve
      ? await oauth.approveAuthorization(authorizationId)
      : await oauth.denyAuthorization(authorizationId);
    if (error) {
      setBusy(false);
      return setError(error.message);
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      return setError("Le serveur d'autorisation n'a pas renvoyé d'URL de redirection.");
    }
    window.location.href = target;
  }

  const shell = (children: React.ReactNode) => (
    <>
      <SEO title="Autoriser l'accès | PulseMap" description="Autorise une application à accéder à ton compte PulseMap." noindex />
      <main className="min-h-screen flex items-center justify-center p-6 bg-background text-foreground">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
          {children}
        </div>
      </main>
    </>
  );

  if (!authorizationId || error) {
    return shell(
      <>
        <h1 className="text-xl font-black mb-2">Autorisation impossible</h1>
        <p className="text-sm text-muted-foreground">{error ?? "Lien d'autorisation invalide."}</p>
      </>,
    );
  }

  if (authLoading) return shell(<p className="text-sm text-muted-foreground">Chargement…</p>);

  if (!user) {
    return shell(
      <>
        <h1 className="text-xl font-black mb-1">Connecte-toi pour continuer</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Une application demande l'accès à ton compte PulseMap. Connecte-toi pour vérifier et autoriser cet accès.
        </p>
        <AuthScreen inline />
      </>,
    );
  }

  if (!details) return shell(<p className="text-sm text-muted-foreground">Chargement de la demande…</p>);

  const clientName = details.client?.name ?? "Une application";
  return shell(
    <>
      <h1 className="text-xl font-black mb-1">Connecter {clientName} à ton compte</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Cela permettra à <strong className="text-foreground">{clientName}</strong> d'utiliser les outils PulseMap en ton nom
        (recherche d'événements, favoris, participations, profil).
      </p>
      <p className="text-xs text-muted-foreground mb-6">
        Connecté en tant que <strong className="text-foreground">{user.email}</strong>. Cela ne contourne pas les règles
        d'accès de PulseMap.
      </p>
      {details.client?.redirect_uri && (
        <p className="text-xs text-muted-foreground mb-6 break-all">
          Redirection : <code>{details.client.redirect_uri}</code>
        </p>
      )}
      <div className="flex gap-3">
        <button
          disabled={busy}
          onClick={() => decide(true)}
          className="flex-1 rounded-xl px-4 py-3 font-bold bg-primary text-primary-foreground disabled:opacity-50"
        >
          {busy ? "…" : "Autoriser"}
        </button>
        <button
          disabled={busy}
          onClick={() => decide(false)}
          className="flex-1 rounded-xl px-4 py-3 font-bold border border-border disabled:opacity-50"
        >
          Refuser
        </button>
      </div>
    </>,
  );
}
