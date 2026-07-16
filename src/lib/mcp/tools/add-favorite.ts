import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseFor(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "add_favorite",
  title: "Ajouter un favori",
  description: "Ajoute un événement aux favoris de l'utilisateur PulseMap connecté.",
  inputSchema: {
    event_id: z.string().min(1),
    event_name: z.string().min(1),
    event_city: z.string().min(1),
    event_date: z.string().optional().describe("Date ISO 8601 de l'événement (facultatif)."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ event_id, event_name, event_city, event_date }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Non authentifié." }], isError: true };
    }
    const { data, error } = await supabaseFor(ctx)
      .from("event_favorites")
      .upsert(
        { user_id: ctx.getUserId(), event_id, event_name, event_city, event_date: event_date ?? null },
        { onConflict: "user_id,event_id" },
      )
      .select()
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: `Erreur: ${error.message}` }], isError: true };
    return {
      content: [{ type: "text", text: `Favori ajouté: ${event_name}` }],
      structuredContent: { favorite: data },
    };
  },
});
