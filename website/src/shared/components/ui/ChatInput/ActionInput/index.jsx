/**
 * 背景：
 *  - 历史实现将输入框逻辑、布局与动作绑定于同一组件，阻碍长期的交互演进与测试拆分。
 * 目的：
 *  - 通过容器-视图-行为三段式拆分，将副作用与布局隔离，便于后续按需拓展策略或替换视图。
 * 关键决策与取舍：
 *  - 采用 Hook 承载行为，容器仅负责依赖注入，展示层纯粹负责结构渲染，遵循组合优先原则。
 *  - 放弃在容器内操作 DOM，所有副作用统一交由 Hook 管理，确保易测性与可维护性。
 * 影响范围：
 *  - ChatInput 输入模块的依赖关系及其单测结构。
 * 演进与TODO：
 *  - 若引入更多状态策略，可在 Hook 中扩展动作区状态机并通过容器下发。
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
  onFocusChange: PropTypes.func,
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
  onFocusChange: undefined,
};

export default ActionInput;
