/**
 * 背景：
 *  - 品牌视觉更新后，等待动画素材可能按序列帧或单帧交付，直接在组件层写死路径既不稳健也不利于演进。
 * 目的：
 *  - 提供一个集中式资产注册模块，自动收集可用序列帧并在缺失时回落到默认帧，保持 Loader 行为稳定。
 * 关键决策与取舍：
 *  - 采用函数式构建器 `buildFrameSequence`，确保可测试且易于拓展更多命名约定；放弃硬编码文件列表的方案以避免重复发布。
 * 影响范围：
 *  - Loader 组件与未来的动画策略依赖该模块提供的帧序列；若后续引入不同主题素材，可在此扩展筛选逻辑。
 * 演进与TODO：
 *  - TODO：支持按主题/配色方案切换不同的帧集合，并允许通过远程配置注入序列。
 */
import fallbackWaitingFrame from "@/assets/waiting-frame.svg";

const glob =
  typeof import.meta !== "undefined" && typeof import.meta.glob === "function"
    ? import.meta.glob
    : () => ({
        // 说明：Jest 等非 Vite 环境缺乏 import.meta 实现，这里返回空对象确保纯函数构建逻辑继续运行。
      });

const WAITING_FRAME_MODULES = glob("@/assets/waiting-frame-*.svg", {
  eager: true,
  import: "default",
});

const WAITING_FRAME_PATTERN = /waiting-frame-(\d+)\.svg$/i;

function normaliseModuleValue(moduleExport) {
  if (!moduleExport) {
    return null;
  }
  if (typeof moduleExport === "string") {
    return moduleExport;
  }
  if (typeof moduleExport === "object" && "default" in moduleExport) {
    return moduleExport.default;
  }
  return null;
}

/**
 * 意图：
 *  - 根据文件命名中的序号生成有序的等待帧列表，并在无可用帧时降级到默认素材。
 * 输入：
 *  - resourceEntries：以文件路径为键、模块导出为值的对象，可由 import.meta.glob 生成。
 *  - fallbackSrc：默认帧资源路径，保证序列非空。
 * 输出：
 *  - 不可变的帧 URL 数组。
 * 流程：
 *  1) 提取序号与资源地址并过滤无效项；
 *  2) 按序号排序后映射为 URL 列表；
 *  3) 若列表为空则返回包含 fallback 的数组。
 * 错误处理：
 *  - 遇到无法解析的模块或文件名将被忽略，避免打断构建；fallback 必须存在以确保非空。
 * 复杂度：
 *  - 时间 O(n log n)（排序），空间 O(n)。
 */
export function buildFrameSequence(
  resourceEntries = {},
  fallbackSrc = fallbackWaitingFrame,
) {
  const collected = Object.entries(resourceEntries)
    .map(([path, moduleExport]) => {
      const match = WAITING_FRAME_PATTERN.exec(path);
      if (!match) {
        return null;
      }
      const index = Number.parseInt(match[1], 10);
      if (!Number.isFinite(index)) {
        return null;
      }
      const src = normaliseModuleValue(moduleExport);
      if (!src) {
        return null;
      }
      return { index, src };
    })
    .filter(Boolean)
    .sort((first, second) => first.index - second.index)
    .map((entry) => entry.src);

  if (collected.length === 0) {
    return Object.freeze([fallbackSrc]);
  }

  return Object.freeze(collected);
}

const WAITING_FRAMES = buildFrameSequence(
  WAITING_FRAME_MODULES,
  fallbackWaitingFrame,
);

export const FALLBACK_WAITING_FRAME = fallbackWaitingFrame;

export default WAITING_FRAMES;
