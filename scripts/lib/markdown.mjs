const FENCE_RE = /```mermaid[^\n]*\n([\s\S]*?)```/g;

export function extractMermaidBlocks(markdown) {
  const blocks = [];
  for (const match of markdown.matchAll(FENCE_RE)) {
    blocks.push({
      source: match[0],
      definition: match[1].trim(),
      index: match.index,
    });
  }
  return blocks;
}

export function diagramKind(definition) {
  const first = definition
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith("%%") && !line.startsWith("---"));
  if (!first) {
    return "diagram";
  }
  const token = first.split(/\s+/)[0].toLowerCase();
  if (token.startsWith("sequencediagram")) return "sequence";
  if (token.startsWith("statediagram")) return "state";
  if (token.startsWith("classdiagram")) return "class";
  if (token.startsWith("erdiagram")) return "er";
  if (token.startsWith("gantt")) return "gantt";
  if (token.startsWith("pie")) return "pie";
  if (token.startsWith("gitgraph")) return "git";
  if (token.startsWith("flowchart") || token.startsWith("graph")) {
    return "flowchart";
  }
  return token.replace(/[^a-z0-9]+/g, "-") || "diagram";
}

export function replaceMermaidBlocks(markdown, replacements, { keepSource }) {
  let cursor = 0;
  return markdown.replace(FENCE_RE, (full) => {
    const replacement = replacements[cursor];
    cursor += 1;
    if (!replacement) {
      return full;
    }
    const image = `![${replacement.alt}](${replacement.src})`;
    if (!keepSource) {
      return image;
    }
    return `<!-- mermaid\n${replacement.definition}\n-->\n\n${image}`;
  });
}
