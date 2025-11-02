/**
 * 背景：
 *  - SelectMenu 主文件同时承担状态管理与列表渲染，造成组件层级难以拆分。
 * 目的：
 *  - 将纯渲染的选项列表抽离为展示组件，强化组合式设计并为后续分组/虚拟滚动预留接口。
 * 关键决策与取舍：
 *  - 选择传入标准化选项与活动值，保持展示层无业务判断；
 *  - 内联 CheckIcon 以减少跨文件跳转，未来如需复用可再独立成 tokens。
 * 影响范围：
 *  - SelectMenu 的列表渲染与按键聚焦行为（依赖 menuRef）。
 * 演进与TODO：
 *  - TODO: 若未来引入分组标题，可在此组件内增加语义化 role="group" 容器。
 */
import PropTypes from "prop-types";

import styles from "../SelectMenu.module.css";

import { OptionShape } from "../optionNormalizer.js";

function CheckIcon({ className }) {
  return (
    <svg
      className={className}
      width={16}
      height={16}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="m4 8.25 2.25 2.25L12 4.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

CheckIcon.propTypes = {
  className: PropTypes.string,
};

CheckIcon.defaultProps = {
  className: undefined,
};

export default function OptionList({
  options,
  activeValue,
  menuRef,
  open,
  onSelect,
}) {
  if (!open) {
    return null;
  }

  return (
    <ul
      className={styles["menu-list"]}
      role="menu"
      ref={menuRef}
      data-open={open ? "true" : undefined}
    >
      {options.map((option) => {
        const isActive = option.normalizedValue === activeValue;
        return (
          <li
            key={option.normalizedValue}
            role="none"
            className={styles["menu-item"]}
          >
            <button
              type="button"
              role="menuitemradio"
              aria-checked={isActive}
              className={styles["menu-button"]}
              data-active={isActive ? "true" : undefined}
              onClick={() => onSelect(option)}
              title={option.description || option.label}
            >
              <span className={styles["menu-option-text"]}>
                <span className={styles["menu-option-label"]}>
                  {option.label}
                </span>
                {option.description ? (
                  <span className={styles["menu-option-description"]}>
                    {option.description}
                  </span>
                ) : null}
              </span>
              <span className={styles["menu-option-check"]} aria-hidden="true">
                {isActive ? <CheckIcon /> : null}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

OptionList.propTypes = {
  options: PropTypes.arrayOf(OptionShape).isRequired,
  activeValue: PropTypes.string.isRequired,
  menuRef: PropTypes.shape({ current: PropTypes.any }).isRequired,
  open: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
};
