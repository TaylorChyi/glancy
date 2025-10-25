/**
 * 背景：
 *  - Jest 在大规模测试集下会占用接近默认 4GB 的 Node 老生代内存，CI 中多次出现 OOM 终止。
 * 目的：
 *  - 通过集中式启动脚本注入统一 Node 运行参数，为 Jest 提供更大的老生代空间并保留 vm modules 能力。
 * 关键决策与取舍：
 *  - 采用 Node 原生命令行参数组合，避免依赖额外库；
 *  - 将参数整合在脚本内而非 package.json，便于后续扩展（如基于环境的自适应内存策略）。
 * 影响范围：
 *  - 所有经由 npm scripts 执行的 Jest 单测命令。
 * 演进与TODO：
 *  - 可根据 CI 观察结果进一步引入自适应内存或分片执行策略。
 */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import process from "node:process";

const REQUIRED_NODE_OPTIONS = [
  "--experimental-vm-modules",
  "--max-old-space-size=6144",
];
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const jestBin = path.resolve(__dirname, "../node_modules/jest/bin/jest.js");

/**
 * 意图：合并外部传入的 NODE_OPTIONS 与脚本强制要求的参数，确保无重复且顺序稳定。
 * 输入：环境变量 NODE_OPTIONS（字符串或 undefined）。
 * 输出：最终的 Node CLI 参数数组（字符串数组）。
 * 流程：
 *  1) 解析现有 NODE_OPTIONS，拆分为独立参数；
 *  2) 建立有序去重集合，优先保留脚本定义的参数；
 *  3) 将结果转为数组交由 spawn 直接作为 node 的 CLI 参数。
 * 错误处理：若 jest 可执行文件缺失则抛出异常提示依赖安装问题。
 * 复杂度：O(n) 解析与去重，n 为参数数量，影响可忽略。
 */
function buildNodeArgs() {
  const existingOptions = process.env.NODE_OPTIONS
    ? process.env.NODE_OPTIONS.split(/\s+/u).filter(Boolean)
    : [];

  const orderedOptions = new Map();

  for (const option of existingOptions) {
    orderedOptions.set(option, option);
  }

  for (const option of REQUIRED_NODE_OPTIONS) {
    orderedOptions.set(option, option);
  }

  return Array.from(orderedOptions.values());
}

/**
 * 意图：以统一参数集启动 Jest 并透传调用方参数。
 * 输入：CLI 形参（继承自 npm 脚本传入的附加参数）。
 * 输出：进程退出码与标准输出透传至父进程。
 * 流程：
 *  1) 准备 Node 参数并附加 Jest 可执行路径；
 *  2) 拼接调用方参数后通过 spawn 启动子进程；
 *  3) 监听退出事件并以相同状态码结束当前进程。
 * 错误处理：
 *  - 当 Jest 可执行文件缺失时立即终止并给出语义化错误。
 * 复杂度：常数级，仅承担进程管理职责。
 */
function run() {
  if (!jestBin) {
    throw new Error("[run-jest] 未找到 Jest 可执行文件，请确认依赖已安装。");
  }

  const nodeArgs = [...buildNodeArgs(), jestBin, ...process.argv.slice(2)];
  const child = spawn(process.execPath, nodeArgs, {
    stdio: "inherit",
    env: process.env,
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });
}

run();
