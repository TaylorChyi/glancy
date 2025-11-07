import { APPLE_PLATFORM_PATTERN } from "./constants.js";

/**
 * 意图：判定当前 navigator 是否属于苹果生态，用于修饰键文案选择。
 * 输入：navigatorLike —— 浏览器的 navigator 或测试桩，允许缺省以适配 SSR。\
 * 输出：布尔值，标识是否匹配苹果生态。
 * 流程：
 *  1) 若无 navigator 则直接返回 false；
 *  2) 读取 userAgentData.platform 或 navigator.platform；
 *  3) 使用预定义正则进行匹配。
 * 错误处理：无显式异常，未匹配视为非苹果平台。
 * 复杂度：O(1)。
 */
export function isApplePlatform({ navigatorLike } = {}) {
  const fallbackNavigator =
    typeof navigator === "undefined" ? undefined : navigator;
  const runtimeNavigator = navigatorLike ?? fallbackNavigator;
  if (!runtimeNavigator) {
    return false;
  }
  const platform =
    runtimeNavigator.userAgentData?.platform || runtimeNavigator.platform || "";
  return APPLE_PLATFORM_PATTERN.test(platform);
}
