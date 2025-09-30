/**
 * 背景：
 *  - 图标资源存在 light/dark 两份，导致打包体积翻倍且难以统一风格。
 * 目的：
 *  - 将双份 SVG 归并为使用 `currentColor` 的单份文件，配合主题变量动态着色。
 * 关键决策与取舍：
 *  - 采用策略模式封装“读取 → 优化 → 写入 → 清理”流程，确保后续可替换不同处理策略；
 *  - 默认优先使用 light 版本，如缺失则回退 dark，兼顾历史资源的兼容性。
 * 影响范围：
 *  - src/assets/icons 下的所有 `*-light.svg` 与 `*-dark.svg` 文件；生成 `*.svg` 单源文件。
 * 演进与TODO：
 *  - 后续可扩展对多尺寸或多色版的支持，通过新增策略实现差异化处理。
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { optimize } from "svgo";
import svgoConfig from "./svgo.config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ICON_DIR = path.resolve(__dirname, "../src/assets/icons");

const LOG_PREFIX = "[mono-svg]";

const safeReadFile = async (filePath) => {
  try {
    const data = await fs.readFile(filePath, "utf8");
    return data;
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
};

const safeUnlink = async (filePath) => {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (!error || error.code !== "ENOENT") {
      throw error;
    }
  }
};

const createOptimiseStrategy = (config) => ({
  async optimise(content, sourcePath) {
    const { data } = optimize(content, { path: sourcePath, ...config });
    return data;
  },
});

const svgOptimiser = createOptimiseStrategy(svgoConfig);

/**
 * 意图：将指定基名的 light/dark 图标归并为单个 currentColor SVG。
 * 输入：basename —— 不含后缀的图标名；
 * 输出：是否写入了新的单源 SVG。
 * 流程：
 *  1) 依次读取 light、dark 文件；
 *  2) 若存在任一版本，则执行 SVGO 优化并写入 `${basename}.svg`；
 *  3) 删除旧的 light/dark 资源，避免重复打包。
 * 错误处理：将文件 I/O 异常向上抛出，由 CLI 捕获并终止；
 * 复杂度：O(n) 文件操作，其中 n 为处理文件数，SVGO 优化成本取决于 SVG 复杂度。
 */
async function unifyIcon(basename) {
  const lightPath = path.join(ICON_DIR, `${basename}-light.svg`);
  const darkPath = path.join(ICON_DIR, `${basename}-dark.svg`);
  const targetPath = path.join(ICON_DIR, `${basename}.svg`);

  const lightContent = await safeReadFile(lightPath);
  const darkContent = await safeReadFile(darkPath);

  const sourceContent = lightContent ?? darkContent;
  const sourcePath = lightContent ? lightPath : darkPath;

  if (!sourceContent || !sourcePath) {
    return false;
  }

  const optimised = await svgOptimiser.optimise(sourceContent, sourcePath);
  await fs.writeFile(targetPath, `${optimised}\n`, "utf8");
  await Promise.all([safeUnlink(lightPath), safeUnlink(darkPath)]);
  return true;
}

const collectBasenames = async () => {
  const entries = await fs.readdir(ICON_DIR);
  const basenames = new Set();

  for (const entry of entries) {
    const match = entry.match(/^(.*)-(light|dark)\.svg$/i);
    if (match) {
      basenames.add(match[1]);
    }
  }

  return Array.from(basenames).sort();
};

async function run() {
  try {
    await fs.access(ICON_DIR);
  } catch (error) {
    if (error && error.code === "ENOENT") {
      console.warn(`${LOG_PREFIX} icon directory missing, skip.`);
      return;
    }
    throw error;
  }

  const basenames = await collectBasenames();
  let converted = 0;

  for (const basename of basenames) {
    // 每个图标使用策略统一处理，便于未来扩展更多规则。
    const didConvert = await unifyIcon(basename);
    if (didConvert) {
      converted += 1;
    }
  }

  console.log(
    `${LOG_PREFIX} converted ${converted} icons to single-source currentColor`,
  );
}

run().catch((error) => {
  console.error(`${LOG_PREFIX} failed:`, error);
  process.exitCode = 1;
});
