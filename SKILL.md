---
name: mermaid-excalidraw
description: Convert Mermaid.js diagrams in GitHub-flavored markdown blogs and docs into hand-drawn Excalidraw PNG or SVG images. Use when a markdown file has mermaid fences, the user wants Excalidraw-style diagrams, or they ask to replace mermaid.js embeddings with images.
license: MIT
metadata:
  version: "1.0.0"
  author: anxkhn
---

# Mermaid to Excalidraw

Turn ` ```mermaid ` fences into Excalidraw-style images for blogs and documentation. GitHub can render Mermaid natively. Many blog engines and static sites cannot, and the Excalidraw look reads as more hand-drawn.

Do not reimplement the converter. Run the script in this skill.

## Setup

From this skill directory, install dependencies once:

```bash
npm install
```

The script uses system Google Chrome when available. If launch fails:

```bash
npx playwright install chromium
```

## Convert a markdown file

This is the usual blog or docs path. It finds every mermaid fence and writes images next to the file.

```bash
node scripts/convert.mjs --markdown /path/to/post.md --out-dir /path/to/images --replace
```

`--replace` swaps each fence for an image reference and keeps the Mermaid source in an HTML comment:

```markdown
<!-- mermaid
flowchart TD
  A --> B
-->

![flowchart diagram](images/diagram-flowchart-1.png)
```

Preview without rewriting the markdown:

```bash
node scripts/convert.mjs --markdown /path/to/post.md --out-dir /path/to/images
```

## Convert one diagram

```bash
node scripts/convert.mjs diagram.mmd -o diagram.png
node scripts/convert.mjs --input - --output diagram.svg --format svg
```

## Options

| Flag | Default | Notes |
| --- | --- | --- |
| `--background` | `white` | `transparent`, `white`, or `#hex` |
| `--font-size` | `20` | Label size in px |
| `--font-color` | Excalidraw default | For example `#1e1e1e` |
| `--format` | from output ext | `png`, `svg`, or `excalidraw` |
| `--scale` | `2` | PNG scale |
| `--prefix` | `diagram` | Markdown image filename prefix |
| `--no-keep-source` | off | Drop the HTML comment when replacing |

## Workflow

1. Read the markdown and list mermaid fences.
2. Choose an image directory near the post, usually `images/` next to the file.
3. Run `scripts/convert.mjs --markdown ... --replace`.
4. Check the generated images with the file reader.
5. Leave mermaid source in the HTML comment unless the user asks to delete it.
6. Do not invent new diagram content. Convert the mermaid that is already there.

## Supported diagrams

Native Excalidraw shapes: flowchart, sequence, state, class, ER. Other Mermaid types fall back to an embedded Mermaid image inside the Excalidraw export.

## Paths

Resolve `scripts/convert.mjs` from this skill folder, not from the user's project root.
