/**
 * 背景：
 *  - LanguageMenu 主体需遵守结构化守卫，将展示逻辑拆分可让主函数保持精简。
 * 目的：
 *  - 承载按钮与弹层的渲染细节，以组合方式装配语言菜单 UI。
 * 关键决策与取舍：
 *  - 组件拆分为 Trigger 与 Popover 两部分，避免单个函数过长；
 *  - 复用已有样式模块与 CheckIcon，拒绝在此引入额外样式变更。
 * 影响范围：
 *  - LanguageMenu 的展示层，其他模块无需调整。
 * 演进与TODO：
 *  - TODO: 若需支持选项分组，可在此扩展分组容器组件。
 */
import PropTypes from "prop-types";

import Popover from "@shared/components/ui/Popover/Popover.jsx";

import CheckIcon from "./CheckIcon.jsx";
import styles from "../LanguageMenu.module.css";

const optionPropType = PropTypes.shape({
  value: PropTypes.string.isRequired,
  badge: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  description: PropTypes.string,
});

const refPropType = PropTypes.shape({ current: PropTypes.instanceOf(Element) });

function LanguageMenuTrigger({
  id,
  open,
  variant,
  fullWidth,
  triggerRef,
  onToggle,
  onTriggerKeyDown,
  triggerAriaLabel,
  triggerTitle,
  showTriggerLabel,
  badge,
  label,
}) {
  return (
    <button
      type="button"
      id={id}
      className={styles["language-trigger"]}
      aria-haspopup="menu"
      aria-expanded={open}
      onClick={onToggle}
      onKeyDown={onTriggerKeyDown}
      aria-label={triggerAriaLabel}
      title={triggerTitle}
      ref={triggerRef}
      data-open={open}
      data-variant={variant}
      data-fullwidth={fullWidth ? "true" : undefined}
    >
      <span className={styles["language-trigger-content"]}>
        <span className={styles["language-trigger-code"]}>{badge}</span>
        <span
          className={styles["language-trigger-label"]}
          data-visible={showTriggerLabel}
        >
          {label}
        </span>
      </span>
    </button>
  );
}

LanguageMenuTrigger.propTypes = {
  id: PropTypes.string,
  open: PropTypes.bool.isRequired,
  variant: PropTypes.oneOf(["source", "target"]).isRequired,
  fullWidth: PropTypes.bool,
  triggerRef: refPropType,
  onToggle: PropTypes.func.isRequired,
  onTriggerKeyDown: PropTypes.func.isRequired,
  triggerAriaLabel: PropTypes.string.isRequired,
  triggerTitle: PropTypes.string.isRequired,
  showTriggerLabel: PropTypes.bool.isRequired,
  badge: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
};

LanguageMenuTrigger.defaultProps = {
  id: undefined,
  fullWidth: false,
  triggerRef: undefined,
};

function LanguageMenuList({ options, currentValue, onSelect }) {
  return options.map((option) => {
    const isActive = option.value === currentValue;
    return (
      <li
        key={option.value}
        role="none"
        className={styles["language-menu-item"]}
      >
        <button
          type="button"
          role="menuitemradio"
          aria-checked={isActive}
          className={styles["language-menu-button"]}
          data-active={isActive}
          onClick={() => onSelect(option.value)}
          title={option.description || option.label}
        >
          <span className={styles["language-option-code"]}>{option.badge}</span>
          <span className={styles["language-option-name"]}>{option.label}</span>
          <span className={styles["language-option-check"]} aria-hidden="true">
            {isActive ? <CheckIcon /> : null}
          </span>
        </button>
      </li>
    );
  });
}

LanguageMenuList.propTypes = {
  options: PropTypes.arrayOf(optionPropType).isRequired,
  currentValue: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
};

function LanguageMenuPopover({
  open,
  triggerRef,
  menuRef,
  options,
  currentValue,
  onSelect,
  onClose,
}) {
  return (
    <Popover
      isOpen={open}
      anchorRef={triggerRef}
      onClose={onClose}
      placement="top"
      align="start"
      fallbackPlacements={["bottom"]}
      offset={12}
      // 优先将菜单展示在按钮上方；当顶部空间不足时自动回退至下方。
    >
      {open ? (
        <ul
          className={styles["language-menu"]}
          role="menu"
          ref={menuRef}
          data-open={open}
        >
          <LanguageMenuList
            options={options}
            currentValue={currentValue}
            onSelect={onSelect}
          />
        </ul>
      ) : null}
    </Popover>
  );
}

LanguageMenuPopover.propTypes = {
  open: PropTypes.bool.isRequired,
  triggerRef: refPropType,
  menuRef: refPropType,
  options: PropTypes.arrayOf(optionPropType).isRequired,
  currentValue: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

LanguageMenuPopover.defaultProps = {
  triggerRef: undefined,
  menuRef: undefined,
};

export default function LanguageMenuView({
  id,
  open,
  variant,
  fullWidth,
  triggerRef,
  menuRef,
  currentOption,
  options,
  onToggle,
  onTriggerKeyDown,
  onSelect,
  onClose,
  triggerAriaLabel,
  triggerTitle,
  showTriggerLabel,
}) {
  return (
    <div
      className={styles["language-select-wrapper"]}
      data-fullwidth={fullWidth ? "true" : undefined}
    >
      <LanguageMenuTrigger
        id={id}
        open={open}
        variant={variant}
        fullWidth={fullWidth}
        triggerRef={triggerRef}
        onToggle={onToggle}
        onTriggerKeyDown={onTriggerKeyDown}
        triggerAriaLabel={triggerAriaLabel}
        triggerTitle={triggerTitle}
        showTriggerLabel={showTriggerLabel}
        badge={currentOption.badge}
        label={currentOption.label}
      />
      <LanguageMenuPopover
        open={open}
        triggerRef={triggerRef}
        menuRef={menuRef}
        options={options}
        currentValue={currentOption.value}
        onSelect={onSelect}
        onClose={onClose}
      />
    </div>
  );
}

LanguageMenuView.propTypes = {
  id: PropTypes.string,
  open: PropTypes.bool.isRequired,
  variant: PropTypes.oneOf(["source", "target"]).isRequired,
  fullWidth: PropTypes.bool,
  triggerRef: refPropType,
  menuRef: refPropType,
  currentOption: optionPropType.isRequired,
  options: PropTypes.arrayOf(optionPropType).isRequired,
  onToggle: PropTypes.func.isRequired,
  onTriggerKeyDown: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  triggerAriaLabel: PropTypes.string.isRequired,
  triggerTitle: PropTypes.string.isRequired,
  showTriggerLabel: PropTypes.bool.isRequired,
};

LanguageMenuView.defaultProps = {
  id: undefined,
  fullWidth: false,
  triggerRef: undefined,
  menuRef: undefined,
};
