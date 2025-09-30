/**
 * 背景：
 *  - 行为与布局纠缠导致 ActionInput 难以单测与复用，需抽离纯展示层。
 * 目的：
 *  - 承接 Hook 产出的结构化 Props，仅负责组合已有 SearchBox、语言控制与动作按钮。
 * 关键决策与取舍：
 *  - 组件保持无状态，避免在视图层重新引入副作用，确保快照稳定。
 * 影响范围：
 *  - ChatInput 输入模块的展示结构与快照测试基线。
 * 演进与TODO：
 *  - 若未来需要插入额外装饰元素，可通过在 Hook 中扩展状态后于此组合。
 */
import PropTypes from "prop-types";

import SearchBox from "@/components/ui/SearchBox";
import LanguageControls from "../LanguageControls.jsx";
import ActionButton from "./ActionButton.jsx";
import styles from "../ChatInput.module.css";

function ActionInputView({
  formProps,
  textareaProps,
  languageControls,
  actionButtonProps,
}) {
  const { onFocus, onBlur, ...restTextareaProps } = textareaProps;
  const { isVisible, props: languageProps } = languageControls;
  const shouldRenderLanguageControls = isVisible;

  return (
    <form {...formProps} className={styles["input-wrapper"]}>
      <SearchBox className={styles["input-surface"]}>
        <div className={styles["input-surface-top"]}>
          <div className={styles["core-input"]}>
            <textarea
              {...restTextareaProps}
              className={styles.textarea}
              onFocus={onFocus}
              onBlur={onBlur}
            />
            <button
              type="submit"
              className={styles["submit-proxy"]}
              tabIndex={-1}
              aria-hidden="true"
            />
          </div>
        </div>
        <div className={styles["input-surface-bottom"]} data-mode="language">
          <div className={styles["input-bottom-left"]}>
            {shouldRenderLanguageControls ? (
              <LanguageControls {...languageProps} />
            ) : null}
          </div>
          <div className={styles["input-bottom-right"]}>
            <ActionButton {...actionButtonProps} />
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
    onFocus: PropTypes.func.isRequired,
    onBlur: PropTypes.func.isRequired,
  }).isRequired,
  languageControls: PropTypes.shape({
    isVisible: PropTypes.bool.isRequired,
    props: PropTypes.shape({
      sourceLanguage: PropTypes.oneOfType([PropTypes.string, PropTypes.symbol]),
      sourceLanguageOptions: PropTypes.arrayOf(
        PropTypes.shape({
          value: PropTypes.oneOfType([PropTypes.string, PropTypes.symbol]),
          label: PropTypes.string.isRequired,
        }),
      ).isRequired,
      sourceLanguageLabel: PropTypes.string,
      onSourceLanguageChange: PropTypes.func,
      targetLanguage: PropTypes.oneOfType([PropTypes.string, PropTypes.symbol]),
      targetLanguageOptions: PropTypes.arrayOf(
        PropTypes.shape({
          value: PropTypes.oneOfType([PropTypes.string, PropTypes.symbol]),
          label: PropTypes.string.isRequired,
        }),
      ).isRequired,
      targetLanguageLabel: PropTypes.string,
      onTargetLanguageChange: PropTypes.func,
      onSwapLanguages: PropTypes.func,
      swapLabel: PropTypes.string,
      normalizeSourceLanguage: PropTypes.func,
      normalizeTargetLanguage: PropTypes.func,
      onMenuOpen: PropTypes.func,
    }).isRequired,
  }).isRequired,
  actionButtonProps: PropTypes.shape({
    value: PropTypes.string.isRequired,
    isRecording: PropTypes.bool,
    voiceCooldownRef: PropTypes.shape({ current: PropTypes.number }).isRequired,
    onVoice: PropTypes.func,
    onSubmit: PropTypes.func.isRequired,
    isVoiceDisabled: PropTypes.bool.isRequired,
    sendLabel: PropTypes.string.isRequired,
    voiceLabel: PropTypes.string.isRequired,
  }).isRequired,
};

export default ActionInputView;
