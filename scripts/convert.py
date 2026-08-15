#!/usr/bin/env python3
"""Render Mermaid diagrams as sketch-style PNG or SVG images."""

from __future__ import annotations

import argparse
import base64
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
import zlib
from pathlib import Path

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
    parser.add_argument("--font-size", type=int, default=16, dest="font_size")
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


def with_style(definition: str, font_size: int, font_color: str | None) -> str:
    if definition.lstrip().startswith("---"):
        body = definition
    else:
        variables = [f"    fontSize: {font_size}px"]
        if font_color:
            variables.append(f"    primaryTextColor: '{font_color}'")
        body = (
            "---\n"
            "config:\n"
            "  look: handDrawn\n"
            "  theme: neutral\n"
            "  themeVariables:\n"
            + "\n".join(variables)
            + "\n---\n"
            + definition
        )
    return body


def encode_diagram(definition: str) -> str:
    payload = json.dumps({"code": definition, "mermaid": {"theme": "neutral"}})
    compressed = zlib.compress(payload.encode("utf-8"), 9)
    return base64.urlsafe_b64encode(compressed).decode("ascii").rstrip("=")


def bg_query(background: str) -> str:
    if background == "transparent":
        return "transparent"
    if background == "white":
        return "!white"
    if background.startswith("#"):
        return "!" + background[1:]
    return "!" + background


def render(definition: str, *, fmt: str, background: str) -> bytes:
    encoded = encode_diagram(definition)
    path = "svg" if fmt == "svg" else "img"
    query = {"bgColor": bg_query(background)}
    if fmt == "png":
        query["type"] = "png"
    url = f"https://mermaid.ink/{path}/pako:{encoded}?{urllib.parse.urlencode(query)}"
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "mermaid-excalidraw/1.0"},
    )
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            return response.read()
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", "replace")[:300]
        raise SystemExit(f"Render failed ({error.code}): {detail}") from error


def write_image(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    print(path)


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
        styled = with_style(definition, args.font_size, args.font_color)
        write_image(output, render(styled, fmt=args.format, background=args.bg))
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
    styled = with_style(definition, args.font_size, args.font_color)
    write_image(output, render(styled, fmt=args.format, background=args.bg))


def main() -> None:
    args = parse_args()
    if args.markdown:
        convert_markdown(args)
    else:
        convert_single(args)


if __name__ == "__main__":
    main()
