import { parseMermaidToExcalidraw } from "@excalidraw/mermaid-to-excalidraw";
import {
  convertToExcalidrawElements,
  exportToBlob,
  exportToSvg,
} from "@excalidraw/excalidraw";

const applyFontColor = (elements, fontColor) => {
  if (!fontColor) return elements;
  return elements.map((element) =>
    element.type === "text" ? { ...element, strokeColor: fontColor } : element,
  );
};

window.convertMermaid = async (definition, options = {}) => {
  const fontSize = options.fontSize || 20;
  const background = options.background || "#ffffff";
  const transparent = background === "transparent";
  const { elements, files } = await parseMermaidToExcalidraw(definition, {
    themeVariables: { fontSize: `${fontSize}px` },
  });
  const converted = applyFontColor(
    convertToExcalidrawElements(elements),
    options.fontColor,
  );
  const appState = {
    exportBackground: !transparent,
    viewBackgroundColor: transparent ? "transparent" : background,
  };
  if (typeof document !== "undefined" && document.fonts?.ready) {
    await document.fonts.ready;
  }
  if (options.format === "svg") {
    const svg = await exportToSvg({
      elements: converted,
      files: files ?? null,
      appState,
      exportPadding: 16,
    });
    return { svg: svg.outerHTML };
  }
  const scale = options.scale || 2;
  const blob = await exportToBlob({
    elements: converted,
    files: files ?? null,
    appState,
    exportPadding: 16,
    mimeType: "image/png",
    getDimensions: (width, height) => ({
      width: width * scale,
      height: height * scale,
      scale,
    }),
  });
  const buffer = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  for (const byte of buffer) binary += String.fromCharCode(byte);
  return { pngBase64: btoa(binary) };
};
