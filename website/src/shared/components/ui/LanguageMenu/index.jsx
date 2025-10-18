/**
 * 背景：
 *  - ChatInput 的语言菜单已在多个界面复用，历史上逻辑与渲染耦合导致文件体积超标并列入 lint 豁免。
 * 目的：
 *  - 以更明确的分层（Hook + 纯函数 + 展示组件）重构语言菜单，让结构化规则重新落地并便于后续扩展。
 * 关键决策与取舍：
 *  - 采用策略模式注入 normalizeValue，使上下游可定制语言枚举映射；
 *  - 通过 useLanguageMenu 聚合状态管理与键盘行为，主组件聚焦布局渲染；
 *  - 通过 LanguageMenuView 切分展示层，压缩函数体积以重新遵循结构化守卫。
 * 影响范围：
 *  - ChatInput、Preferences 等引用语言菜单的模块；
 * 演进与TODO：
 *  - TODO: 后续可在 options 内支持图标或分组信息，需同步拓展菜单项模板。
 *  - 近期扩展：fullWidth 策略用于让触发器撑满父容器，避免偏好设置等场景出现仅文字可点的体验断层。
 */
import PropTypes from "prop-types";

import LanguageMenuView from "./parts/LanguageMenuView.jsx";
import useLanguageMenu from "./useLanguageMenu.js";

export default function LanguageMenu({
  id,
  options,
  value,
  onChange,
  ariaLabel,
  normalizeValue,
  showLabel,
  variant,
  onOpen,
  fullWidth,
}) {
  const {
    open,
    triggerRef,
    menuRef,
    normalizedOptions,
    currentOption,
    handleToggle,
    handleSelect,
    handleTriggerKeyDown,
    closeMenu,
  } = useLanguageMenu({
    options,
    value,
    normalizeValue,
    onChange,
    onOpen,
    variant,
  });

  if (normalizedOptions.length === 0 || !currentOption) {
    return null;
  }

  const triggerAriaLabel = ariaLabel || currentOption.label;
  const triggerTitle = currentOption.label;
  const showTriggerLabel = Boolean(showLabel);

  return (
    <LanguageMenuView
      id={id}
      open={open}
      variant={variant}
      fullWidth={fullWidth}
      triggerRef={triggerRef}
      menuRef={menuRef}
      currentOption={currentOption}
      options={normalizedOptions}
      onToggle={handleToggle}
      onTriggerKeyDown={handleTriggerKeyDown}
      onSelect={handleSelect}
      onClose={closeMenu}
      triggerAriaLabel={triggerAriaLabel}
      triggerTitle={triggerTitle}
      showTriggerLabel={showTriggerLabel}
    />
  );
}

LanguageMenu.propTypes = {
  id: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.symbol]),
      label: PropTypes.string.isRequired,
      description: PropTypes.string,
    }),
  ),
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.symbol]),
  onChange: PropTypes.func,
  ariaLabel: PropTypes.string,
  normalizeValue: PropTypes.func,
  showLabel: PropTypes.bool,
  variant: PropTypes.oneOf(["source", "target"]),
  onOpen: PropTypes.func,
  fullWidth: PropTypes.bool,
};

LanguageMenu.defaultProps = {
  id: undefined,
  options: [],
  value: undefined,
  onChange: undefined,
  ariaLabel: undefined,
  normalizeValue: undefined,
  showLabel: false,
  variant: "source",
  onOpen: undefined,
  fullWidth: false,
};
