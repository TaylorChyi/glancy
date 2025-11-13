const LENGTH_UNIT_TO_PX = Object.freeze({
  px: 1,
  in: 96,
  cm: 96 / 2.54,
  mm: 96 / 25.4,
  pt: 96 / 72,
  pc: 16,
  q: 96 / (2.54 * 40),
});

const composeParsers =
  (...parsers) =>
  (input) => {
    for (const parser of parsers) {
      const result = parser(input);
      if (result) {
        return result;
      }
    }
    return null;
  };

const convertLengthToPixels = (value, unitToken) => {
  const normalizedUnit = unitToken ? unitToken.toLowerCase() : "";
  if (!normalizedUnit || normalizedUnit === "px") {
    return value;
  }
  const factor = LENGTH_UNIT_TO_PX[normalizedUnit];
  if (typeof factor !== "number") {
    return null;
  }
  return value * factor;
};

const parseNumericDimension = (value) => {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const match = trimmed.match(
    /^(-?(?:\d+(?:\.\d+)?|\.\d+))(?:\s*([a-zA-Z%]+))?/u,
  );
  if (!match) {
    return null;
  }
  const numeric = Number.parseFloat(match[1]);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return null;
  }
  const converted = convertLengthToPixels(numeric, match[2] ?? "");
  return converted == null ? null : converted;
};

const parseSvgDocument = (svgContent) => {
  if (typeof svgContent !== "string" || svgContent.trim() === "") {
    return null;
  }
  const parser = new DOMParser();
  const documentResult = parser.parseFromString(svgContent, "image/svg+xml");
  const svgElement = documentResult.documentElement;
  if (!svgElement || svgElement.tagName.toLowerCase() !== "svg") {
    return null;
  }
  return svgElement;
};

const parseViewBoxTokens = (viewBox) =>
  viewBox
    .replaceAll(",", " ")
    .split(/\s+/u)
    .map((token) => token.trim())
    .filter(Boolean);

const attributeDimensionParser = (element) => {
  const width = parseNumericDimension(element.getAttribute("width"));
  const height = parseNumericDimension(element.getAttribute("height"));
  if (width && height) {
    return { width, height };
  }
  return null;
};

const viewBoxDimensionParser = (element) => {
  const viewBox = element.getAttribute("viewBox");
  if (typeof viewBox !== "string" || viewBox.trim() === "") {
    return null;
  }
  const tokens = parseViewBoxTokens(viewBox);
  if (tokens.length !== 4) {
    return null;
  }
  const viewBoxWidth = Number.parseFloat(tokens[2]);
  const viewBoxHeight = Number.parseFloat(tokens[3]);
  if (
    Number.isFinite(viewBoxWidth) &&
    Number.isFinite(viewBoxHeight) &&
    viewBoxWidth > 0 &&
    viewBoxHeight > 0
  ) {
    return { width: viewBoxWidth, height: viewBoxHeight };
  }
  return null;
};

const resolveSvgIntrinsicSize = composeParsers(
  attributeDimensionParser,
  viewBoxDimensionParser,
);

export function extractSvgIntrinsicSize(svgContent) {
  const svgElement = parseSvgDocument(svgContent);
  if (!svgElement) {
    return null;
  }
  return resolveSvgIntrinsicSize(svgElement);
}

export default {
  extractSvgIntrinsicSize,
};
