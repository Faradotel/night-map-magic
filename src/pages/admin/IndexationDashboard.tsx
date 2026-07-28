import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface Row {
  id: string;
  url: string;
  tier: number | null;
  first_tracked_at: string;
  last_checked_at: string | null;
  coverage_state: string | null;
  verdict: string | null;
  is_indexed: boolean;
  last_crawl_time: string | null;
  retired_at: string | null;
  retire_reason: string | null;
}

export default function IndexationDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [showRetired, setShowRetired] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .rpc("has_role", { _user_id: user.id, _role: "admin" as never })
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const { data } = await supabase
        .from("page_index_status")
        .select("*")
        .order("first_tracked_at", { ascending: false })
        .limit(5000);
      setRows((data as Row[]) || []);
      setLoading(false);
    })();
  }, [isAdmin]);

  const stats = useMemo(() => {
    const total = rows.length;
    const indexed = rows.filter(r => r.is_indexed).length;
    const notIndexed = rows.filter(r => !r.is_indexed && !r.retired_at && r.last_checked_at).length;
    const retired = rows.filter(r => r.retired_at).length;
    const neverChecked = rows.filter(r => !r.last_checked_at).length;
    return { total, indexed, notIndexed, retired, neverChecked };
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (!showRetired && r.retired_at) return false;
      if (showRetired && !r.retired_at) return false;
      if (filter && !r.url.toLowerCase().includes(filter.toLowerCase())) return false;
      return true;
    });
  }, [rows, filter, showRetired]);

  async function restore(id: string) {
    const { error } = await supabase
      .from("page_index_status")
      .update({ retired_at: null, retire_reason: null })
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Page restaurée");
      setRows(r => r.map(x => x.id === id ? { ...x, retired_at: null, retire_reason: null } : x));
    }
  }

  if (authLoading) return <div className="p-8">Chargement…</div>;
  if (!user) return <Navigate to="/" replace />;
  if (isAdmin === false) return <div className="p-8">Accès refusé.</div>;
  if (isAdmin === null || loading) return <div className="p-8">Chargement…</div>;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Suivi indexation Google</h1>

        <AiIntrosPanel />

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Stat label="Total tracké" value={stats.total} />
          <Stat label="Indexé" value={stats.indexed} tone="text-green-600" />
          <Stat label="Non indexé" value={stats.notIndexed} tone="text-amber-600" />
          <Stat label="Retiré (410)" value={stats.retired} tone="text-red-600" />
          <Stat label="Jamais vérifié" value={stats.neverChecked} tone="text-muted-foreground" />
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <Input
            placeholder="Filtrer par URL…"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="max-w-md"
          />
          <Button variant={showRetired ? "default" : "outline"} onClick={() => setShowRetired(v => !v)}>
            {showRetired ? "Voir actives" : "Voir retirées"}
          </Button>
          <span className="text-sm text-muted-foreground">{filtered.length} résultats</span>
        </div>

        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr className="text-left">
                <th className="p-2">URL</th>
                <th className="p-2">Tier</th>
                <th className="p-2">Statut</th>
                <th className="p-2">Coverage</th>
                <th className="p-2">Vérifié</th>
                <th className="p-2">Tracké depuis</th>
                <th className="p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 500).map(r => {
                const ageDays = Math.floor((Date.now() - new Date(r.first_tracked_at).getTime()) / 86400_000);
                return (
                  <tr key={r.id} className="border-t">
                    <td className="p-2 font-mono text-xs truncate max-w-md">{r.url.replace("https://pulse-map.live", "")}</td>
                    <td className="p-2">{r.tier ?? "—"}</td>
                    <td className="p-2">
                      {r.retired_at ? <span className="text-red-600">Retirée</span>
                        : r.is_indexed ? <span className="text-green-600">Indexée</span>
                        : r.last_checked_at ? <span className="text-amber-600">Non indexée</span>
                        : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="p-2 text-xs">{r.coverage_state || "—"}</td>
                    <td className="p-2 text-xs">{r.last_checked_at ? new Date(r.last_checked_at).toLocaleDateString("fr-FR") : "—"}</td>
                    <td className="p-2 text-xs">{ageDays}j</td>
                    <td className="p-2">
                      {r.retired_at && (
                        <Button size="sm" variant="outline" onClick={() => restore(r.id)}>Restaurer</Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length > 500 && (
            <div className="p-3 text-xs text-muted-foreground text-center">Seuls les 500 premiers résultats affichés.</div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-2xl font-bold ${tone ?? ""}`}>{value.toLocaleString("fr-FR")}</div>
    </Card>
  );
}
