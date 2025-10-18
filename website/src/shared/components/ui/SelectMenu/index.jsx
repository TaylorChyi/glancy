/**
 * 背景：
 *  - 个性化分区原使用原生 select 控件，视觉与语言菜单割裂且难以扩展。
 * 目的：
 *  - 提供与 LanguageMenu 同步的弹层式选择器，复用 Popover 与键盘导航策略。
 * 关键决策与取舍：
 *  - 采用组合 + 策略：壳体由调用方控制（复用 field-shell），组件专注弹层与选项状态；
 *  - 延续 useMenuNavigation 处理键盘流转，放弃自行管理焦点以避免重复实现。
 * 影响范围：
 *  - 偏好设置响应风格分区等需要统一下拉体验的场景。
 * 演进与TODO：
 *  - TODO: 后续可为选项扩展图标插槽或分组标题，保持键盘行为不变。
 */
import PropTypes from "prop-types";

import MenuSurface from "./parts/MenuSurface.jsx";
import SelectMenuTrigger from "./parts/Trigger.jsx";
import { OptionShape } from "./optionNormalizer.js";
import useSelectMenuController from "./useSelectMenuController.js";

import styles from "./SelectMenu.module.css";

export default function SelectMenu({
  id,
  options,
  value,
  onChange,
  ariaLabel,
  placeholder,
  fullWidth,
}) {
  const {
    open,
    menuRef,
    triggerRef,
    normalizedOptions,
    handleToggle,
    handleClose,
    handleSelect,
    handleTriggerKeyDown,
    resolvedAriaLabel,
    triggerLabel,
    isShowingPlaceholder,
    activeValue,
    hasOptions,
  } = useSelectMenuController({
    options,
    value,
    onChange,
    ariaLabel,
    placeholder,
  });

  if (!hasOptions) {
    return null;
  }

  return (
    <div
      className={styles["menu-root"]}
      data-fullwidth={fullWidth ? "true" : undefined}
    >
      <SelectMenuTrigger
        id={id}
        open={open}
        triggerRef={triggerRef}
        onToggle={handleToggle}
        onKeyDown={handleTriggerKeyDown}
        ariaLabel={resolvedAriaLabel}
        label={triggerLabel}
        isPlaceholder={isShowingPlaceholder}
      />
      <MenuSurface
        open={open}
        anchorRef={triggerRef}
        onClose={handleClose}
        menuRef={menuRef}
        options={normalizedOptions}
        activeValue={activeValue}
        onSelect={handleSelect}
      />
    </div>
  );
}

SelectMenu.propTypes = {
  id: PropTypes.string,
  options: PropTypes.arrayOf(OptionShape),
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  ariaLabel: PropTypes.string,
  placeholder: PropTypes.string,
  fullWidth: PropTypes.bool,
};

SelectMenu.defaultProps = {
  id: undefined,
  options: [],
  value: "",
  onChange: undefined,
  ariaLabel: undefined,
  placeholder: undefined,
  fullWidth: false,
};
