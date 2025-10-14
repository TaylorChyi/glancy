import staticManifest from "./icon-manifest.generated.js";

/**
 * Icon registry generated via `import.meta.glob`.
 * Aggregates all SVG assets within the assets directory.
 */

const glob =
  typeof import.meta !== "undefined" && typeof import.meta.glob === "function"
    ? import.meta.glob
    : () => ({});

const urlModules = glob("./**/*.svg", {
  eager: true,
  import: "default",
});

const inlineModules =
  typeof glob === "function"
    ? glob("./**/*.svg", {
        eager: true,
        as: "raw",
      })
    : {};

const NORMALISED_SEPARATOR = "/";

const normaliseResourcePath = (resourcePath) =>
  resourcePath.replace(/\\/g, NORMALISED_SEPARATOR);

const VARIANT_SUFFIXES = Object.freeze({
  light: "-light",
  dark: "-dark",
});

const inferVariantFromBasename = (basename) => {
  if (!basename) {
    return null;
  }

  for (const [variant, suffix] of Object.entries(VARIANT_SUFFIXES)) {
    if (basename.endsWith(suffix)) {
      return { name: basename.slice(0, -suffix.length), variant };
    }
  }

  return { name: basename, variant: "single" };
};

const extractIconDescriptor = (resourcePath) => {
  if (!resourcePath) {
    return null;
  }

  const normalisedPath = normaliseResourcePath(resourcePath);
  const filename = normalisedPath.split(NORMALISED_SEPARATOR).pop();

  if (!filename) {
    return null;
  }

  const basename = filename.replace(/\.svg$/i, "");
  return inferVariantFromBasename(basename);
};

const composeVariantEntry = (urlEntry, inlineEntry) => {
  const hasUrl = typeof urlEntry === "string" && urlEntry.length > 0;
  const hasInline = typeof inlineEntry === "string" && inlineEntry.length > 0;

  if (!hasUrl && !hasInline) {
    return null;
  }

  return Object.freeze({
    url: hasUrl ? urlEntry : null,
    inline: hasInline ? inlineEntry : null,
  });
};

export const buildDynamicRegistry = (urlEntries = {}, inlineEntries = {}) => {
  const collected = {};

  const allPaths = new Set([
    ...Object.keys(urlEntries || {}),
    ...Object.keys(inlineEntries || {}),
  ]);

  for (const path of allPaths) {
    const descriptor = extractIconDescriptor(path);

    if (!descriptor || !descriptor.name || !descriptor.variant) {
      continue;
    }

    const current = collected[descriptor.name] ?? {};
    const variantEntry = composeVariantEntry(
      urlEntries?.[path],
      inlineEntries?.[path],
    );

    if (!variantEntry) {
      continue;
    }

    current[descriptor.variant] = variantEntry;
    collected[descriptor.name] = current;
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

const dynamicRegistry = buildDynamicRegistry(urlModules, inlineModules);
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
