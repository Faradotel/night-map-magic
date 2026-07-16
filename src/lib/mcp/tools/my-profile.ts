import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";

function supabaseFor(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "my_profile",
  title: "Mon profil",
  description: "Renvoie le profil PulseMap de l'utilisateur connecté (pseudo, avatar, bio).",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Non authentifié." }], isError: true };
    }
    const { data, error } = await supabaseFor(ctx)
      .from("profiles")
      .select("*")
      .eq("user_id", ctx.getUserId())
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: `Erreur: ${error.message}` }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify({ email: ctx.getUserEmail(), profile: data }, null, 2) }],
      structuredContent: { email: ctx.getUserEmail(), profile: data },
    };
  },
});
