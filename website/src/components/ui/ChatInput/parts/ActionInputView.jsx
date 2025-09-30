/**
 * 背景：
 *  - ActionInput 需在不牺牲复用性的前提下整合搜索框、语言区与动作按钮。
 * 目的：
 *  - 专注于渲染结构与样式，将业务逻辑委托给 useActionInputBehavior，确保层次清晰。
 * 关键决策与取舍：
 *  - 采用纯展示组件，仅消费容器传入的 props；图标解析仍保留在视图层以复用既有资源映射。
 * 影响范围：
 *  - ChatInput 的输入域结构复用方式；后续可在不触及业务逻辑的情况下调整排版。
 * 演进与TODO：
 *  - 若后续引入多主题图标，可在此处接入主题感知的资源选择策略。
 */
import PropTypes from "prop-types";
import ICONS from "@/assets/icons.js";
import SearchBox from "@/components/ui/SearchBox";
import LanguageControls from "../LanguageControls.jsx";
import styles from "../ChatInput.module.css";

const SEND_ICON_TOKEN = "paper-airplane";

const resolveSendIconResource = (registry) => {
  const entry = registry?.[SEND_ICON_TOKEN];
  if (!entry) {
    return null;
  }
  return entry.single ?? entry.light ?? entry.dark ?? null;
};

const buildSendIconMaskStyle = (resource) => {
  if (!resource) {
    return null;
  }
  const maskFragment = `url(${resource}) center / contain no-repeat`;
  return Object.freeze({
    mask: maskFragment,
    WebkitMask: maskFragment,
  });
};

const SEND_ICON_MASK_STYLE = buildSendIconMaskStyle(
  resolveSendIconResource(ICONS),
);

const SEND_ICON_INLINE_STYLE =
  SEND_ICON_MASK_STYLE === null
    ? null
    : Object.freeze({
        ...SEND_ICON_MASK_STYLE,
        backgroundColor: "currentColor",
      });

function ActionButton({ variant, ariaLabel, isPressed, isDisabled, onAction }) {
  const actionClassName = [
    styles["action-button"],
    styles[`action-button-${variant}`],
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={actionClassName}
      onClick={onAction}
      aria-label={ariaLabel}
      aria-pressed={typeof isPressed === "boolean" ? isPressed : undefined}
      disabled={isDisabled}
    >
      {variant === "send" ? (
        SEND_ICON_INLINE_STYLE ? (
          <span
            aria-hidden="true"
            className={styles["action-button-icon"]}
            data-icon-name={SEND_ICON_TOKEN}
            style={SEND_ICON_INLINE_STYLE}
          />
        ) : (
          <svg
            aria-hidden="true"
            className={styles["action-button-icon"]}
            viewBox="0 0 18 18"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M2.25 15.75 16.5 9 2.25 2.25l4.5 6-4.5 7.5Z" />
          </svg>
        )
      ) : (
        <span className={styles["action-button-dot"]} />
      )}
    </button>
  );
}

ActionButton.propTypes = {
  variant: PropTypes.oneOf(["send", "voice"]).isRequired,
  ariaLabel: PropTypes.string.isRequired,
  isPressed: PropTypes.bool,
  isDisabled: PropTypes.bool.isRequired,
  onAction: PropTypes.func.isRequired,
};

ActionButton.defaultProps = {
  isPressed: undefined,
};

function ActionInputView({
  formProps,
  textareaProps,
  actionState,
  languageState,
}) {
  const { ref: formRef, onSubmit } = formProps;
  const {
    ref: textareaRef,
    rows,
    placeholder,
    value,
    onChange,
    onKeyDown,
  } = textareaProps;

  return (
    <form ref={formRef} className={styles["input-wrapper"]} onSubmit={onSubmit}>
      <SearchBox className={styles["input-surface"]}>
        <div className={styles["input-surface-top"]}>
          <div className={styles["core-input"]}>
            <textarea
              ref={textareaRef}
              rows={rows}
              placeholder={placeholder}
              value={value}
              onChange={onChange}
              onKeyDown={onKeyDown}
              className={styles.textarea}
            />
            <button
              type="submit"
              className={styles["submit-proxy"]}
              tabIndex={-1}
              aria-hidden="true"
            />
          </div>
        </div>
        <div className={styles["input-surface-bottom"]}>
          <div className={styles["input-bottom-left"]}>
            {languageState.isVisible ? (
              <LanguageControls {...languageState.props} />
            ) : null}
          </div>
          <div className={styles["input-bottom-right"]}>
            <ActionButton {...actionState} />
          </div>
        </div>
      </SearchBox>
    </form>
  );
}

ActionInputView.propTypes = {
  formProps: PropTypes.shape({
    ref: PropTypes.shape({ current: PropTypes.any }).isRequired,
    onSubmit: PropTypes.func.isRequired,
  }).isRequired,
  textareaProps: PropTypes.shape({
    ref: PropTypes.func.isRequired,
    rows: PropTypes.number.isRequired,
    placeholder: PropTypes.string,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    onKeyDown: PropTypes.func.isRequired,
  }).isRequired,
  actionState: PropTypes.shape({
    variant: PropTypes.oneOf(["send", "voice"]).isRequired,
    ariaLabel: PropTypes.string.isRequired,
    isPressed: PropTypes.bool,
    isDisabled: PropTypes.bool.isRequired,
    onAction: PropTypes.func.isRequired,
  }).isRequired,
  languageState: PropTypes.shape({
    isVisible: PropTypes.bool.isRequired,
    props: PropTypes.shape({
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
    }).isRequired,
  }).isRequired,
};

export default ActionInputView;
