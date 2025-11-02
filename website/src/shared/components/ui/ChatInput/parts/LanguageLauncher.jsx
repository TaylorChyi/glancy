/**
 * 背景：
 *  - ChatInput 语言控制需要统一触发器，旧版双按钮占位且缺乏二级菜单。
 * 目的：
 *  - 以三点三角按钮配合双层菜单提供源/目标语选择，并保留扩展能力。
 * 关键决策与取舍：
 *  - 复用 useLanguageLauncher Hook 聚合状态，视图层保持纯粹；
 *  - 左列承载语向切换，右列呈现对应选项，减少误触；
 *  - 复用共享的 CheckIcon，保持勾选语义一致。
 * 影响范围：
 *  - ChatInput 语言选择交互与相关测试快照。
 * 演进与TODO：
 *  - TODO: 后续可在菜单底部加入最近使用语言或收藏能力。
 */
import { useCallback, useEffect, useRef } from "react";
import PropTypes from "prop-types";

import Popover from "@shared/components/ui/Popover/Popover.jsx";

import CheckIcon from "@shared/components/ui/LanguageMenu/parts/CheckIcon.jsx";
import { TriadIcon } from "../icons";
import useLanguageLauncher from "../hooks/useLanguageLauncher.ts";
import styles from "../ChatInput.module.css";

function VariantRow({
  variant,
  isActive,
  onEnter,
}) {
  const description = variant.currentOption?.label || "--";
  return (
    <li role="none" className={styles["language-variant-item"]}>
      <button
        type="button"
        role="menuitem"
        aria-haspopup="menu"
        aria-expanded={isActive}
        className={styles["language-variant-button"]}
        data-active={isActive ? "true" : undefined}
        onMouseEnter={() => onEnter(variant.key)}
        onFocus={() => onEnter(variant.key)}
      >
        <span className={styles["language-variant-label"]}>{variant.label}</span>
        <span className={styles["language-variant-description"]}>{description}</span>
      </button>
    </li>
  );
}

VariantRow.propTypes = {
  variant: PropTypes.shape({
    key: PropTypes.oneOf(["source", "target"]).isRequired,
    label: PropTypes.string.isRequired,
    currentOption: PropTypes.shape({
      label: PropTypes.string,
    }),
  }).isRequired,
  isActive: PropTypes.bool.isRequired,
  onEnter: PropTypes.func.isRequired,
};

function VariantOption({ option, isActive, onSelect }) {
  return (
    <li role="none" className={styles["language-option-item"]}>
      <button
        type="button"
        role="menuitemradio"
        aria-checked={isActive}
        className={styles["language-option-button"]}
        data-active={isActive ? "true" : undefined}
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
}

VariantOption.propTypes = {
  option: PropTypes.shape({
    value: PropTypes.string.isRequired,
    badge: PropTypes.node.isRequired,
    label: PropTypes.string.isRequired,
    description: PropTypes.string,
  }).isRequired,
  isActive: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
};

export default function LanguageLauncher({
  sourceLanguage,
  sourceLanguageOptions,
  sourceLanguageLabel,
  onSourceLanguageChange,
  targetLanguage,
  targetLanguageOptions,
  targetLanguageLabel,
  onTargetLanguageChange,
  onSwapLanguages,
  swapLabel,
  normalizeSourceLanguage,
  normalizeTargetLanguage,
  onMenuOpen,
}) {
  const {
    open,
    triggerRef,
    menuRef,
    variants,
    activeVariant,
    handleToggle,
    handleClose,
    handleVariantEnter,
    handleSelect,
  } = useLanguageLauncher({
    source: {
      key: "source",
      label: sourceLanguageLabel,
      value: sourceLanguage,
      options: sourceLanguageOptions,
      onChange: onSourceLanguageChange,
      normalizeValue: normalizeSourceLanguage,
      onOpen:
        typeof onMenuOpen === "function"
          ? () => onMenuOpen("source")
          : undefined,
    },
    target: {
      key: "target",
      label: targetLanguageLabel,
      value: targetLanguage,
      options: targetLanguageOptions,
      onChange: onTargetLanguageChange,
      normalizeValue: normalizeTargetLanguage,
      onOpen:
        typeof onMenuOpen === "function"
          ? () => onMenuOpen("target")
          : undefined,
    },
  });

  const hoverDismissTimerRef = useRef(null);

  const cancelHoverDismiss = useCallback(() => {
    if (hoverDismissTimerRef.current !== null && typeof window !== "undefined") {
      window.clearTimeout(hoverDismissTimerRef.current);
    }
    hoverDismissTimerRef.current = null;
  }, []);

  useEffect(() => cancelHoverDismiss, [cancelHoverDismiss]);

  const groupLabel =
    [sourceLanguageLabel, targetLanguageLabel].filter(Boolean).join(" → ") ||
    "language selection";

  const activeKey = activeVariant?.key;
  const activeOptions = activeVariant?.normalizedOptions ?? [];
  const activeValue = activeVariant?.currentOption?.value;
  const canSwap = typeof onSwapLanguages === "function";

  const handleMenuMouseLeave = useCallback(
    /**
     * 意图：通过延迟收起策略避免浮层在内部 hover 切换时立即关闭。
     * 输入：鼠标离开事件。
     * 输出：当指针在给定延迟内未重新回到菜单时触发关闭。
     * 流程：
     *  1) 取消上一轮收起定时器；
     *  2) 启动新的短延时定时器触发关闭；
     *  3) 若期间鼠标重新进入则取消定时器。
     * 错误处理：无额外异常分支，由外层 close 逻辑托底。
     * 复杂度：O(1)。
     */
    () => {
      cancelHoverDismiss();
      if (typeof window === "undefined") {
        handleClose();
        return;
      }

      const delay = 160;
      hoverDismissTimerRef.current = window.setTimeout(() => {
        hoverDismissTimerRef.current = null;
        handleClose();
      }, delay);
    },
    [cancelHoverDismiss, handleClose],
  );

  if (variants.length === 0) {
    return null;
  }

  return (
    <div className={styles["language-launcher-wrapper"]}>
      <button
        type="button"
        className={styles["language-launcher-button"]}
        aria-label={groupLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={handleToggle}
        onMouseOver={cancelHoverDismiss}
        onMouseOut={handleMenuMouseLeave}
        ref={triggerRef}
        data-open={open ? "true" : undefined}
        title={groupLabel}
      >
        <TriadIcon className={styles["language-launcher-icon"]} />
      </button>
      <Popover
        isOpen={open}
        anchorRef={triggerRef}
        onClose={handleClose}
        placement="top"
        align="start"
        fallbackPlacements={["bottom"]}
        offset={12}
      >
        {open ? (
          <div
            ref={menuRef}
            className={styles["language-launcher-menu"]}
            role="menu"
            aria-label={groupLabel}
            onMouseOver={cancelHoverDismiss}
            onMouseOut={handleMenuMouseLeave}
          >
            <div className={styles["language-variant-column"]} role="presentation">
              <ul role="menu" className={styles["language-variant-list"]}>
                {variants.map((variant) => (
                  <VariantRow
                    key={variant.key}
                    variant={variant}
                    isActive={variant.key === activeKey}
                    onEnter={handleVariantEnter}
                  />
                ))}
              </ul>
              {canSwap ? (
                <button
                  type="button"
                  className={styles["language-swap-action"]}
                  onClick={() => {
                    onSwapLanguages?.();
                    handleClose();
                  }}
                >
                  {swapLabel || "Swap"}
                </button>
              ) : null}
            </div>
            <div className={styles["language-options-column"]} role="presentation">
              {activeOptions.length > 0 ? (
                <ul role="menu" className={styles["language-options-list"]}>
                  {activeOptions.map((option) => (
                    <VariantOption
                      key={option.value}
                      option={option}
                      isActive={option.value === activeValue}
                      onSelect={(value) => handleSelect(activeKey ?? "source", value)}
                    />
                  ))}
                </ul>
              ) : (
                <div className={styles["language-empty-state"]}>暂无可用语言</div>
              )}
            </div>
          </div>
        ) : null}
      </Popover>
    </div>
  );
}

LanguageLauncher.propTypes = {
  sourceLanguage: PropTypes.oneOfType([PropTypes.string, PropTypes.symbol]),
  sourceLanguageOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.symbol]),
      label: PropTypes.string.isRequired,
      description: PropTypes.string,
    }),
  ),
  sourceLanguageLabel: PropTypes.string,
  onSourceLanguageChange: PropTypes.func,
  targetLanguage: PropTypes.oneOfType([PropTypes.string, PropTypes.symbol]),
  targetLanguageOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.symbol]),
      label: PropTypes.string.isRequired,
      description: PropTypes.string,
    }),
  ),
  targetLanguageLabel: PropTypes.string,
  onTargetLanguageChange: PropTypes.func,
  onSwapLanguages: PropTypes.func,
  swapLabel: PropTypes.string,
  normalizeSourceLanguage: PropTypes.func,
  normalizeTargetLanguage: PropTypes.func,
  onMenuOpen: PropTypes.func,
};

LanguageLauncher.defaultProps = {
  sourceLanguage: undefined,
  sourceLanguageOptions: [],
  sourceLanguageLabel: undefined,
  onSourceLanguageChange: undefined,
  targetLanguage: undefined,
  targetLanguageOptions: [],
  targetLanguageLabel: undefined,
  onTargetLanguageChange: undefined,
  onSwapLanguages: undefined,
  swapLabel: undefined,
  normalizeSourceLanguage: undefined,
  normalizeTargetLanguage: undefined,
  onMenuOpen: undefined,
};
