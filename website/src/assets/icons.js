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
// 镜像 default 导入，确保运行时能获取可内联的 SVG 文本。
const rawModules = glob("./**/*.svg", {
  eager: true,
  as: "raw",
});

const NORMALISED_SEPARATOR = "/";

const normaliseResourcePath = (resourcePath) =>
  resourcePath.replace(/\\/g, NORMALISED_SEPARATOR);

const extractIconDescriptor = (resourcePath) => {
  if (!resourcePath) {
    return null;
  }

  const normalisedPath = normaliseResourcePath(resourcePath);
  const filename = normalisedPath.split(NORMALISED_SEPARATOR).pop();

  if (!filename) {
    return null;
  }

  const baseName = filename.replace(/\.svg$/i, "");

  if (baseName.endsWith("-light")) {
    return { name: baseName.slice(0, -6), variant: "light" };
  }

  if (baseName.endsWith("-dark")) {
    return { name: baseName.slice(0, -5), variant: "dark" };
  }

  return { name: baseName, variant: "single" };
};

export const buildDynamicRegistry = (moduleEntries, rawEntries) => {
  const collected = {};

  const paths = new Set([
    ...Object.keys(moduleEntries || {}),
    ...Object.keys(rawEntries || {}),
  ]);

  for (const path of paths) {
    const mod = moduleEntries?.[path];
    const raw = rawEntries?.[path];
    const descriptor = extractIconDescriptor(path);

    if (!descriptor) {
      continue;
    }

    const { name, variant } = descriptor;
    const variants = collected[name] || {};

    // 通过适配器模式统一 URL 与文本形态，便于 UI 层按需渲染。
    const payload = { src: mod, content: raw };

    if (variant === "single") {
      variants.single = payload;
    } else {
      variants[variant] = payload;
    }

    collected[name] = variants;
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

const dynamicRegistry = buildDynamicRegistry(modules, rawModules);
const hasDynamicEntries = Object.keys(dynamicRegistry).length > 0;

const combinedRegistry = mergeVariantMaps(
  staticManifest,
  hasDynamicEntries ? dynamicRegistry : null,
);

const frozenIcons = Object.fromEntries(
  Object.entries(combinedRegistry).map(([name, variants]) => [
    name,
    Object.freeze(
      Object.fromEntries(
        Object.entries(variants).map(([variantKey, payload]) => [
          variantKey,
          Object.freeze({ ...(payload || {}) }),
        ]),
      ),
    ),
  ]),
);

export default Object.freeze(frozenIcons);
