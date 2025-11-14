import PropTypes from "prop-types";

import SearchBox from "@shared/components/ui/SearchBox";
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
  const { isVisible: shouldRenderLanguageControls, props: languageProps } =
    languageControls;

  return (
    <ActionInputStructure
      formProps={formProps}
      textareaProps={restTextareaProps}
      onFocus={onFocus}
      onBlur={onBlur}
      shouldRenderLanguageControls={shouldRenderLanguageControls}
      languageProps={languageProps}
      actionButtonProps={actionButtonProps}
    />
  );
}

function ActionInputStructure({
  formProps,
  textareaProps,
  onFocus,
  onBlur,
  shouldRenderLanguageControls,
  languageProps,
  actionButtonProps,
}) {
  const languageVisibility = shouldRenderLanguageControls ? "true" : "false";

  return (
    <form {...formProps} className={styles["input-wrapper"]}>
      <SearchBox
        className={styles["input-surface"]}
        data-language-visible={languageVisibility}
      >
        <LanguageSlot
          shouldRenderLanguageControls={shouldRenderLanguageControls}
          languageVisibility={languageVisibility}
          languageProps={languageProps}
        />
        <TextSlot
          textareaProps={textareaProps}
          onFocus={onFocus}
          onBlur={onBlur}
        />
        <ActionSlot actionButtonProps={actionButtonProps} />
      </SearchBox>
    </form>
  );
}

function LanguageSlot({
  shouldRenderLanguageControls,
  languageVisibility,
  languageProps,
}) {
  return (
    <div className={styles["language-slot"]} data-visible={languageVisibility}>
      {shouldRenderLanguageControls ? (
        <LanguageControls {...languageProps} />
      ) : null}
    </div>
  );
}

function TextSlot({ textareaProps, onFocus, onBlur }) {
  return (
    <div className={styles["text-slot"]}>
      <div className={styles["core-input"]}>
        <textarea
          {...textareaProps}
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
  );
}

function ActionSlot({ actionButtonProps }) {
  return (
    <div className={styles["action-slot"]}>
      <ActionButton {...actionButtonProps} />
    </div>
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
    canSubmit: PropTypes.bool.isRequired,
    onSubmit: PropTypes.func.isRequired,
    sendLabel: PropTypes.string.isRequired,
    restoreFocus: PropTypes.func.isRequired,
  }).isRequired,
};

export default ActionInputView;
