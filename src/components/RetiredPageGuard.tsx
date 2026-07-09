import { Helmet } from "react-helmet-async";
import { useRetiredPageRedirect } from "@/hooks/useRetiredPageRedirect";

/**
 * Wrap SEO route pages so retired URLs emit <meta robots="noindex,nofollow">
 * and get redirected to their parent city. Renders children when the page is
 * still live.
 */
export function RetiredPageGuard({ children }: { children: React.ReactNode }) {
  const { loading, retired } = useRetiredPageRedirect();

  if (retired) {
    return (
      <>
        <Helmet>
          <meta name="robots" content="noindex,nofollow" />
          <title>Page retirée — PulseMap</title>
        </Helmet>
        <div className="min-h-screen flex items-center justify-center p-6 text-center">
          <p className="text-muted-foreground">Redirection en cours…</p>
        </div>
      </>
    );
  }

  if (loading) return <>{children}</>;
  return <>{children}</>;
}
