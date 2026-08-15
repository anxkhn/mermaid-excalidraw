#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { HELP, parseArgs } from "./lib/args.mjs";
import { createConverter } from "./lib/browser.mjs";
import {
  diagramKind,
  extractMermaidBlocks,
  replaceMermaidBlocks,
} from "./lib/markdown.mjs";

const readStdin = async () => {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
};

const normalizeBackground = (value) => {
  if (!value || value === "white") {
    return "#ffffff";
  }
  if (value === "transparent") {
    return "transparent";
  }
  return value;
};

const inferFormat = (output, format) => {
  if (format) {
    return format;
  }
  const extension = extname(output || "").toLowerCase();
  if (extension === ".svg") return "svg";
  if (extension === ".excalidraw" || extension === ".json") return "excalidraw";
  return "png";
};

const writeResult = (output, format, result) => {
  mkdirSync(dirname(output), { recursive: true });
  if (format === "svg") {
    writeFileSync(output, result.svg);
    return;
  }
  if (format === "excalidraw") {
    writeFileSync(output, `${JSON.stringify(result.scene, null, 2)}\n`);
    return;
  }
  writeFileSync(output, Buffer.from(result.pngBase64, "base64"));
};

const convertOne = async (converter, definition, options, output) => {
  const format = inferFormat(output, options.format);
  const result = await converter.convert(definition, {
    format,
    background: normalizeBackground(options.background),
    fontSize: options.fontSize,
    fontColor: options.fontColor,
    scale: options.scale,
    padding: options.padding,
  });
  writeResult(output, format, result);
  return { output, format, elementCount: result.elementCount };
};

const runMarkdown = async (converter, options) => {
  const markdownPath = resolve(options.markdown);
  const markdown = readFileSync(markdownPath, "utf8");
  const blocks = extractMermaidBlocks(markdown);
  if (blocks.length === 0) {
    throw new Error(`No mermaid fences found in ${markdownPath}`);
  }

  const outDir = resolve(options.outDir || join(dirname(markdownPath), "images"));
  mkdirSync(outDir, { recursive: true });
  const format = options.format || "png";
  const extension =
    format === "svg" ? "svg" : format === "excalidraw" ? "excalidraw" : "png";

  const replacements = [];
  const counts = {};
  for (const block of blocks) {
    const kind = diagramKind(block.definition);
    counts[kind] = (counts[kind] || 0) + 1;
    const filename = `${options.prefix}-${kind}-${counts[kind]}.${extension}`;
    const output = join(outDir, filename);
    const converted = await convertOne(converter, block.definition, options, output);
    const src = relative(dirname(markdownPath), output).split("\\").join("/");
    replacements.push({
      alt: `${kind} diagram`,
      src,
      definition: block.definition,
      ...converted,
    });
    console.log(`wrote ${output} (${converted.elementCount} elements)`);
  }

  if (options.replace) {
    const next = replaceMermaidBlocks(markdown, replacements, {
      keepSource: options.keepSource,
    });
    writeFileSync(markdownPath, next);
    console.log(`updated ${markdownPath}`);
  }

  return replacements;
};

const main = async () => {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(HELP);
    return;
  }

  if (Number.isNaN(options.fontSize) || options.fontSize <= 0) {
    throw new Error("--font-size must be a positive number");
  }
  if (Number.isNaN(options.scale) || options.scale <= 0) {
    throw new Error("--scale must be a positive number");
  }

  const converter = await createConverter();
  try {
    if (options.markdown) {
      await runMarkdown(converter, options);
      return;
    }

    let definition = "";
    if (options.input === "-" || (!options.input && !process.stdin.isTTY)) {
      definition = await readStdin();
    } else if (options.input) {
      definition = readFileSync(resolve(options.input), "utf8");
    } else {
      throw new Error("Provide --input, stdin, or --markdown. See --help.");
    }

    definition = definition.trim();
    if (!definition) {
      throw new Error("Mermaid input is empty");
    }

    const output = resolve(options.output || `diagram.${options.format || "png"}`);
    const converted = await convertOne(converter, definition, options, output);
    console.log(`wrote ${converted.output} (${converted.elementCount} elements)`);
  } finally {
    await converter.close();
  }
};

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
  main().catch((error) => {
    console.error(error.message || error);
    process.exitCode = 1;
  });
}
