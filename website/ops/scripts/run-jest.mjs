/**
 * 背景：
 *  - 单测总量持续增长，Jest 在 Node 默认 4GB old space 下容易在串行执行末尾触发 OOM，
 *    导致 CI 频繁失败且难以快速定位具体泄漏点。
 * 目的：
 *  - 在不改动业务测试代码的前提下，为 Jest 启动进程注入统一的 Node 运行参数，
 *    提升可用堆上限并兼容现有 ESM 配置，实现稳定的测试执行环境。
 * 关键决策与取舍：
 *  - 选用脚本统一封装 NODE_OPTIONS，避免在多个 npm script 中重复硬编码，便于后续扩展；
 *  - 通过去重合并继承的 NODE_OPTIONS，既保留调用方自定义参数，又保证核心标志始终生效；
 *  - 替代方案：直接在 package.json 内追加 --max-old-space-size，但难以处理调用时追加的 NODE_OPTIONS，放弃。
 * 影响范围：
 *  - 所有通过 npm/pnpm test 触发的单测流程将经由该脚本启动；
 *  - 依赖 NODE_OPTIONS 进行自定义调试的场景依旧受支持（自动合并）。
 * 演进与TODO：
 *  - 如后续需要针对特定平台动态调整内存阈值，可在此处接入配置文件或环境变量覆盖。
 */
import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const REQUIRED_FLAGS = new Set([
  "--experimental-vm-modules",
  "--max-old-space-size=6144",
]);

const DEFAULT_CHUNK_SIZE = Number.parseInt(
  process.env.JEST_CHUNK_SIZE ?? "24",
  10,
);

const inheritNodeOptions = () => {
  const inherited =
    process.env.NODE_OPTIONS?.split(/\s+/u).filter(Boolean) ?? [];
  for (const flag of inherited) {
    REQUIRED_FLAGS.add(flag);
  }
  return Array.from(REQUIRED_FLAGS).join(" ");
};

const resolveJestBin = () => {
  const require = createRequire(import.meta.url);
  return require.resolve("jest/bin/jest");
};

const spawnJest = (args, { collectStdout = false } = {}) =>
  new Promise((resolve) => {
    const stdio = collectStdout ? ["inherit", "pipe", "inherit"] : "inherit";
    const child = spawn(process.execPath, [resolveJestBin(), ...args], {
      stdio,
      env: { ...process.env, NODE_OPTIONS: inheritNodeOptions() },
    });

    if (collectStdout) {
      child.stdout.setEncoding("utf8");
    }

    let stdout = "";
    if (collectStdout && child.stdout) {
      child.stdout.on("data", (chunk) => {
        stdout += chunk;
      });
    }

    child.on("close", (code, signal) => {
      if (signal) {
        process.kill(process.pid, signal);
        return;
      }
      resolve({ code: code ?? 1, stdout });
    });

    child.on("error", (error) => {
      console.error("[run-jest] failed to spawn jest", error);
      resolve({ code: 1, stdout: "" });
    });
  });

const normalizeArgs = (rawArgs) => {
  const argsBeforeSeparator = [];
  const argsAfterSeparator = [];
  let seenSeparator = false;
  for (const arg of rawArgs) {
    if (arg === "--") {
      seenSeparator = true;
      continue;
    }
    if (seenSeparator) {
      argsAfterSeparator.push(arg);
    } else {
      argsBeforeSeparator.push(arg);
    }
  }

  return { argsBeforeSeparator, argsAfterSeparator, seenSeparator };
};

const shouldChunkExecution = (argsBeforeSeparator) => {
  const hasRunInBand = argsBeforeSeparator.includes("--runInBand");
  if (!hasRunInBand) return false;
  const watchFlags = new Set(["--watch", "--watchAll"]);
  for (const arg of argsBeforeSeparator) {
    if (watchFlags.has(arg) || arg.startsWith("--watch=")) {
      return false;
    }
    if (
      arg === "--runTestsByPath" ||
      arg.startsWith("--runTestsByPath=") ||
      arg === "--findRelatedTests" ||
      arg.startsWith("--findRelatedTests=") ||
      arg === "--onlyChanged"
    ) {
      return false;
    }
  }
  return true;
};

const collectTestPaths = async (baseArgs) => {
  const listArgs = [...baseArgs, "--listTests"];
  const { code, stdout } = await spawnJest(listArgs, { collectStdout: true });
  if (code !== 0) {
    console.error("[run-jest] failed to list tests");
    process.exitCode = code;
    return [];
  }
  return stdout
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);
};

const chunkTestsAndRun = async (
  rawArgs,
  { argsBeforeSeparator, argsAfterSeparator },
) => {
  const baseArgs = argsBeforeSeparator.filter((arg) => arg !== "--runInBand");
  const testPaths = await collectTestPaths(baseArgs);
  if (testPaths.length === 0) {
    if (!process.exitCode) {
      process.exitCode = 0;
    }
    return;
  }

  const chunkSize = DEFAULT_CHUNK_SIZE > 0 ? DEFAULT_CHUNK_SIZE : 24;
  const chunks = [];
  for (let index = 0; index < testPaths.length; index += chunkSize) {
    chunks.push(testPaths.slice(index, index + chunkSize));
  }

  for (const [chunkIndex, chunk] of chunks.entries()) {
    console.info(
      `\n[run-jest] executing chunk ${chunkIndex + 1}/${chunks.length} (${chunk.length} files)`,
    );
    const chunkArgs = [
      ...baseArgs,
      "--runInBand",
      "--runTestsByPath",
      ...chunk,
      "--forceExit",
    ];
    if (argsAfterSeparator.length > 0) {
      chunkArgs.push("--", ...argsAfterSeparator);
    }
    const { code } = await spawnJest(chunkArgs);
    if (code !== 0) {
      process.exitCode = code;
      return;
    }
  }

  process.exitCode = 0;
};

const run = async () => {
  const rawArgs = process.argv.slice(2);
  const normalized = normalizeArgs(rawArgs);
  if (shouldChunkExecution(normalized.argsBeforeSeparator)) {
    await chunkTestsAndRun(rawArgs, normalized);
    return;
  }

  const { code } = await spawnJest(rawArgs);
  process.exitCode = code;
};

await run();
