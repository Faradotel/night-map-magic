import { createClient } from "@supabase/supabase-js";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "tonight_hotspots",
  title: "Lieux chauds ce soir",
  description: "Retourne les événements les plus populaires ce soir sur PulseMap (nombre de participants confirmés).",
  inputSchema: {
    limit: z.number().int().min(1).max(30).optional().describe("Nombre max de spots (défaut 10, max 30)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }) => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { data, error } = await supabase.rpc("get_tonight_hotspots", { _limit: Math.min(limit ?? 10, 30) });
    if (error) return { content: [{ type: "text", text: `Erreur: ${error.message}` }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { hotspots: data ?? [] },
    };
  },
});
