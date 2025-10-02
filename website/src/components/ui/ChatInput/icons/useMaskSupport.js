/**
 * 背景：
 *  - SendIcon 与 VoiceIcon 均依赖 CSS mask 呈现主题化图标，但历史实现未校验浏览器能力，老旧内核会渲染空白。
 * 目的：
 *  - 抽象出统一的能力检测钩子，按照“策略模式”封装降级判断，供多处图标共享，避免在组件内重复探测逻辑。
 * 关键决策与取舍：
 *  - 采用纯函数探测 + React hook 组合：纯函数便于测试与未来在服务端/Worker 环境替换策略；hook 则缓存结果避免重复计算。
 *  - 当运行环境无法访问 window（如 SSR）时默认认为支持，以保持与客户端同构并在挂载后重新判定。
 * 影响范围：
 *  - ChatInput 图标能力判定，未来如需扩展至更多遮罩类组件，可直接复用本钩子。
 * 演进与TODO：
 *  - 可引入特性开关记录探测结果并上报埋点，辅助评估低端设备分布。
 */
import { useMemo } from "react";

/**
 * 意图：判定当前运行环境是否支持 CSS mask 或其 WebKit 前缀变体。
 * 输入：无显式参数，依赖全局 CSS 接口。
 * 输出：布尔值，true 表示可安全应用遮罩样式。
 * 流程：
 *  1) 若为 SSR（无 window），直接返回 true 以避免同构差异。
 *  2) 解析全局 CSS 接口并校验 supports 函数存在。
 *  3) 依次尝试标准属性与 WebKit 前缀，任一成功即视为支持。
 * 错误处理：异常捕获限制在内部，若浏览器抛出错误则视为不支持。
 * 复杂度：常数级，探测仅在初始化时执行一次。
 */
export const detectMaskSupport = () => {
  if (typeof window === "undefined") {
    return true;
  }

  const cssInterface = window.CSS ?? globalThis.CSS;

  if (!cssInterface || typeof cssInterface.supports !== "function") {
    return false;
  }

  try {
    return [
      cssInterface.supports("mask", "url(#test)"),
      cssInterface.supports("-webkit-mask", "url(#test)"),
    ].some(Boolean);
  } catch {
    return false;
  }
};

/**
 * 意图：以 hook 形式向组件暴露遮罩支持能力，避免在多处重复探测。
 * 输入：无。
 * 输出：布尔值，代表当前渲染环境的遮罩支持情况。
 * 流程：
 *  1) 通过 useMemo 在首个渲染周期执行 detectMaskSupport。
 *  2) 将结果缓存以跨渲染复用。
 * 错误处理：依赖 detectMaskSupport 内部处理，无额外异常分支。
 * 复杂度：常数级，仅首渲染执行一次探测。
 */
export const useMaskSupport = () => {
  return useMemo(() => detectMaskSupport(), []);
};

export default useMaskSupport;
