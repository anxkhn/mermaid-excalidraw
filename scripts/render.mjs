#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { chromium } from "playwright";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const HTML = join(DIST, "renderer.html");

const parseArgs = (argv) => {
  const options = {
    input: null,
    output: "diagram.png",
    format: "png",
    background: "#ffffff",
    fontSize: 20,
    fontColor: null,
    scale: 2,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    const next = argv[i + 1];
    if (token === "--input" || token === "-i") options.input = next;
    else if (token === "--output" || token === "-o") options.output = next;
    else if (token === "--format") options.format = next;
    else if (token === "--bg") options.background = next === "white" ? "#ffffff" : next;
    else if (token === "--font-size") options.fontSize = Number(next);
    else if (token === "--font-color") options.fontColor = next;
    else if (token === "--scale") options.scale = Number(next);
    else continue;
    i += 1;
  }
  return options;
};

const launchBrowser = async () => {
  for (const options of [{ channel: "chrome" }, { channel: "msedge" }, {}]) {
    try {
      return await chromium.launch({ ...options, headless: true });
    } catch {}
  }
  throw new Error(
    "Could not launch Chrome. Install Google Chrome or run: npx playwright install chromium",
  );
};

const ensureRenderer = async () => {
  mkdirSync(DIST, { recursive: true });
  await build({
    entryPoints: [join(ROOT, "scripts", "renderer.mjs")],
    bundle: true,
    format: "iife",
    platform: "browser",
    outfile: join(DIST, "renderer.iife.js"),
    logLevel: "silent",
  });
  writeFileSync(
    HTML,
    `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><script src="./renderer.iife.js"></script></body></html>`,
  );
};

const readDefinition = async (input) => {
  if (!input || input === "-") {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    return Buffer.concat(chunks).toString("utf8");
  }
  const { readFileSync } = await import("node:fs");
  return readFileSync(input, "utf8");
};

const main = async () => {
  const options = parseArgs(process.argv.slice(2));
  const definition = (await readDefinition(options.input)).trim();
  if (!definition) throw new Error("Mermaid input is empty");

  await ensureRenderer();
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.goto(`file://${HTML}`, { waitUntil: "load" });
    await page.waitForFunction(() => typeof window.convertMermaid === "function");
    const result = await page.evaluate(
      async ({ definition: mermaid, options: convertOptions }) =>
        window.convertMermaid(mermaid, convertOptions),
      {
        definition,
        options: {
          format: options.format,
          background: options.background,
          fontSize: options.fontSize,
          fontColor: options.fontColor,
          scale: options.scale,
        },
      },
    );
    mkdirSync(dirname(options.output) || ".", { recursive: true });
    if (options.format === "svg") writeFileSync(options.output, result.svg);
    else writeFileSync(options.output, Buffer.from(result.pngBase64, "base64"));
    process.stdout.write(`${options.output}\n`);
  } finally {
    await browser.close();
  }
};

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
