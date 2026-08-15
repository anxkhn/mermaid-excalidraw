---
name: mermaid-excalidraw-skill
description: Convert Mermaid.js fences in markdown blogs and docs into PNG or SVG images using Mermaid's own theme and fonts. Use when a post has mermaid blocks or the user asks to export mermaid embeddings as uploadable images.
license: GPL-3.0
metadata:
  version: "1.0.0"
  author: anxkhn
  tags: mermaid, mermaidjs, diagrams, markdown, blog, documentation, agent-skills
---

# mermaid-excalidraw-skill

Turn ` ```mermaid ` blocks into images a blog or static site can upload. GitHub can render Mermaid natively. Most blogs cannot. The images use Mermaid's default theme and fonts.

Do not reimplement the renderer. Run `scripts/convert.py`.

## How to behave

Read the user's request in natural language and map it onto the script. Do not ask for flags unless something required is missing.

- "convert the mermaid in this blog" → write PNGs next to the post
- "make them transparent" → `--bg transparent`
- "white background" → `--bg white` (this is the default)
- "bigger labels" / "font size 22" → `--font-size 22`
- "dark text" / "font color #111" → `--font-color '#111111'`
- "SVG" → `--format svg`
- "put them in assets/" → `--out-dir assets`
- "replace the mermaid in the file" → add `--replace`
- If they do not ask to rewrite the markdown, only write image files

Defaults when they say nothing extra: white background, PNG, `images/` beside the markdown file, leave the mermaid fences alone.

## Convert a blog or doc

```bash
python3 scripts/convert.py /path/to/post.md
```

Images land in `/path/to/images/diagram-sequence-1.png` and similar names. Upload that folder with the post.

```bash
python3 scripts/convert.py /path/to/post.md --out-dir /path/to/images --bg transparent --font-size 18
```

Only rewrite the markdown if they asked:

```bash
python3 scripts/convert.py /path/to/post.md --replace
```

That swaps each fence for:

```markdown
<!-- mermaid
flowchart TD
  A --> B
-->

![flowchart diagram](images/diagram-flowchart-1.png)
```

## Convert one diagram

```bash
python3 scripts/convert.py --input diagram.mmd --output diagram.png
python3 scripts/convert.py --input - --output diagram.svg --format svg --bg transparent
```

## Workflow

1. Find mermaid fences in the file the user pointed at.
2. Decide `--bg`, `--font-size`, `--font-color`, `--format`, and `--out-dir` from what they said.
3. Run `scripts/convert.py` from this skill folder.
4. Tell them where the images were written so they can upload them with the blog.
5. Do not invent new diagram content. Convert the mermaid that is already there.

## Notes

The script renders with Mermaid's default theme and fonts. It calls mermaid.ink and needs network access. Requires Python 3 only.
