import { createClient } from "@supabase/supabase-js";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "search_events",
  title: "Rechercher des événements",
  description:
    "Recherche les événements PulseMap à venir (soirées, concerts, festivals, brocantes, sport, sorties). Filtres optionnels par ville, texte libre, type et fenêtre de dates. Renvoie jusqu'à 50 résultats avec lieu, adresse, coordonnées GPS et lien billetterie.",
  inputSchema: {
    city: z.string().optional().describe("Ville française (ex: 'Paris', 'Lyon'). Insensible à la casse."),
    query: z.string().optional().describe("Texte à chercher dans le nom, la description ou le lieu."),
    type: z.string().optional().describe("Type d'événement (ex: 'concert', 'festival', 'soiree', 'brocante', 'sport')."),
    from: z.string().optional().describe("Date de début ISO 8601. Par défaut : maintenant."),
    to: z.string().optional().describe("Date de fin ISO 8601. Par défaut : dans 90 jours."),
    limit: z.number().int().min(1).max(50).optional().describe("Nombre max de résultats (défaut 20, max 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ city, query, type, from, to, limit }) => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const nowIso = from ?? new Date().toISOString();
    const untilIso = to ?? new Date(Date.now() + 90 * 86400_000).toISOString();
    let q = supabase
      .from("cached_events")
      .select("id,name,city,venue,address,lat,lng,start_time,end_time,description,image_url,ticket_url,price_range,type,source")
      .gte("start_time", nowIso)
      .lte("start_time", untilIso)
      .order("start_time", { ascending: true })
      .limit(Math.min(limit ?? 20, 50));
    if (city) q = q.ilike("city", city);
    if (type) q = q.eq("type", type);
    if (query) q = q.or(`name.ilike.%${query}%,description.ilike.%${query}%,venue.ilike.%${query}%`);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: `Erreur: ${error.message}` }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { events: data ?? [], count: data?.length ?? 0 },
    };
  },
});
