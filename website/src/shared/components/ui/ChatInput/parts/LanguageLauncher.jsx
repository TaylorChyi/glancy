import { useCallback, useEffect, useMemo, useRef } from "react";
import PropTypes from "prop-types";

import Popover from "@shared/components/ui/Popover/Popover.jsx";

import CheckIcon from "@shared/components/ui/LanguageMenu/parts/CheckIcon.jsx";
import { TriadIcon } from "../icons";
import useLanguageLauncher from "../hooks/useLanguageLauncher.ts";
import styles from "../ChatInput.module.css";

const HOVER_DISMISS_DELAY = 160;

function useHoverDismissController(onClose) {
  const timerRef = useRef(null);

  const cancel = useCallback(() => {
    if (timerRef.current !== null && typeof window !== "undefined") {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = null;
  }, []);

  const schedule = useCallback(() => {
    cancel();
    if (typeof window === "undefined") {
      onClose();
      return;
    }
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      onClose();
    }, HOVER_DISMISS_DELAY);
  }, [cancel, onClose]);

  useEffect(() => cancel, [cancel]);

  return { enter: cancel, leave: schedule, cancel };
}

function useVariantOpenHandlers(onMenuOpen) {
  return useMemo(() => {
    if (typeof onMenuOpen !== "function") {
      return { source: undefined, target: undefined };
    }
    return {
      source: () => onMenuOpen("source"),
      target: () => onMenuOpen("target"),
    };
  }, [onMenuOpen]);
}

function composeVariantInput({
  key,
  label,
  value,
  options,
  onChange,
  normalizeValue,
  onOpen,
}) {
  return {
    key,
    label,
    value,
    options: options ?? [],
    onChange,
    normalizeValue,
    onOpen,
  };
}

function buildGroupLabel(sourceLabel, targetLabel) {
  const labelTokens = [sourceLabel, targetLabel].filter(Boolean);
  if (labelTokens.length === 0) {
    return "language selection";
  }
  return labelTokens.join(" → ");
}

function resolveSwapAction(onSwapLanguages, swapLabel) {
  if (typeof onSwapLanguages !== "function") {
    return null;
  }
  return {
    label: swapLabel || "Swap",
    onSwap: onSwapLanguages,
  };
}

function createLauncherViewModel(props, openHandlers) {
  return {
    params: {
      source: composeVariantInput({
        key: "source",
        label: props.sourceLanguageLabel,
        value: props.sourceLanguage,
        options: props.sourceLanguageOptions,
        onChange: props.onSourceLanguageChange,
        normalizeValue: props.normalizeSourceLanguage,
        onOpen: openHandlers.source,
      }),
      target: composeVariantInput({
        key: "target",
        label: props.targetLanguageLabel,
        value: props.targetLanguage,
        options: props.targetLanguageOptions,
        onChange: props.onTargetLanguageChange,
        normalizeValue: props.normalizeTargetLanguage,
        onOpen: openHandlers.target,
      }),
    },
    groupLabel: buildGroupLabel(
      props.sourceLanguageLabel,
      props.targetLanguageLabel,
    ),
    swapAction: resolveSwapAction(props.onSwapLanguages, props.swapLabel),
  };
}

function LanguageLauncherTrigger({
  groupLabel,
  open,
  onToggle,
  triggerRef,
  hoverGuards,
}) {
  return (
    <button
      type="button"
      className={styles["language-launcher-button"]}
      aria-label={groupLabel}
      aria-haspopup="menu"
      aria-expanded={open}
      onClick={onToggle}
      onMouseOver={hoverGuards.enter}
      onMouseOut={hoverGuards.leave}
      ref={triggerRef}
      data-open={open ? "true" : undefined}
      title={groupLabel}
    >
      <TriadIcon className={styles["language-launcher-icon"]} />
    </button>
  );
}

LanguageLauncherTrigger.propTypes = {
  groupLabel: PropTypes.string.isRequired,
  open: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  triggerRef: PropTypes.shape({ current: PropTypes.instanceOf(Element) })
    .isRequired,
  hoverGuards: PropTypes.shape({
    enter: PropTypes.func.isRequired,
    leave: PropTypes.func.isRequired,
  }).isRequired,
};

function LanguageVariantsColumn({
  variants,
  activeKey,
  onVariantEnter,
  swapAction,
  onSwap,
}) {
  return (
    <div className={styles["language-variant-column"]} role="presentation">
      <ul role="menu" className={styles["language-variant-list"]}>
        {variants.map((variant) => (
          <VariantRow
            key={variant.key}
            variant={variant}
            isActive={variant.key === activeKey}
            onEnter={onVariantEnter}
          />
        ))}
      </ul>
      {swapAction ? (
        <button
          type="button"
          className={styles["language-swap-action"]}
          onClick={onSwap}
        >
          {swapAction.label}
        </button>
      ) : null}
    </div>
  );
}

LanguageVariantsColumn.propTypes = {
  variants: PropTypes.arrayOf(PropTypes.object).isRequired,
  activeKey: PropTypes.oneOf(["source", "target"]),
  onVariantEnter: PropTypes.func.isRequired,
  swapAction: PropTypes.shape({
    label: PropTypes.string.isRequired,
  }),
  onSwap: PropTypes.func,
};

LanguageVariantsColumn.defaultProps = {
  activeKey: undefined,
  swapAction: null,
  onSwap: undefined,
};

function LanguageMenuColumns({
  variants,
  activeKey,
  onVariantEnter,
  swapAction,
  onSwap,
  activeVariant,
  onSelect,
}) {
  return (
    <>
      <LanguageVariantsColumn
        variants={variants}
        activeKey={activeKey}
        onVariantEnter={onVariantEnter}
        swapAction={swapAction}
        onSwap={onSwap}
      />
      <LanguageOptionsColumn
        variant={activeVariant}
        onSelect={onSelect}
      />
    </>
  );
}

LanguageMenuColumns.propTypes = {
  variants: PropTypes.arrayOf(PropTypes.object).isRequired,
  activeKey: PropTypes.oneOf(["source", "target"]),
  onVariantEnter: PropTypes.func.isRequired,
  swapAction: PropTypes.shape({
    label: PropTypes.string.isRequired,
  }),
  onSwap: PropTypes.func,
  activeVariant: PropTypes.object,
  onSelect: PropTypes.func.isRequired,
};

LanguageMenuColumns.defaultProps = {
  activeKey: undefined,
  swapAction: null,
  onSwap: undefined,
  activeVariant: null,
};

function LanguageOptionsColumn({ variant, onSelect }) {
  const options = variant?.normalizedOptions ?? [];
  const activeValue = variant?.currentOption?.value;
  const variantKey = variant?.key ?? "source";

  if (options.length === 0) {
    return (
      <div className={styles["language-options-column"]} role="presentation">
        <div className={styles["language-empty-state"]}>暂无可用语言</div>
      </div>
    );
  }

  return (
    <div className={styles["language-options-column"]} role="presentation">
      <ul role="menu" className={styles["language-options-list"]}>
        {options.map((option) => (
          <VariantOption
            key={option.value}
            option={option}
            isActive={option.value === activeValue}
            onSelect={(value) => onSelect(variantKey, value)}
          />
        ))}
      </ul>
    </div>
  );
}

LanguageOptionsColumn.propTypes = {
  variant: PropTypes.shape({
    key: PropTypes.oneOf(["source", "target"]),
    normalizedOptions: PropTypes.array,
    currentOption: PropTypes.shape({ value: PropTypes.string }),
  }),
  onSelect: PropTypes.func.isRequired,
};

LanguageOptionsColumn.defaultProps = {
  variant: null,
};

function MenuSurface({ groupLabel, menuRef, hoverGuards, children }) {
  return (
    <div
      ref={menuRef}
      className={styles["language-launcher-menu"]}
      role="menu"
      aria-label={groupLabel}
      onMouseOver={hoverGuards.enter}
      onMouseOut={hoverGuards.leave}
    >
      {children}
    </div>
  );
}

MenuSurface.propTypes = {
  groupLabel: PropTypes.string.isRequired,
  menuRef: PropTypes.shape({ current: PropTypes.instanceOf(Element) }).isRequired,
  hoverGuards: PropTypes.shape({
    enter: PropTypes.func.isRequired,
    leave: PropTypes.func.isRequired,
    cancel: PropTypes.func.isRequired,
  }).isRequired,
  children: PropTypes.node.isRequired,
};

function LanguageLauncherMenu({
  groupLabel,
  state,
  hoverGuards,
  swapAction,
}) {
  const { menuRef, variants, activeVariant, handleVariantEnter, handleSelect, handleClose } =
    state;
  const activeKey = activeVariant?.key;
  const swapHandler = swapAction
    ? () => {
        hoverGuards.cancel();
        swapAction.onSwap();
        handleClose();
      }
    : undefined;

  return (
    <MenuSurface
      groupLabel={groupLabel}
      menuRef={menuRef}
      hoverGuards={hoverGuards}
    >
      <LanguageMenuColumns
        variants={variants}
        activeKey={activeKey}
        onVariantEnter={handleVariantEnter}
        swapAction={swapAction}
        onSwap={swapHandler}
        activeVariant={activeVariant}
        onSelect={handleSelect}
      />
    </MenuSurface>
  );
}

LanguageLauncherMenu.propTypes = {
  groupLabel: PropTypes.string.isRequired,
  state: PropTypes.shape({
    menuRef: PropTypes.shape({ current: PropTypes.instanceOf(Element) })
      .isRequired,
    variants: PropTypes.arrayOf(PropTypes.object).isRequired,
    activeVariant: PropTypes.object,
    handleVariantEnter: PropTypes.func.isRequired,
    handleSelect: PropTypes.func.isRequired,
    handleClose: PropTypes.func.isRequired,
  }).isRequired,
  hoverGuards: PropTypes.shape({
    enter: PropTypes.func.isRequired,
    leave: PropTypes.func.isRequired,
    cancel: PropTypes.func.isRequired,
  }).isRequired,
  swapAction: PropTypes.shape({
    label: PropTypes.string.isRequired,
    onSwap: PropTypes.func.isRequired,
  }),
};

LanguageLauncherMenu.defaultProps = {
  swapAction: null,
};

function LanguageLauncherPopover({
  groupLabel,
  state,
  hoverGuards,
  swapAction,
}) {
  return (
    <Popover
      isOpen={state.open}
      anchorRef={state.triggerRef}
      onClose={state.handleClose}
      placement="top"
      align="start"
      fallbackPlacements={["bottom"]}
      offset={12}
    >
      {state.open ? (
        <LanguageLauncherMenu
          groupLabel={groupLabel}
          state={state}
          hoverGuards={hoverGuards}
          swapAction={swapAction}
        />
      ) : null}
    </Popover>
  );
}

LanguageLauncherPopover.propTypes = {
  groupLabel: PropTypes.string.isRequired,
  state: PropTypes.object.isRequired,
  hoverGuards: PropTypes.shape({
    enter: PropTypes.func.isRequired,
    leave: PropTypes.func.isRequired,
    cancel: PropTypes.func.isRequired,
  }).isRequired,
  swapAction: PropTypes.shape({
    label: PropTypes.string.isRequired,
    onSwap: PropTypes.func.isRequired,
  }),
};

LanguageLauncherPopover.defaultProps = {
  swapAction: null,
};

function LanguageLauncherView({ groupLabel, hoverGuards, state, swapAction }) {
  return (
    <div className={styles["language-launcher-wrapper"]}>
      <LanguageLauncherTrigger
        groupLabel={groupLabel}
        open={state.open}
        onToggle={state.handleToggle}
        triggerRef={state.triggerRef}
        hoverGuards={hoverGuards}
      />
      <LanguageLauncherPopover
        groupLabel={groupLabel}
        state={state}
        hoverGuards={hoverGuards}
        swapAction={swapAction}
      />
    </div>
  );
}

LanguageLauncherView.propTypes = {
  groupLabel: PropTypes.string.isRequired,
  hoverGuards: PropTypes.shape({
    enter: PropTypes.func.isRequired,
    leave: PropTypes.func.isRequired,
    cancel: PropTypes.func.isRequired,
  }).isRequired,
  state: PropTypes.object.isRequired,
  swapAction: PropTypes.shape({
    label: PropTypes.string.isRequired,
    onSwap: PropTypes.func.isRequired,
  }),
};

LanguageLauncherView.defaultProps = {
  swapAction: null,
};

function VariantRow({ variant, isActive, onEnter }) {
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
        <span className={styles["language-variant-label"]}>
          {variant.label}
        </span>
        <span className={styles["language-variant-description"]}>
          {description}
        </span>
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

export default function LanguageLauncher(props) {
  const openHandlers = useVariantOpenHandlers(props.onMenuOpen);
  const viewModel = createLauncherViewModel(props, openHandlers);
  const state = useLanguageLauncher(viewModel.params);
  const hoverGuards = useHoverDismissController(state.handleClose);

  if (state.variants.length === 0) {
    return null;
  }

  return (
    <LanguageLauncherView
      groupLabel={viewModel.groupLabel}
      hoverGuards={hoverGuards}
      state={state}
      swapAction={viewModel.swapAction}
    />
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
