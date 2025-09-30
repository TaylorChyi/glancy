/**
 * 背景：
 *  - ChatInput 的 ActionInput 既承担输入逻辑也负责渲染，导致职责混杂、测试困难。
 * 目的：
 *  - 作为容器组件桥接业务 Hook 与纯展示视图，确保依赖注入清晰、易于扩展。
 * 关键决策与取舍：
 *  - 采用容器-视图分层：容器仅聚合 props 与回调，Hook 处理交互逻辑，View 管理结构；放弃在此层编写任何 DOM 操作以保持纯度。
 * 影响范围：
 *  - 所有引用 ActionInput 的调用方仍通过默认导出获取封装组件，无需变更调用方式。
 * 演进与TODO：
 *  - 可在容器层增设策略/特性开关注入点，用于灰度发布新的交互能力。
 */
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
  onVoice: PropTypes.func,
  inputRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.any }),
  ]),
  placeholder: PropTypes.string,
  voiceLabel: PropTypes.string,
  sendLabel: PropTypes.string,
  rows: PropTypes.number,
  maxRows: PropTypes.number,
  isRecording: PropTypes.bool,
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
};

ActionInput.defaultProps = {
  onChange: undefined,
  onSubmit: undefined,
  onVoice: undefined,
  inputRef: undefined,
  placeholder: undefined,
  voiceLabel: "Voice",
  sendLabel: "Send",
  rows: 1,
  maxRows: 5,
  isRecording: false,
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
};

export default ActionInput;
