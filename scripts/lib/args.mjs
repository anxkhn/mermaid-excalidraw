const FLAGS_WITH_VALUE = new Set([
  "--input",
  "-i",
  "--output",
  "-o",
  "--format",
  "-f",
  "--background",
  "-b",
  "--font-size",
  "--font-color",
  "--scale",
  "--padding",
  "--markdown",
  "--out-dir",
  "--prefix",
]);

export function parseArgs(argv) {
  const options = {
    input: null,
    output: null,
    format: null,
    background: "white",
    fontSize: 20,
    fontColor: null,
    scale: 2,
    padding: 16,
    markdown: null,
    outDir: null,
    prefix: "diagram",
    replace: false,
    keepSource: true,
    help: false,
  };
  const rest = [];

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--help" || token === "-h") {
      options.help = true;
      continue;
    }
    if (token === "--replace") {
      options.replace = true;
      continue;
    }
    if (token === "--no-keep-source") {
      options.keepSource = false;
      continue;
    }
    if (FLAGS_WITH_VALUE.has(token)) {
      const value = argv[index + 1];
      if (value === undefined) {
        throw new Error(`Missing value for ${token}`);
      }
      index += 1;
      switch (token) {
        case "--input":
        case "-i":
          options.input = value;
          break;
        case "--output":
        case "-o":
          options.output = value;
          break;
        case "--format":
        case "-f":
          options.format = value;
          break;
        case "--background":
        case "-b":
          options.background = value;
          break;
        case "--font-size":
          options.fontSize = Number(value);
          break;
        case "--font-color":
          options.fontColor = value;
          break;
        case "--scale":
          options.scale = Number(value);
          break;
        case "--padding":
          options.padding = Number(value);
          break;
        case "--markdown":
          options.markdown = value;
          break;
        case "--out-dir":
          options.outDir = value;
          break;
        case "--prefix":
          options.prefix = value;
          break;
        default:
          break;
      }
      continue;
    }
    if (token.startsWith("-")) {
      throw new Error(`Unknown option: ${token}`);
    }
    rest.push(token);
  }

  if (!options.input && rest.length > 0) {
    options.input = rest.shift();
  }
  if (!options.output && rest.length > 0) {
    options.output = rest.shift();
  }

  return options;
}

export const HELP = `Convert Mermaid diagrams to Excalidraw-style images.

Usage:
  mermaid-excalidraw [options] [input] [output]
  mermaid-excalidraw --markdown blog.md --out-dir images --replace

Options:
  -i, --input <file>        Mermaid source file, or - for stdin
  -o, --output <file>       Output .png, .svg, or .excalidraw
  -f, --format <fmt>        png | svg | excalidraw
  -b, --background <color>  transparent | white | #hex   (default: white)
      --font-size <n>       Label size in px             (default: 20)
      --font-color <color>  Text color, for example #1e1e1e
      --scale <n>           PNG scale factor             (default: 2)
      --padding <n>         Export padding               (default: 16)
      --markdown <file>     Convert every mermaid fence in a markdown file
      --out-dir <dir>       Image directory for --markdown
      --prefix <name>       Filename prefix              (default: diagram)
      --replace             Rewrite mermaid fences to image references
      --no-keep-source      Do not keep mermaid source in an HTML comment
  -h, --help                Show this help
`;
