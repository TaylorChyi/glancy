/**
 * 背景：
 *  - ChatInput 的图标体系逐渐扩展，SendIcon 与 VoiceIcon 等组件都需要重复处理遮罩能力探测、主题资源解析与降级渲染，易出现实现漂移。
 * 目的：
 *  - 提供可配置的模板方法骨架，将“探测 → 解析 → 构造样式 → 回退”流程抽离到统一工厂，通过策略函数注入差异化逻辑。
 * 关键决策与取舍：
 *  - 选用模板方法（Template Method）结合策略函数：模板负责控制流程顺序，resolve/build 回调负责扩展，既保持一致性又便于未来新增图标策略。
 *  - 暂不引入类继承，保持函数式工厂，符合 React 函数组件范式并降低测试开销。
 * 影响范围：
 *  - ChatInput/icons 目录下所有基于遮罩的按钮图标组件；后续如需新增图标只需注入策略即可重用流程。
 * 演进与TODO：
 *  - 若未来有非遮罩类按钮，可扩展参数以允许跳过遮罩探测或注入更多上下文（如尺寸、动画类名）。
 */
import { useMemo } from "react";
import PropTypes from "prop-types";

import ICONS from "@/assets/icons.js";
import { useTheme } from "@/context";
import useMaskSupport from "./useMaskSupport.js";

const hasMaskDeclaration = (styleObject) =>
  Boolean(
    styleObject?.mask ||
      styleObject?.WebkitMask ||
      styleObject?.maskImage ||
      styleObject?.WebkitMaskImage,
  );

/**
 * 意图：根据传入的策略创建带遮罩能力的图标组件。
 * 输入：
 *  - token：注册表中的图标标识。
 *  - resolveResource：策略函数，负责基于主题等上下文解析资源。
 *  - buildStyle：策略函数，接收解析到的资源并生成行内样式。
 *  - defaultFallback：当遮罩不可用或解析失败时使用的降级渲染函数，
 *    将收到 { className, iconName, resource, resolvedTheme }。
 * 输出：
 *  - React 组件，接受 className 与 fallback，可直接用于按钮图标渲染。
 * 流程：
 *  1) 通过 useMaskSupport 判定能力。
 *  2) 使用 resolveResource 按策略获取资源。
 *  3) 交给 buildStyle 生成遮罩样式。
 *  4) 若任一步骤失败则回退到 fallback，并尽可能传递解析到的资源，
 *     以便 fallback 复用相同素材。
 * 错误处理：
 *  - resolveResource / buildStyle 内部由调用方负责兜底，组件仅在返回 null 或缺失遮罩声明时触发 fallback。
 * 复杂度：
 *  - 常数级，所有重计算均通过 useMemo 缓存在依赖变更时触发。
 */
export function createMaskedIconRenderer({
  token,
  resolveResource,
  buildStyle,
  defaultFallback,
}) {
  if (!token) {
    throw new Error("createMaskedIconRenderer: token is required");
  }
  if (typeof resolveResource !== "function") {
    throw new Error(
      "createMaskedIconRenderer: resolveResource must be a function",
    );
  }
  if (typeof buildStyle !== "function") {
    throw new Error("createMaskedIconRenderer: buildStyle must be a function");
  }
  if (typeof defaultFallback !== "function") {
    throw new Error(
      "createMaskedIconRenderer: defaultFallback must be a function",
    );
  }

  const MaskedIcon = ({ className, fallback }) => {
    const themeContext = useTheme?.() ?? {};
    const resolvedTheme = themeContext?.resolvedTheme ?? "light";
    const isMaskSupported = useMaskSupport();
    const effectiveFallback = fallback ?? defaultFallback;

    const resolvedResource = useMemo(
      () =>
        resolveResource({
          registry: ICONS,
          resolvedTheme,
        }) ?? null,
      [resolvedTheme],
    );

    const inlineStyle = useMemo(() => {
      if (!isMaskSupported || !resolvedResource) {
        return null;
      }

      return buildStyle({
        resource: resolvedResource,
        resolvedTheme,
      });
    }, [isMaskSupported, resolvedResource, resolvedTheme]);

    if (!hasMaskDeclaration(inlineStyle)) {
      return effectiveFallback({
        className,
        iconName: token,
        resource: resolvedResource,
        resolvedTheme,
      });
    }

    return (
      <span
        aria-hidden="true"
        className={className}
        data-icon-name={token}
        style={inlineStyle}
      />
    );
  };

  MaskedIcon.propTypes = {
    className: PropTypes.string.isRequired,
    fallback: PropTypes.func,
  };

  MaskedIcon.defaultProps = {
    fallback: undefined,
  };

  return MaskedIcon;
}

export default createMaskedIconRenderer;
