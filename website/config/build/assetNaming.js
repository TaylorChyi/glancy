import path from "node:path";

const normalisePath = (value) => value.split(path.sep).join(path.posix.sep);

export const ASSET_FILE_PATTERNS = Object.freeze({
  chunk: "assets/[name]-[hash].js",
  entry: "assets/[name]-[hash].js",
  asset: "assets/[name]-[hash][extname]",
});

export const buildAssetFileNames = () => ({
  chunkFileNames: normalisePath(ASSET_FILE_PATTERNS.chunk),
  entryFileNames: normalisePath(ASSET_FILE_PATTERNS.entry),
  assetFileNames: normalisePath(ASSET_FILE_PATTERNS.asset),
});
