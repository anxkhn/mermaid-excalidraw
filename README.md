# mermaid-excalidraw-skill

[![skills.sh](https://skills.sh/b/anxkhn/mermaid-excalidraw-skill)](https://skills.sh/anxkhn/mermaid-excalidraw-skill)

A portable [agent skill](https://agentskills.io) that turns Mermaid diagrams in a markdown blog or doc into PNG or SVG images using Mermaid's own theme and fonts.

Works in any harness that loads `SKILL.md` (Claude Code, Codex, Cursor, OpenCode, and others).

## Install

```bash
npx skills add anxkhn/mermaid-excalidraw-skill
```

Global install, including the `/mermaid-excalidraw-skill` command in Claude Code:

```bash
npx skills add anxkhn/mermaid-excalidraw-skill -g -a claude-code -a opencode -y
```

Then say "convert the mermaid diagrams in blog.md" or type `/mermaid-excalidraw-skill`.

## Script

The skill runs `scripts/convert.py`. Python 3 only. No extra packages.

```bash
python3 scripts/convert.py blog.md
python3 scripts/convert.py blog.md --out-dir images --bg transparent
python3 scripts/convert.py --input diagram.mmd --output diagram.png
```

Default: write PNGs into `images/` next to the markdown file and leave the mermaid fences alone. Pass `--replace` only if you want the fences rewritten to image tags.

## License

[GNU GPLv3](LICENSE)
