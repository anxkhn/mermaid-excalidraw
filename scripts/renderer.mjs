import { parseMermaidToExcalidraw } from "@excalidraw/mermaid-to-excalidraw";
import {
  convertToExcalidrawElements,
  exportToBlob,
  exportToSvg,
} from "@excalidraw/excalidraw";

const applyFontColor = (elements, fontColor) => {
  if (!fontColor) {
    return elements;
  }

  return elements.map((element) => {
    if (element.type === "text") {
      return { ...element, strokeColor: fontColor };
    }
    return element;
  });
};

const toAppState = (background) => {
  const transparent = background === "transparent";
  return {
    exportBackground: !transparent,
    viewBackgroundColor: transparent ? "transparent" : background,
  };
};

window.convertMermaid = async (definition, options = {}) => {
  const fontSize = options.fontSize || 20;
  const background = options.background || "#ffffff";
  const { elements, files } = await parseMermaidToExcalidraw(definition, {
    themeVariables: { fontSize: `${fontSize}px` },
  });
  const converted = applyFontColor(
    convertToExcalidrawElements(elements),
    options.fontColor,
  );
  const appState = toAppState(background);
  const exportPadding = options.padding ?? 16;

  if (options.format === "excalidraw") {
    return {
      scene: {
        type: "excalidraw",
        version: 2,
        source: "https://github.com/anxkhn/mermaid-excalidraw",
        elements: converted,
        files: files ?? {},
        appState: {
          viewBackgroundColor: appState.viewBackgroundColor,
          gridSize: null,
        },
      },
      elementCount: converted.length,
    };
  }

  if (typeof document !== "undefined" && document.fonts?.ready) {
    await document.fonts.ready;
  }

  if (options.format === "svg") {
    const svg = await exportToSvg({
      elements: converted,
      files: files ?? null,
      appState,
      exportPadding,
    });
    return { svg: svg.outerHTML, elementCount: converted.length };
  }

  const scale = options.scale || 2;
  const blob = await exportToBlob({
    elements: converted,
    files: files ?? null,
    appState,
    exportPadding,
    mimeType: "image/png",
    getDimensions: (width, height) => ({
      width: width * scale,
      height: height * scale,
      scale,
    }),
  });
  const buffer = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  for (const byte of buffer) {
    binary += String.fromCharCode(byte);
  }
  return {
    pngBase64: btoa(binary),
    elementCount: converted.length,
  };
};
