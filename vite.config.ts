import { defineConfig, type Plugin } from "vite";
import { spawnSync } from "child_process";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/supabase/vite";

// Prerender of the SEO pages after the build (scripts/prerender.ts).
// Runs in a child process so a failure can never break the build.
function prerenderPlugin(): Plugin {
  let outDir = "dist";
  return {
    name: "pulsemap-prerender",
    apply: "build",
    enforce: "post",
    configResolved(c) { outDir = c.build.outDir; },
    closeBundle() {
      if (process.env.SKIP_PRERENDER) return;
      for (const cmd of [["bunx", "tsx"], ["npx", "--yes", "tsx"]]) {
        try {
          const r = spawnSync(cmd[0], [...cmd.slice(1), "scripts/prerender.ts", outDir], { stdio: "inherit", timeout: 240_000 });
          if (!r.error && r.status === 0) return;
        } catch { /* try next runner */ }
      }
      console.warn("[prerender] skipped, SPA fallback kept");
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: '/',
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mcpPlugin(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        // Prerendered SEO pages are served from the network, never precached.
        globIgnores: ["sortir-ce-soir/**", "categories/**", "evenements/**", "villes/**"],
      },
      manifest: {
        name: "PulseMap – Soirées & Événements",
        short_name: "PulseMap",
        description: "Découvre les soirées, concerts et bars animés autour de toi",
        theme_color: "#0f0a1a",
        background_color: "#0f0a1a",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/favicon.ico",
            sizes: "48x48 256x256",
            type: "image/x-icon",
          },
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/apple-touch-icon.png",
            sizes: "180x180",
            type: "image/png",
            purpose: "any",
          },
        ],
      },
    }),
    prerenderPlugin(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
