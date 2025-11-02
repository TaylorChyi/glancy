/**
 * 背景：
 *  - 平台判定逻辑原先内嵌在工具文件中，导致测试难以注入不同的 navigator 实例。
 * 目的：
 *  - 将平台检测封装为可注入的纯函数，支持未来扩展更多平台分支。
 * 关键决策与取舍：
 *  - 以依赖注入的方式接受 navigatorLike，兼顾浏览器全局与测试桩；
 *  - 将正则常量留在 constants 模块中统一管理，遵循外观模式的分层结构。
 * 影响范围：
 *  - 快捷键格式化时的修饰键文案展示、平台特定逻辑判断。
 * 演进与TODO：
 *  - 后续若需要支持 Linux 专属标签，可在此扩展判定并暴露更丰富的上下文信息。
 */

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
