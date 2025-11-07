import PropTypes from "prop-types";

import useActionInputBehavior from "../hooks/useActionInputBehavior";
import ActionInputView from "../parts/ActionInputView.jsx";

function ActionInput(props) {
  const behavior = useActionInputBehavior(props);

  return <ActionInputView {...behavior} />;
}

ActionInput.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func,
  onSubmit: PropTypes.func,
  inputRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.any }),
  ]),
  placeholder: PropTypes.string,
  sendLabel: PropTypes.string,
  rows: PropTypes.number,
  maxRows: PropTypes.number,
  sourceLanguage: PropTypes.oneOfType([PropTypes.string, PropTypes.symbol]),
  sourceLanguageOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.symbol]),
      label: PropTypes.string.isRequired,
    }),
  ),
  sourceLanguageLabel: PropTypes.string,
  onSourceLanguageChange: PropTypes.func,
  targetLanguage: PropTypes.oneOfType([PropTypes.string, PropTypes.symbol]),
  targetLanguageOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.symbol]),
      label: PropTypes.string.isRequired,
    }),
  ),
  targetLanguageLabel: PropTypes.string,
  onTargetLanguageChange: PropTypes.func,
  onSwapLanguages: PropTypes.func,
  swapLabel: PropTypes.string,
  normalizeSourceLanguageFn: PropTypes.func,
  normalizeTargetLanguageFn: PropTypes.func,
  onMenuOpen: PropTypes.func,
  onFocusChange: PropTypes.func,
};

ActionInput.defaultProps = {
  onChange: undefined,
  onSubmit: undefined,
  inputRef: undefined,
  placeholder: undefined,
  sendLabel: "Send",
  rows: 1,
  maxRows: 5,
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
  normalizeSourceLanguageFn: (value) => value,
  normalizeTargetLanguageFn: (value) => value,
  onMenuOpen: undefined,
  onFocusChange: undefined,
};

export default ActionInput;
