/**
 * 背景：
 *  - 账号页面的用户名输入仅依赖通用 EditableField，无法区分查看/编辑/保存状态，导致交互缺乏即时校验反馈。
 * 目的：
 *  - 通过显式的状态机管理用户名编辑流程，并提供语义化的错误提示与样式钩子。
 * 关键决策与取舍：
 *  - 采用有限状态机（view/edit/saving）搭配 useReducer 实现状态模式，避免在组件内散落多组 useState；
 *  - 拒绝直接复用 EditableField，以免污染其它字段逻辑，后续如需扩展可通过策略模式注入更多校验规则。
 * 影响范围：
 *  - Profile 页面用户名编辑交互；
 *  - 用户上下文在用户名更新后同步刷新。
 * 演进与TODO：
 *  - TODO: 后续若引入服务端节流或自动保存，可在状态机中增加 debouncing/remote-validating 分支。
 */
import { useEffect, useId, useReducer } from "react";
import PropTypes from "prop-types";
import styles from "./UsernameEditor.module.css";
import {
  validateUsername,
  USERNAME_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
} from "@/utils/validators.js";

const MODES = Object.freeze({
  VIEW: "view",
  EDIT: "edit",
  SAVING: "saving",
});

const ACTIONS = Object.freeze({
  SYNC_VALUE: "SYNC_VALUE",
  START_EDIT: "START_EDIT",
  CHANGE: "CHANGE",
  SUBMIT_START: "SUBMIT_START",
  SUBMIT_SUCCESS: "SUBMIT_SUCCESS",
  SUBMIT_FAILURE: "SUBMIT_FAILURE",
});

function createInitialState(username = "") {
  const safeValue = username ?? "";
  return {
    mode: MODES.VIEW,
    value: safeValue,
    draft: safeValue,
    error: null,
  };
}

function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.SYNC_VALUE: {
      if (state.mode !== MODES.VIEW) return state;
      const nextValue = action.value ?? "";
      if (nextValue === state.value) return state;
      return { ...state, value: nextValue, draft: nextValue };
    }
    case ACTIONS.START_EDIT:
      if (state.mode === MODES.SAVING) return state;
      return { ...state, mode: MODES.EDIT, draft: state.value, error: null };
    case ACTIONS.CHANGE:
      if (state.mode === MODES.VIEW) return state;
      return { ...state, draft: action.value, error: null };
    case ACTIONS.SUBMIT_START:
      return { ...state, mode: MODES.SAVING, error: null };
    case ACTIONS.SUBMIT_SUCCESS: {
      const nextValue = action.value ?? "";
      return {
        mode: MODES.VIEW,
        value: nextValue,
        draft: nextValue,
        error: null,
      };
    }
    case ACTIONS.SUBMIT_FAILURE:
      return {
        ...state,
        mode: MODES.EDIT,
        error: action.error ?? null,
      };
    default:
      return state;
  }
}

function resolveErrorMessage(t, error) {
  if (!error) return "";
  if (typeof error.message === "string" && error.message.trim()) {
    return error.message;
  }
  switch (error.code) {
    case "empty":
      return t.usernameValidationEmpty;
    case "too-short":
      return t.usernameValidationTooShort.replace(
        "{{min}}",
        String(USERNAME_MIN_LENGTH),
      );
    case "too-long":
      return t.usernameValidationTooLong.replace(
        "{{max}}",
        String(USERNAME_MAX_LENGTH),
      );
    default:
      return t.usernameUpdateFailed;
  }
}

function UsernameEditor({
  username,
  className = "",
  inputClassName = "",
  buttonClassName = "",
  onSubmit,
  onSuccess,
  onFailure,
  t,
}) {
  const [state, dispatch] = useReducer(
    reducer,
    username ?? "",
    createInitialState,
  );
  const controlId = useId();
  const messageId = useId();

  const { mode, value, draft, error } = state;

  useEffect(() => {
    dispatch({ type: ACTIONS.SYNC_VALUE, value: username ?? "" });
  }, [username]);

  const handleChange = (event) => {
    dispatch({ type: ACTIONS.CHANGE, value: event.target.value });
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && mode !== MODES.VIEW) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    const { valid, code, normalized } = validateUsername(draft);
    if (!valid) {
      dispatch({ type: ACTIONS.SUBMIT_FAILURE, error: { code } });
      return;
    }

    if (typeof onSubmit !== "function") {
      dispatch({ type: ACTIONS.SUBMIT_SUCCESS, value: normalized });
      return;
    }

    dispatch({ type: ACTIONS.SUBMIT_START });
    try {
      const result = await onSubmit(normalized);
      const nextValue = result ?? normalized;
      dispatch({ type: ACTIONS.SUBMIT_SUCCESS, value: nextValue });
      onSuccess?.(nextValue);
    } catch (err) {
      const message =
        typeof err?.message === "string" && err.message.trim()
          ? err.message
          : undefined;
      dispatch({
        type: ACTIONS.SUBMIT_FAILURE,
        error: message ? { message } : { code: "unknown" },
      });
      onFailure?.(err);
    }
  };

  const handleButtonClick = () => {
    if (mode === MODES.VIEW) {
      dispatch({ type: ACTIONS.START_EDIT });
    } else if (mode === MODES.EDIT || mode === MODES.SAVING) {
      handleSubmit();
    }
  };

  const containerClassName = [styles.container, className]
    .filter(Boolean)
    .join(" ");
  const inputClassNames = [
    styles.input,
    inputClassName,
    error ? styles["input-invalid"] : "",
  ]
    .filter(Boolean)
    .join(" ");
  const buttonClassNames = [styles.button, buttonClassName]
    .filter(Boolean)
    .join(" ");

  const errorMessage = resolveErrorMessage(t, error);
  const buttonLabel =
    mode === MODES.VIEW
      ? t.changeUsernameButton
      : mode === MODES.SAVING
        ? t.saving
        : t.saveUsernameButton;

  const inputValue = mode === MODES.VIEW ? value : draft;
  const isButtonDisabled = mode === MODES.SAVING;

  return (
    <div className={containerClassName}>
      <div className={styles.controls}>
        <input
          id={controlId}
          className={inputClassNames}
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={t.usernamePlaceholder}
          disabled={mode === MODES.VIEW}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? messageId : undefined}
        />
        <button
          type="button"
          className={buttonClassNames}
          onClick={handleButtonClick}
          disabled={isButtonDisabled}
        >
          {buttonLabel}
        </button>
      </div>
      {errorMessage ? (
        <p className={styles["error-message"]} id={messageId} role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}

UsernameEditor.propTypes = {
  username: PropTypes.string,
  className: PropTypes.string,
  inputClassName: PropTypes.string,
  buttonClassName: PropTypes.string,
  onSubmit: PropTypes.func,
  onSuccess: PropTypes.func,
  onFailure: PropTypes.func,
  t: PropTypes.shape({
    usernamePlaceholder: PropTypes.string.isRequired,
    changeUsernameButton: PropTypes.string.isRequired,
    saveUsernameButton: PropTypes.string.isRequired,
    saving: PropTypes.string.isRequired,
    usernameValidationEmpty: PropTypes.string.isRequired,
    usernameValidationTooShort: PropTypes.string.isRequired,
    usernameValidationTooLong: PropTypes.string.isRequired,
    usernameUpdateFailed: PropTypes.string.isRequired,
  }).isRequired,
};

export default UsernameEditor;
