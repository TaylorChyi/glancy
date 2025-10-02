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

// 说明：选用极简 SVG data-uri 构造遮罩声明，确保探测过程中不依赖外部网络资源。
const MASK_TEST_DECLARATION =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E\") center / contain no-repeat";

/**
 * 意图：统一处理 computedStyle 的多种取值形态，兼容部分浏览器返回驼峰属性的情况。
 * 说明：Safari/WebKit 会通过 webkitMaskImage 暴露属性，而 Chromium 更偏向 mask-image；此处进行多通道读取，减少误判。
 */

const computeStyleValue = (computedStyle, property, fallbackCamelKey) => {
  if (!computedStyle) {
    return "";
  }

  const hyphenatedValue = computedStyle.getPropertyValue(property);
  if (hyphenatedValue && hyphenatedValue !== "none") {
    return hyphenatedValue;
  }

  const shorthandValue = computedStyle.getPropertyValue(
    fallbackCamelKey.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`),
  );
  if (shorthandValue && shorthandValue !== "none") {
    return shorthandValue;
  }

  const camelValue = computedStyle[fallbackCamelKey];
  if (camelValue && camelValue !== "none") {
    return camelValue;
  }

  return "";
};

/**
 * 意图：通过真实 DOM 节点验证遮罩是否生效，避免仅依赖 CSS.supports 带来的误判。
 * 输入：property - 需要验证的属性名（mask 或 -webkit-mask）。
 * 输出：布尔值，true 表示计算样式中成功写入 url() 资源。
 */
const verifyMaskApplication = (property) => {
  const globalWindow = typeof window !== "undefined" ? window : globalThis;
  const doc = globalWindow?.document;

  if (!doc || !doc.createElement) {
    return false;
  }

  const host = doc.body ?? doc.head ?? null;
  if (!host) {
    return false;
  }

  const wrapper = doc.createElement("div");
  wrapper.setAttribute("data-mask-probe", property);
  wrapper.style.cssText = "position:absolute;opacity:0;pointer-events:none";

  const probe = doc.createElement("span");
  probe.style.setProperty(property, MASK_TEST_DECLARATION);

  const view = doc.defaultView ?? globalWindow;
  if (!view || typeof view.getComputedStyle !== "function") {
    return false;
  }

  wrapper.appendChild(probe);
  host.appendChild(wrapper);

  try {
    const computedStyle = view.getComputedStyle(probe);
    const propertyKey = property === "mask" ? "maskImage" : "webkitMaskImage";
    const hyphenatedKey = property === "mask" ? "mask-image" : "-webkit-mask-image";

    const value = computeStyleValue(computedStyle, hyphenatedKey, propertyKey);
    return Boolean(value && value.includes("url"));
  } catch {
    return false;
  } finally {
    wrapper.removeChild(probe);
    host.removeChild(wrapper);
  }
};

/**
 * 意图：判定当前运行环境是否支持 CSS mask 或其 WebKit 前缀变体，并确保实际应用后生效。
 * 输入：无显式参数，依赖全局 CSS 接口与 document。
 * 输出：布尔值，true 表示可安全应用遮罩样式。
 * 流程：
 *  1) 若为 SSR（无 window），直接返回 true 以避免同构差异。
 *  2) 解析全局 CSS 接口并校验 supports 函数存在。
 *  3) 依次尝试标准属性与 WebKit 前缀：先通过 CSS.supports 初筛，再创建临时节点写入遮罩并读取 computed style，只有真实渲染出 url 时才认定支持。
 * 错误处理：异常捕获限制在内部，若浏览器抛出错误或无法读取样式则视为不支持。
 * 复杂度：常数级，探测仅在初始化时执行一次。
 */
export const detectMaskSupport = () => {
  if (typeof window === "undefined") {
    return true;
  }

  const cssInterface = window.CSS ?? globalThis.CSS;
  const maskProperties = ["mask", "-webkit-mask"];

  if (!cssInterface || typeof cssInterface.supports !== "function") {
    return false;
  }

  try {
    return maskProperties.some((property) => {
      if (!cssInterface.supports(property, "url(#test)")) {
        return false;
      }

      return verifyMaskApplication(property);
    });
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
