/**
 * 背景：
 *  - 样式文件缺乏统一的体量守卫，极易在维护过程中积累难以拆解的巨型文件。
 * 目的：
 *  - 对 CSS/SCSS 资源执行“非空且非注释”行数校验，为 CI/CD 与本地开发提供统一入口。
 * 关键决策与取舍：
 *  - 通过 Node.js 原生 FS API 实现，避免额外依赖；
 *  - 采用先采集文件、后聚合结果的策略，便于扩展多目录扫描；
 *  - 将最大行数阈值集中配置，后续若需按目录差异化可引入策略映射。
 * 影响范围：
 *  - 所有执行 `npm run lint:lines` 的流程；
 *  - CI 中新增的 lint 工作流；
 * 演进与TODO：
 *  - 后续可在此处接入更细粒度的白名单或基于注释的豁免机制。
 */
import fs from "node:fs";
import path from "node:path";

const STYLE_EXTENSIONS = new Set([".css", ".scss"]);
const MODULE_CSS_PATTERN = /\.module\.css$/i;
const COMMENT_BLOCK_PATTERN = /\/\*[\s\S]*?\*\//g;
const SINGLE_LINE_COMMENT_PREFIX = "//";
const MAX_STYLE_LINES = 200;
const SEARCH_ROOTS = ["src"];
/**
 * 意图：判断给定路径是否属于纳入校验的样式文件。
 * 输入：文件的绝对或相对路径。
 * 输出：布尔值，表示是否命中受控样式类型。
 * 流程：
 *  1) 解析扩展名并匹配白名单；
 *  2) 额外匹配 *.module.css 模式。
 * 错误处理：不抛出异常，仅基于路径判断。
 * 复杂度：O(1)。
 */
const isStyleFile = (filePath) => {
  const extension = path.extname(filePath).toLowerCase();
  return STYLE_EXTENSIONS.has(extension) || MODULE_CSS_PATTERN.test(filePath);
};

/**
 * 意图：以深度优先策略收集目录中的样式文件路径。
 * 输入：待遍历目录的绝对路径。
 * 输出：目录树中所有样式文件的相对路径集合。
 * 流程：
 *  1) 读取目录下的所有目录项；
 *  2) 遇到子目录则递归遍历；
 *  3) 遇到文件时执行样式文件判断并收集。
 * 错误处理：目录读取失败会抛出异常，由调用方统一处理。
 * 复杂度：O(N)，N 为目录树中文件数量。
 */
const collectStyleFiles = (absoluteDir) => {
  const entries = fs.readdirSync(absoluteDir, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const entryPath = path.join(absoluteDir, entry.name);
    if (entry.isDirectory()) {
      return collectStyleFiles(entryPath);
    }

    if (!isStyleFile(entryPath)) {
      return [];
    }

    return [entryPath];
  });
};

/**
 * 意图：统计单个样式文件的有效行数。
 * 输入：样式文件路径。
 * 输出：整数，代表剔除注释与空行后的行数。
 * 流程：
 *  1) 读取文件内容并剔除块注释；
 *  2) 按行拆分并去除首尾空白；
 *  3) 过滤空行与以 // 开头的单行注释；
 *  4) 返回剩余行的数量。
 * 错误处理：文件读取失败将抛出异常，由调用方处理；
 * 复杂度：O(L)，L 为文件物理行数。
 */
const countEffectiveLines = (filePath) => {
  const content = fs.readFileSync(filePath, "utf8");
  const withoutBlocks = content.replace(COMMENT_BLOCK_PATTERN, "\n");

  return withoutBlocks
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith(SINGLE_LINE_COMMENT_PREFIX)).length;
};

/**
 * 意图：作为脚本入口执行样式行数校验。
 * 输入：无（读取常量配置）。
 * 输出：进程退出码以及控制台日志。
 * 流程：
 *  1) 构建所有扫描根目录的绝对路径；
 *  2) 收集样式文件并计算行数；
 *  3) 输出超限文件并返回非零状态码。
 * 错误处理：若遍历或读取失败，抛出的异常会使进程以非零状态结束；
 * 复杂度：O(T)，T 为样式文件总数。
 */
const main = () => {
  const projectRoot = process.cwd();
  const targetFiles = SEARCH_ROOTS.flatMap((root) => {
    const absoluteRoot = path.resolve(projectRoot, root);
    if (!fs.existsSync(absoluteRoot)) {
      return [];
    }

    return collectStyleFiles(absoluteRoot);
  });

  const violations = targetFiles
    .map((filePath) => {
      const lineCount = countEffectiveLines(filePath);
      return { filePath, lineCount };
    })
    .filter(({ lineCount }) => lineCount > MAX_STYLE_LINES);

  if (violations.length > 0) {
    violations.forEach(({ filePath, lineCount }) => {
      const relativePath = path.relative(projectRoot, filePath);
      console.error(
        `[LINES] ${relativePath} 超过样式上限 ${MAX_STYLE_LINES} 行，当前 ${lineCount} 行`
      );
    });
    process.exitCode = 1;
    return;
  }

  console.log(`[LINES] 共校验 ${targetFiles.length} 个样式文件，全部符合 ${MAX_STYLE_LINES} 行阈值。`);
};

main();
