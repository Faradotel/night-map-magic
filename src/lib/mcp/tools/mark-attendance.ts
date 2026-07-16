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
  name: "mark_attendance",
  title: "Je participe",
  description: "Indique que l'utilisateur connecté prévoit d'aller à un événement PulseMap. Notifie les amis abonnés.",
  inputSchema: {
    event_id: z.string().min(1),
    event_name: z.string().min(1),
    event_city: z.string().min(1),
    event_date: z.string().optional().describe("Date ISO 8601 (facultatif)."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ event_id, event_name, event_city, event_date }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Non authentifié." }], isError: true };
    }
    const { data, error } = await supabaseFor(ctx)
      .from("event_attendance")
      .upsert(
        { user_id: ctx.getUserId(), event_id, event_name, event_city, event_date: event_date ?? null },
        { onConflict: "user_id,event_id" },
      )
      .select()
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: `Erreur: ${error.message}` }], isError: true };
    return {
      content: [{ type: "text", text: `Participation confirmée: ${event_name}` }],
      structuredContent: { attendance: data },
    };
  },
});
