/**
 * 背景：
 *  - 历史上 send/voice 等图标需要根据主题映射反相色，零散分布的主题判断造成难以维护。
 * 目的：
 *  - 提供统一的图标色调控制器，基于策略映射返回 default/inverse 语义，
 *    使调用方可以通过语义类或 CSS 变量注入正确的 currentColor。
 * 关键决策与取舍：
 *  - 采用策略模式管理 tone 解析，避免在组件中硬编码多组 if/else；
 *  - 仅暴露语义结果（tone/isInverse/colorToken），让调用方自由组合样式实现，
 *    并保留 auto 策略以便未来按主题自动推断。
 * 影响范围：
 *  - 依赖 send-button 与 voice-button 的按钮类组件，通过控制器统一获得反相颜色语义。
 * 演进与TODO：
 *  - 后续可在 STRATEGY_TABLE 中扩展高对比或品牌色调策略，或引入特性开关控制 tone。
 */
import { useMemo } from "react";

import { useTheme } from "@core/context";

const ICON_TONE_VARIANTS = Object.freeze({
  default: Object.freeze({
    tone: "default",
    colorToken: "var(--color-text)",
    isInverse: false,
  }),
  inverse: Object.freeze({
    tone: "inverse",
    colorToken: "var(--color-text-inverse, var(--neutral-0))",
    isInverse: true,
  }),
});

const STRATEGY_TABLE = Object.freeze({
  default: () => ICON_TONE_VARIANTS.default,
  inverse: () => ICON_TONE_VARIANTS.inverse,
  auto: (resolvedTheme) =>
    resolvedTheme === "light"
      ? ICON_TONE_VARIANTS.inverse
      : ICON_TONE_VARIANTS.default,
});

const FALLBACK_STRATEGY = STRATEGY_TABLE.default;

export const resolveIconTone = ({ requestedTone, resolvedTheme }) => {
  const strategy = STRATEGY_TABLE[requestedTone] ?? FALLBACK_STRATEGY;
  const variant = strategy(resolvedTheme);

  return {
    tone: variant.tone,
    isInverse: variant.isInverse,
    colorToken: variant.colorToken,
  };
};

export default function useIconToneController({ tone = "auto" } = {}) {
  const { resolvedTheme } = useTheme();

  return useMemo(
    () => resolveIconTone({ requestedTone: tone, resolvedTheme }),
    [tone, resolvedTheme],
  );
}
