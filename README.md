# mermaid-excalidraw

[![skills.sh installs](https://skills.sh/b/anxkhn/mermaid-excalidraw)](https://skills.sh/anxkhn/mermaid-excalidraw)

A portable [agent skill](https://agentskills.io) that turns Mermaid diagrams in a markdown blog or doc into hand-drawn PNG or SVG images you can upload with the post.

Works in any harness that loads `SKILL.md` (Claude Code, Codex, Cursor, OpenCode, and others).

## Install

```bash
npx skills add anxkhn/mermaid-excalidraw
```

Or clone it into whatever skills directory your agent uses:

```bash
git clone https://github.com/anxkhn/mermaid-excalidraw.git
```

Then say something like: "convert the mermaid diagrams in blog.md" or "export these mermaid blocks as transparent PNGs".

## Script

The skill runs `scripts/convert.py`. Python 3 only. No extra packages.

```bash
python3 scripts/convert.py blog.md
python3 scripts/convert.py blog.md --out-dir images --bg transparent
python3 scripts/convert.py --input diagram.mmd --output diagram.png
```

Default: write PNGs into `images/` next to the markdown file and leave the mermaid fences alone. Pass `--replace` only if you want the fences rewritten to image tags.

## License

MIT
