/**
 * 背景：
 *  - UsernameEditor 的视图模型（类名组合、按钮标签、错误展示）原先与控制器逻辑混杂；
 *  - lint 迁移要求拆分大文件，因此将纯视图派生拆出独立模块。
 * 目的：
 *  - 基于状态机输出与文案表构建视图所需的全部属性集合；
 *  - 提供统一的 actionDescriptor，供 onResolveAction 等外部调用方消费。
 * 关键决策与取舍：
 *  - 使用组合函数保证类名、属性对象的生成顺序明确，可在测试中直接断言；
 *  - 通过 resolveUsernameErrorMessage 复用错误映射逻辑，避免重复维护阈值。
 * 影响范围：
 *  - UsernameEditor 控制器 Hook 与相关测试；
 *  - 未来若扩展更多展示字段，可在此集中修改。
 * 演进与TODO：
 *  - 若引入按钮图标或多动作支持，可在返回结果中新增描述字段。
 */
import styles from "./UsernameEditor.module.css";
import { UsernameEditorModes } from "./usernameEditorState.js";
import { resolveUsernameErrorMessage } from "./usernameErrorResolver.js";

const composeClassName = (...parts) => parts.filter(Boolean).join(" ");

const buildButtonLabel = (t, mode) => {
  if (mode === UsernameEditorModes.VIEW) {
    return t.changeUsernameButton;
  }
  if (mode === UsernameEditorModes.SAVING) {
    return t.saving;
  }
  return t.saveUsernameButton;
};

const resolveViewValue = (mode, value, emptyDisplayValue) => {
  if (mode !== UsernameEditorModes.VIEW) {
    return value;
  }
  if (!value || value.trim().length === 0) {
    return emptyDisplayValue ?? "";
  }
  return value;
};

const buildInputProps = ({
  controlId,
  messageId,
  mode,
  error,
  value,
  t,
  inputRef,
  handlers,
  inputClassName,
}) => ({
  id: controlId,
  ref: inputRef,
  className: composeClassName(
    styles.input,
    inputClassName,
    error ? styles["input-invalid"] : "",
  ),
  value,
  onChange: handlers.handleChange,
  onKeyDown: handlers.handleKeyDown,
  onBlur: handlers.handleBlur,
  placeholder: t.usernamePlaceholder,
  disabled: mode === UsernameEditorModes.VIEW,
  "aria-invalid": error ? "true" : "false",
  "aria-describedby": error ? messageId : undefined,
});

const buildButtonProps = ({ buttonClassName, handlers, mode }) => ({
  type: "button",
  className: composeClassName(styles.button, buttonClassName),
  onClick: handlers.handleButtonClick,
  disabled: mode === UsernameEditorModes.SAVING,
});

const buildErrorProps = (message, messageId) =>
  message
    ? {
        className: styles["error-message"],
        id: messageId,
        role: "alert",
        message,
      }
    : null;

const createActionDescriptor = (label, handlers, mode) => ({
  label,
  onClick: handlers.handleButtonClick,
  disabled: mode === UsernameEditorModes.SAVING,
  mode,
});

export const composeUsernameViewModel = ({
  mode,
  value,
  draft,
  error,
  emptyDisplayValue,
  className,
  inputClassName,
  buttonClassName,
  t,
  inputRef,
  handlers,
  controlId,
  messageId,
  renderInlineAction,
}) => {
  const viewValue = resolveViewValue(mode, value, emptyDisplayValue);
  const inputValue = mode === UsernameEditorModes.VIEW ? viewValue : draft;
  const buttonLabel = buildButtonLabel(t, mode);
  const errorMessage = resolveUsernameErrorMessage(t, error);

  return {
    layout: {
      container: composeClassName(styles.container, className),
      controls: styles.controls,
    },
    inputProps: buildInputProps({
      controlId,
      messageId,
      mode,
      error,
      value: inputValue,
      t,
      inputRef,
      handlers,
      inputClassName,
    }),
    buttonProps: buildButtonProps({
      buttonClassName,
      handlers,
      mode,
    }),
    buttonLabel,
    shouldRenderButton: renderInlineAction,
    errorProps: buildErrorProps(errorMessage, messageId),
    actionDescriptor: createActionDescriptor(buttonLabel, handlers, mode),
  };
};
