/**
 * Lightweight duplication guard to enforce <=3% repeated code
 * and forbid duplicate chunks of >=30 consecutive lines.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const PROJECT_ROOT = process.cwd();
const SOURCE_ROOT = path.join(PROJECT_ROOT, "src");
const WINDOW_SIZE = 30;
const MAX_DUP_RATIO = 0.03;
const INCLUDE_EXTS = new Set([".js", ".jsx", ".ts", ".tsx"]);
const EXCLUDE_SEGMENTS = new Set([
  "node_modules",
  "dist",
  "build",
  "generated",
  "gen",
  "third_party",
  "vendor",
  "__snapshots__",
  "__tests__",
]);

const shouldSkip = (absolutePath) => {
  const segments = absolutePath.split(path.sep);
  return segments.some((segment) => EXCLUDE_SEGMENTS.has(segment));
};

const listSourceFiles = async (dir) => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const absolutePath = path.join(dir, entry.name);
      if (shouldSkip(absolutePath)) {
        return [];
      }
      if (entry.isDirectory()) {
        return listSourceFiles(absolutePath);
      }
      if (entry.isFile() && INCLUDE_EXTS.has(path.extname(entry.name))) {
        return [absolutePath];
      }
      return [];
    }),
  );
  return files.flat();
};

const normaliseLines = (lines) =>
  lines.map((line) => line.trimEnd().replace(/\s+/g, " "));

const markDuplicates = (fileLength) => Array.from({ length: fileLength }, () => false);

const analyze = async () => {
  const files = await listSourceFiles(SOURCE_ROOT);
  const windowIndex = new Map();
  const fileData = [];

  await Promise.all(
    files.map(async (file, fileIndex) => {
      const content = await fs.readFile(file, "utf8");
      const lines = content.split(/\r?\n/);
      fileData[fileIndex] = {
        path: file,
        lines,
        duplicateMarks: markDuplicates(lines.length),
      };
      const normalised = normaliseLines(lines);
      for (let start = 0; start <= normalised.length - WINDOW_SIZE; start += 1) {
        const chunk = normalised.slice(start, start + WINDOW_SIZE).join("\n");
        if (!chunk.trim()) {
          continue;
        }
        const hash = createHash("sha1").update(chunk).digest("hex");
        const occurrences = windowIndex.get(hash) ?? [];
        occurrences.push({ fileIndex, start });
        windowIndex.set(hash, occurrences);
      }
    }),
  );

  let duplicateLineCount = 0;
  let totalLineCount = 0;
  const blockViolations = [];

  fileData.forEach((file) => {
    if (!file) {
      return;
    }
    totalLineCount += file.lines.length;
  });

  for (const [hash, occurrences] of windowIndex.entries()) {
    if (occurrences.length < 2) {
      continue;
    }
    blockViolations.push({ hash, samples: occurrences.slice(0, 2) });
    occurrences.forEach(({ fileIndex, start }) => {
      const file = fileData[fileIndex];
      for (let offset = 0; offset < WINDOW_SIZE; offset += 1) {
        const lineIndex = start + offset;
        if (!file.duplicateMarks[lineIndex]) {
          file.duplicateMarks[lineIndex] = true;
          duplicateLineCount += 1;
        }
      }
    });
  }

  const ratio = totalLineCount === 0 ? 0 : duplicateLineCount / totalLineCount;
  if (blockViolations.length > 0) {
    console.error(
      `[DUP] Found ${blockViolations.length} duplicate block(s) covering ${WINDOW_SIZE} consecutive lines.`,
    );
    blockViolations.slice(0, 5).forEach(({ samples }) => {
      const [{ fileIndex: aIdx, start: aStart }, { fileIndex: bIdx, start: bStart }] =
        samples;
      console.error(
        `  - ${path.relative(PROJECT_ROOT, fileData[aIdx].path)}:${aStart + 1} duplicated with ${path.relative(
          PROJECT_ROOT,
          fileData[bIdx].path,
        )}:${bStart + 1}`,
      );
    });
  }
  if (ratio > MAX_DUP_RATIO || blockViolations.length > 0) {
    console.error(
      `[DUP] Duplicate code ratio ${(ratio * 100).toFixed(2)}% exceeds limit ${(MAX_DUP_RATIO * 100).toFixed(
        2,
      )}%`,
    );
    process.exitCode = 1;
  } else {
    console.info(
      `[DUP] Duplicate code ratio ${(ratio * 100).toFixed(2)}% within limit ${(MAX_DUP_RATIO * 100).toFixed(
        2,
      )}%`,
    );
  }
};

analyze().catch((error) => {
  console.error("[DUP] Failed to run duplication guard", error);
  process.exitCode = 1;
});
