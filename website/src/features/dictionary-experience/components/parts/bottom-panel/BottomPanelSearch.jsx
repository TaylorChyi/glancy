import PropTypes from "prop-types";
import ChatInput from "@shared/components/ui/ChatInput";
import {
  normalizeWordSourceLanguage,
  normalizeWordTargetLanguage,
} from "@shared/utils";

function BottomPanelSearch({ inputProps, handleInputFocusChange }) {
  return (
    <ChatInput
      inputRef={inputProps.inputRef}
      value={inputProps.text}
      onChange={(event) => inputProps.setText(event.target.value)}
      onSubmit={inputProps.handleSend}
      placeholder={inputProps.placeholder}
      maxRows={5}
      maxWidth="var(--docker-row-max-width, var(--sb-max-width))"
      sourceLanguage={inputProps.sourceLanguage}
      sourceLanguageOptions={inputProps.sourceLanguageOptions}
      sourceLanguageLabel={inputProps.sourceLanguageLabel}
      onSourceLanguageChange={inputProps.setSourceLanguage}
      targetLanguage={inputProps.targetLanguage}
      targetLanguageOptions={inputProps.targetLanguageOptions}
      targetLanguageLabel={inputProps.targetLanguageLabel}
      onTargetLanguageChange={inputProps.setTargetLanguage}
      onSwapLanguages={inputProps.handleSwapLanguages}
      swapLabel={inputProps.swapLabel}
      normalizeSourceLanguageFn={normalizeWordSourceLanguage}
      normalizeTargetLanguageFn={normalizeWordTargetLanguage}
      onFocusChange={handleInputFocusChange}
    />
  );
}

BottomPanelSearch.propTypes = {
  inputProps: PropTypes.shape({
    inputRef: PropTypes.shape({ current: PropTypes.any }).isRequired,
    text: PropTypes.string.isRequired,
    setText: PropTypes.func.isRequired,
    handleSend: PropTypes.func.isRequired,
    placeholder: PropTypes.string,
    sourceLanguage: PropTypes.string,
    sourceLanguageOptions: PropTypes.arrayOf(PropTypes.shape({})),
    sourceLanguageLabel: PropTypes.string,
    setSourceLanguage: PropTypes.func.isRequired,
    targetLanguage: PropTypes.string,
    targetLanguageOptions: PropTypes.arrayOf(PropTypes.shape({})),
    targetLanguageLabel: PropTypes.string,
    setTargetLanguage: PropTypes.func.isRequired,
    handleSwapLanguages: PropTypes.func.isRequired,
    swapLabel: PropTypes.string,
  }).isRequired,
  handleInputFocusChange: PropTypes.func.isRequired,
};

export default BottomPanelSearch;
