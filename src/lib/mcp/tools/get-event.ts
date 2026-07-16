import { createClient } from "@supabase/supabase-js";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "get_event",
  title: "Détails d'un événement",
  description: "Récupère la fiche complète d'un événement PulseMap par son identifiant.",
  inputSchema: {
    event_id: z.string().min(1).describe("Identifiant de l'événement (ex: 'sg-paris-abc', 'icf-lyon-xxx')."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ event_id }) => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { data, error } = await supabase
      .from("cached_events")
      .select("*")
      .eq("id", event_id)
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: `Erreur: ${error.message}` }], isError: true };
    if (!data) return { content: [{ type: "text", text: "Événement introuvable." }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { event: data },
    };
  },
});
