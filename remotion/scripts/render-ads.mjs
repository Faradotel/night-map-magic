import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition, openBrowser } from "@remotion/renderer";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ids = process.argv.slice(2);
if (ids.length === 0) throw new Error("usage: node render-ads.mjs ad01 ad02 ...");

const bundled = await bundle({
  entryPoint: path.resolve(__dirname, "../src/index.ts"),
  webpackOverride: (config) => config,
});

const browser = await openBrowser("chrome", {
  browserExecutable: process.env.PUPPETEER_EXECUTABLE_PATH ?? "/bin/chromium",
  chromiumOptions: { args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"] },
  chromeMode: "chrome-for-testing",
});

for (const id of ids) {
  const composition = await selectComposition({ serveUrl: bundled, id, puppeteerInstance: browser });
  const out = `/mnt/documents/pulsemap-ads/${id}.mp4`;
  await renderMedia({
    composition,
    serveUrl: bundled,
    codec: "h264",
    outputLocation: out,
    puppeteerInstance: browser,
    muted: true,
    concurrency: 2,
  });
  console.log("DONE", out);
}

await browser.close({ silent: false });
