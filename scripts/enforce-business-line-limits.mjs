/**
 * 背景：
 *  - 前后端业务目录存在海量历史文件，缺乏统一的体量守卫，导致超长文件难以及时在评审阶段被发现。
 * 目的：
 *  - 为 CI/CD 提供统一的 250 行业务文件体量校验入口，仅关注新增或改动的源文件，避免一次性重构存量代码。
 * 关键决策与取舍：
 *  - 采用“策略模式”定义前端与后端两类校验策略，便于后续扩展其他语言或目录；
 *  - 通过 git diff 仅筛选改动文件，符合“先不改存量”的增量治理诉求；
 *  - 行数统计使用物理行，不剔除注释/空行，以便快速暴露潜在的文件拆分需求。
 * 影响范围：
 *  - 所有在 CI/CD 中调用该脚本的流程；
 *  - 本地开发者可手动执行脚本验证待提交的改动是否符合体量约束。
 * 演进与TODO：
 *  - 后续可扩展参数化忽略列表或对特定目录设定更严格阈值；
 *  - 如需引入白名单，应结合技术债清单统一治理，防止规则被滥用。
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const MAX_LINES = 250;
const DEFAULT_BASE_REF = "origin/main";
const TEST_FILE_PATTERNS = [
  /__tests__/i,
  /\.test\.[jt]sx?$/i,
  /\.spec\.[jt]sx?$/i,
  /\/tests\//i,
];

/**
 * 意图：描述一类业务目录的体量守卫策略，实现策略模式以支持多目录扩展。
 * 输入：
 *  - id：策略标识，便于日志输出；
 *  - displayName：策略名称，用于报错描述；
 *  - roots：需要受控的目录前缀集合；
 *  - extensions：纳入校验的文件扩展名集合。
 * 输出：策略描述对象。
 */
const createPolicy = ({ id, displayName, roots, extensions }) => ({
  id,
  displayName,
  roots: roots.map((root) => root.replace(/\\/g, "/")),
  extensions: new Set(extensions),
});

const BUSINESS_POLICIES = [
  createPolicy({
    id: "frontend",
    displayName: "前端业务源码",
    roots: ["website/src"],
    extensions: [".ts", ".tsx", ".js", ".jsx"],
  }),
  createPolicy({
    id: "backend",
    displayName: "后端业务源码",
    roots: ["backend/src/main/java"],
    extensions: [".java"],
  }),
];

const normalizePath = (inputPath) => inputPath.replace(/\\/g, "/");

const isTestFile = (filePath) => TEST_FILE_PATTERNS.some((pattern) => pattern.test(filePath));

const isUnderPolicy = (filePath, policy) =>
  policy.roots.some((root) => filePath.startsWith(`${root}/`)) &&
  policy.extensions.has(path.extname(filePath));

const pickMatchingPolicy = (filePath) =>
  BUSINESS_POLICIES.find((policy) => isUnderPolicy(filePath, policy));

const countPhysicalLines = (absolutePath) => {
  const content = fs.readFileSync(absolutePath, "utf8");
  return content.split(/\r?\n/).length;
};

const execGit = (args) =>
  execSync(`git ${args}`, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();

const resolveBaseRef = (explicitBase) => {
  if (explicitBase) {
    return explicitBase;
  }

  try {
    execGit(`rev-parse --verify ${DEFAULT_BASE_REF}`);
    return DEFAULT_BASE_REF;
  } catch (error) {
    return "HEAD^";
  }
};

const collectChangedFiles = (baseRef) => {
  const diffRange = `${baseRef}...HEAD`;
  const diffOutput = execGit(`diff --name-only --diff-filter=ACM ${diffRange}`);
  if (diffOutput.length === 0) {
    return [];
  }

  return diffOutput.split("\n").map(normalizePath).filter(Boolean);
};

const evaluate = (baseRefArg) => {
  const baseRef = resolveBaseRef(baseRefArg);
  const changedFiles = collectChangedFiles(baseRef);

  const projectRoot = process.cwd();
  const violations = changedFiles
    .filter((filePath) => !isTestFile(filePath))
    .map((filePath) => ({
      filePath,
      policy: pickMatchingPolicy(filePath),
    }))
    .filter(({ policy }) => Boolean(policy))
    .map(({ filePath, policy }) => {
      const absolutePath = path.resolve(projectRoot, filePath);
      const lineCount = countPhysicalLines(absolutePath);
      return { filePath, lineCount, policy };
    })
    .filter(({ lineCount }) => lineCount > MAX_LINES);

  if (violations.length === 0) {
    console.log(
      `[LINES] 所有改动的业务文件均未超过 ${MAX_LINES} 行 (基线 ${baseRef})。`
    );
    return true;
  }

  console.error(
    `[LINES] 检测到 ${violations.length} 个超限文件，请拆分或提炼公共逻辑后再提交：`
  );
  violations.forEach(({ filePath, lineCount, policy }) => {
    console.error(
      `  - ${filePath} (${policy.displayName}) 当前 ${lineCount} 行，超过上限 ${MAX_LINES} 行`
    );
  });
  return false;
};

const parseArgs = () => {
  const [, , ...rest] = process.argv;
  const args = {};

  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (token === "--base-ref") {
      args.baseRef = rest[index + 1];
      index += 1;
    }
  }

  return args;
};

const { baseRef } = parseArgs();
const success = evaluate(baseRef);
if (!success) {
  process.exitCode = 1;
}
