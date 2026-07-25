import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  is_active: boolean;
  last_used_at: string | null;
  usage_count: number;
  created_at: string;
  revoked_at: string | null;
}

export default function ApiKeysAdmin() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("api-keys-admin", { method: "GET" });
    if (error) toast.error(error.message);
    else setKeys(data?.keys ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    const { data, error } = await supabase.functions.invoke("api-keys-admin", {
      method: "POST",
      body: { name },
    });
    if (error) return toast.error(error.message);
    if (data?.key) {
      setNewKey(data.key);
      setName("");
      load();
    }
  };

  const revoke = async (id: string) => {
    if (!confirm("Révoquer cette clé ?")) return;
    const { error } = await supabase.functions.invoke("api-keys-admin", {
      method: "POST",
      body: { action: "revoke", id },
    });
    if (error) return toast.error(error.message);
    toast.success("Clé révoquée");
    load();
  };

  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/events-api`;

  return (
    <div className="min-h-screen bg-background text-foreground p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Clés API — Événements</h1>

      <div className="rounded-lg border border-border p-4 bg-card space-y-2">
        <p className="text-sm text-muted-foreground">Endpoint public :</p>
        <code className="text-xs break-all block bg-muted p-2 rounded">{apiUrl}</code>
        <p className="text-xs text-muted-foreground">
          Header requis : <code>x-api-key: pm_live_...</code><br />
          Paramètres : <code>city, genre, vibe, source, from, to, limit, offset, lat, lng, radius_km, include_past</code>
        </p>
      </div>

      <div className="rounded-lg border border-border p-4 bg-card space-y-3">
        <h2 className="font-semibold">Créer une nouvelle clé</h2>
        <div className="flex gap-2">
          <Input placeholder="Nom (ex: App mobile iOS)" value={name} onChange={e => setName(e.target.value)} />
          <Button onClick={create} disabled={!name.trim()}>Générer</Button>
        </div>
        {newKey && (
          <div className="rounded bg-yellow-500/10 border border-yellow-500/40 p-3 space-y-2">
            <p className="text-sm font-semibold text-yellow-500">⚠️ Copie cette clé maintenant, elle ne sera plus jamais affichée :</p>
            <code className="text-xs break-all block bg-background p-2 rounded select-all">{newKey}</code>
            <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(newKey); toast.success("Copié"); }}>
              Copier
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-3">Nom</th>
              <th className="text-left p-3">Préfixe</th>
              <th className="text-left p-3">Utilisations</th>
              <th className="text-left p-3">Dernière</th>
              <th className="text-left p-3">Statut</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">Chargement…</td></tr>}
            {!loading && keys.length === 0 && <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">Aucune clé</td></tr>}
            {keys.map(k => (
              <tr key={k.id} className="border-t border-border">
                <td className="p-3">{k.name}</td>
                <td className="p-3"><code className="text-xs">{k.key_prefix}…</code></td>
                <td className="p-3">{k.usage_count}</td>
                <td className="p-3 text-xs">{k.last_used_at ? new Date(k.last_used_at).toLocaleString("fr-FR") : "—"}</td>
                <td className="p-3">
                  {k.is_active
                    ? <span className="text-green-500">Active</span>
                    : <span className="text-red-500">Révoquée</span>}
                </td>
                <td className="p-3 text-right">
                  {k.is_active && (
                    <Button size="sm" variant="destructive" onClick={() => revoke(k.id)}>Révoquer</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
