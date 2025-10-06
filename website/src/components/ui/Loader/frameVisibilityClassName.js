/**
 * 背景：
 *  - Loader 动画需根据 Hook 输出的布尔态切换透明度类名，直接在组件中拼接字符串可读性差且难于测试。
 * 目的：
 *  - 提供纯函数封装类名组合逻辑，便于复用与单元测试，同时与样式模块保持松耦合。
 * 关键决策与取舍：
 *  - 函数接受基础类名与可见态类名作为参数，确保未来若有更多状态（例如半透明）时可扩展；
 *  - 默认返回基础类名，只有在显式要求展示时才追加可见态类，保持输出稳定。
 * 影响范围：
 *  - Loader 组件调用该函数组合类名；其他需要类似“可见/隐藏”拼接的组件亦可复用。
 * 演进与TODO：
 *  - TODO：若后续引入 `prefers-reduced-motion` 特性开关，可在此函数加入根据配置切换的额外类名。
 */
export default function frameVisibilityClassName(
  baseClassName,
  visibleClassName,
  isRevealed,
) {
  if (!visibleClassName) {
    return baseClassName;
  }
  return isRevealed ? `${baseClassName} ${visibleClassName}` : baseClassName;
}
