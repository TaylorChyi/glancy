import staticManifest from "./icon-manifest.generated.js";

/**
 * Icon registry generated via `import.meta.glob`.
 * Aggregates all SVG assets within the assets directory.
 */

const glob =
  typeof import.meta !== "undefined" && typeof import.meta.glob === "function"
    ? import.meta.glob
    : () => ({});

const modules = glob("./**/*.svg", {
  eager: true,
  import: "default",
});

const NORMALISED_SEPARATOR = "/";

const normaliseResourcePath = (resourcePath) =>
  resourcePath.replace(/\\/g, NORMALISED_SEPARATOR);

const extractIconName = (resourcePath) => {
  if (!resourcePath) {
    return null;
  }

  const normalisedPath = normaliseResourcePath(resourcePath);
  const filename = normalisedPath.split(NORMALISED_SEPARATOR).pop();

  if (!filename) {
    return null;
  }

  return filename.replace(/\.svg$/i, "");
};

export const buildDynamicRegistry = (moduleEntries) => {
  const collected = {};

  for (const [path, mod] of Object.entries(moduleEntries || {})) {
    const iconName = extractIconName(path);

    if (!iconName) {
      continue;
    }

    collected[iconName] = { single: mod };
  }

  return collected;
};

const mergeVariantMaps = (...sources) => {
  const merged = {};

  for (const source of sources) {
    if (!source) {
      continue;
    }

    for (const [name, variants] of Object.entries(source)) {
      merged[name] = { ...(merged[name] || {}), ...variants };
    }
  }

  return merged;
};

const dynamicRegistry = buildDynamicRegistry(modules);
const hasDynamicEntries = Object.keys(dynamicRegistry).length > 0;

const combinedRegistry = mergeVariantMaps(
  staticManifest,
  hasDynamicEntries ? dynamicRegistry : null,
);

const frozenIcons = Object.fromEntries(
  Object.entries(combinedRegistry).map(([name, variants]) => [
    name,
    Object.freeze({ ...variants }),
  ]),
);

export default Object.freeze(frozenIcons);
