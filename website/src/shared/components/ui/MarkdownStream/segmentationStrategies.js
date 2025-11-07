import { STREAM_SEGMENTATION_PROP } from "./streamSegmentationProp.js";
import rehypeStreamWordSegments from "./rehypeStreamWordSegments.js";

function createStrategy({ id, resolvePlugins }) {
  return Object.freeze({
    id,
    resolvePlugins,
  });
}

const STRATEGIES = Object.freeze({
  none: createStrategy({
    id: "none",
    resolvePlugins: () => null,
  }),
  word: createStrategy({
    id: "word",
    resolvePlugins: ({ Renderer, defaultRenderer }) => {
      const supportsSegmentation =
        Renderer === defaultRenderer ||
        Renderer?.[STREAM_SEGMENTATION_PROP] === true;
      if (!supportsSegmentation) {
        return null;
      }
      return [rehypeStreamWordSegments];
    },
  }),
});

export function resolveSegmentationStrategy(name) {
  if (!name || typeof name !== "string") {
    return STRATEGIES.none;
  }
  return STRATEGIES[name] ?? STRATEGIES.none;
}

export const __INTERNAL__ = Object.freeze({ STRATEGIES });
