# mermaid-excalidraw

[![skills.sh installs](https://skills.sh/b/anxkhn/mermaid-excalidraw)](https://skills.sh/anxkhn/mermaid-excalidraw)

Convert [Mermaid](https://mermaid.js.org) diagrams into hand-drawn [Excalidraw](https://excalidraw.com) PNG or SVG images. Built as an OpenCode / agent skill with a script, and usable as a plain CLI.

GitHub-flavored markdown can render Mermaid fences. Most blogs and static sites cannot. This replaces those fences with images that still look sketched rather than generated.

Uses [`@excalidraw/mermaid-to-excalidraw`](https://github.com/excalidraw/mermaid-to-excalidraw) and `@excalidraw/excalidraw`, rendered in a real browser so layout matches Excalidraw.

## Install the skill

```bash
npx skills add anxkhn/mermaid-excalidraw
```

Global install:

```bash
npx skills add anxkhn/mermaid-excalidraw --global
```

Or clone it into a skills directory:

```bash
git clone https://github.com/anxkhn/mermaid-excalidraw.git ~/.config/opencode/skills/mermaid-excalidraw
cd ~/.config/opencode/skills/mermaid-excalidraw
npm install
```

Restart OpenCode after installing.

## CLI

```bash
npm install
node scripts/convert.mjs diagram.mmd -o diagram.png
```

From a markdown post:

```bash
node scripts/convert.mjs --markdown blog.md --out-dir images --replace
```

That writes `images/diagram-sequence-1.png` (and so on) and rewrites each fence to:

```markdown
<!-- mermaid
sequenceDiagram
  A->>B: Hello
-->

![sequence diagram](images/diagram-sequence-1.png)
```

### Options

| Flag | Default | Notes |
| --- | --- | --- |
| `-i, --input` | | Mermaid file, or `-` for stdin |
| `-o, --output` | `diagram.png` | `.png`, `.svg`, or `.excalidraw` |
| `-f, --format` | from extension | `png`, `svg`, `excalidraw` |
| `-b, --background` | `white` | `transparent`, `white`, or `#hex` |
| `--font-size` | `20` | Label size in px |
| `--font-color` | Excalidraw default | For example `#1e1e1e` |
| `--scale` | `2` | PNG scale |
| `--markdown` | | Convert every mermaid fence |
| `--out-dir` | `images/` next to the file | Markdown image directory |
| `--replace` | off | Rewrite fences to image tags |
| `--prefix` | `diagram` | Image filename prefix |

## Library-style usage

The package is a script-first CLI. Agents should run `scripts/convert.mjs` instead of reimplementing the converter.

```bash
npx github:anxkhn/mermaid-excalidraw --markdown ./docs/guide.md --out-dir ./docs/images --replace
```

## Requirements

- Node.js 20+
- Google Chrome (preferred) or `npx playwright install chromium`

## Supported diagrams

Native Excalidraw conversion: flowchart, sequence, state, class, and ER. Other Mermaid types are exported as an embedded Mermaid image.

## License

MIT
