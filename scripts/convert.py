#!/usr/bin/env python3
# Copyright (C) 2026 Anas Khan
# SPDX-License-Identifier: GPL-3.0-or-later
"""Render Mermaid diagrams as sketch-style PNG or SVG images."""

from __future__ import annotations

import argparse
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

SKILL_ROOT = Path(__file__).resolve().parent.parent

FENCE_RE = re.compile(r"```mermaid[^\n]*\n(.*?)```", re.S)
KIND_RE = re.compile(r"^(sequenceDiagram|stateDiagram(?:-v2)?|classDiagram|erDiagram|gantt|pie|gitGraph|flowchart|graph)\b", re.I)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Convert Mermaid fences or a .mmd file into images."
    )
    parser.add_argument("markdown", nargs="?", help="Markdown file with mermaid fences")
    parser.add_argument("--input", "-i", help="Single Mermaid file, or - for stdin")
    parser.add_argument("--output", "-o", help="Output image for a single diagram")
    parser.add_argument("--out-dir", help="Directory for markdown images (default: images/)")
    parser.add_argument("--prefix", default="diagram", help="Filename prefix")
    parser.add_argument("--bg", default="white", help="white, transparent, or #hex")
    parser.add_argument("--font-size", type=int, default=None, dest="font_size")
    parser.add_argument("--font-color", default=None, dest="font_color")
    parser.add_argument("--format", choices=("png", "svg"), default="png")
    parser.add_argument(
        "--replace",
        action="store_true",
        help="Rewrite mermaid fences to image tags in the markdown file",
    )
    return parser.parse_args()


def extract_blocks(markdown: str) -> list[str]:
    return [match.group(1).strip() for match in FENCE_RE.finditer(markdown)]


def diagram_kind(definition: str) -> str:
    for line in definition.splitlines():
        text = line.strip()
        if not text or text.startswith("%%") or text.startswith("---"):
            continue
        match = KIND_RE.match(text)
        if match:
            token = match.group(1).lower()
            if token.startswith("sequence"):
                return "sequence"
            if token.startswith("state"):
                return "state"
            if token.startswith("class"):
                return "class"
            if token.startswith("er"):
                return "er"
            if token.startswith("flowchart") or token.startswith("graph"):
                return "flowchart"
            return token
        return "diagram"
    return "diagram"


def ensure_renderer() -> None:
    if (SKILL_ROOT / "node_modules" / "playwright").exists():
        return
    npm = shutil.which("npm")
    if not npm:
        raise SystemExit("Node.js and npm are required. Install them, then run npm install in the skill folder.")
    subprocess.run([npm, "install"], cwd=SKILL_ROOT, check=True)


def render(definition: str, output: Path, *, fmt: str, background: str, font_size: int | None, font_color: str | None) -> None:
    ensure_renderer()
    node = shutil.which("node")
    if not node:
        raise SystemExit("Node.js is required to render Excalidraw diagrams.")
    command = [
        node,
        str(SKILL_ROOT / "scripts" / "render.mjs"),
        "--input",
        "-",
        "--output",
        str(output),
        "--format",
        fmt,
        "--bg",
        background,
    ]
    if font_size:
        command.extend(["--font-size", str(font_size)])
    if font_color:
        command.extend(["--font-color", font_color])
    result = subprocess.run(
        command,
        input=definition.encode("utf-8"),
        cwd=SKILL_ROOT,
        capture_output=True,
    )
    if result.returncode != 0:
        detail = (result.stderr or result.stdout).decode("utf-8", "replace").strip()
        raise SystemExit(detail or "Renderer failed")


def convert_markdown(args: argparse.Namespace) -> None:
    markdown_path = Path(args.markdown).expanduser().resolve()
    markdown = markdown_path.read_text()
    blocks = extract_blocks(markdown)
    if not blocks:
        raise SystemExit(f"No mermaid fences in {markdown_path}")

    out_dir = Path(args.out_dir).expanduser().resolve() if args.out_dir else markdown_path.parent / "images"
    counts: dict[str, int] = {}
    replacements: list[tuple[str, str]] = []

    for definition in blocks:
        kind = diagram_kind(definition)
        counts[kind] = counts.get(kind, 0) + 1
        filename = f"{args.prefix}-{kind}-{counts[kind]}.{args.format}"
        output = out_dir / filename
        render(
            definition,
            output,
            fmt=args.format,
            background=args.bg,
            font_size=args.font_size,
            font_color=args.font_color,
        )
        print(output)
        rel = os.path.relpath(output, markdown_path.parent).replace(os.sep, "/")
        replacements.append((definition, rel))

    if args.replace:
        cursor = 0

        def swap(match: re.Match[str]) -> str:
            nonlocal cursor
            definition, rel = replacements[cursor]
            cursor += 1
            return f"<!-- mermaid\n{definition}\n-->\n\n![{diagram_kind(definition)} diagram]({rel})"

        markdown_path.write_text(FENCE_RE.sub(swap, markdown))
        print(markdown_path)


def convert_single(args: argparse.Namespace) -> None:
    if args.input == "-" or (not args.input and not sys.stdin.isatty()):
        definition = sys.stdin.read()
    elif args.input:
        definition = Path(args.input).expanduser().read_text()
    else:
        raise SystemExit("Provide a markdown file, --input, or stdin.")

    definition = definition.strip()
    if not definition:
        raise SystemExit("Mermaid input is empty")

    output = Path(args.output).expanduser() if args.output else Path(f"diagram.{args.format}")
    render(
        definition,
        output,
        fmt=args.format,
        background=args.bg,
        font_size=args.font_size,
        font_color=args.font_color,
    )
    print(output)


def main() -> None:
    args = parse_args()
    if args.markdown:
        convert_markdown(args)
    else:
        convert_single(args)


if __name__ == "__main__":
    main()
