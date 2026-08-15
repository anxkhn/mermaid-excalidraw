import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { chromium } from "playwright";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DIST_DIR = join(ROOT, "dist");
const BUNDLE_PATH = join(DIST_DIR, "renderer.iife.js");
const HTML_PATH = join(DIST_DIR, "renderer.html");

export async function ensureRenderer() {
  mkdirSync(DIST_DIR, { recursive: true });
  await build({
    entryPoints: [join(ROOT, "scripts", "renderer.mjs")],
    bundle: true,
    format: "iife",
    platform: "browser",
    outfile: BUNDLE_PATH,
    logLevel: "silent",
  });
  writeFileSync(
    HTML_PATH,
    `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Mermaid to Excalidraw</title>
  </head>
  <body>
    <script src="./renderer.iife.js"></script>
  </body>
</html>
`,
  );
  return { bundlePath: BUNDLE_PATH, htmlPath: HTML_PATH };
}

async function launchBrowser() {
  const attempts = [
    { channel: "chrome" },
    { channel: "msedge" },
    { channel: "chromium" },
    {},
  ];
  let lastError;
  for (const options of attempts) {
    try {
      return await chromium.launch({ ...options, headless: true });
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(
    `Could not launch a browser. Install Google Chrome, or run: npx playwright install chromium\n${lastError?.message ?? ""}`,
  );
}

export async function createConverter() {
  await ensureRenderer();
  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.goto(`file://${HTML_PATH}`, { waitUntil: "load" });
  await page.waitForFunction(() => typeof window.convertMermaid === "function");

  const convert = async (definition, options) => {
    return page.evaluate(
      async ({ definition: mermaid, options: convertOptions }) => {
        return window.convertMermaid(mermaid, convertOptions);
      },
      { definition, options },
    );
  };

  const close = async () => {
    await browser.close();
  };

  return { convert, close };
}


