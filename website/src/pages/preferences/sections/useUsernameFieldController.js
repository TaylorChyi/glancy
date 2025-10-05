/**
 * 背景：
 *  - 偏好设置账号分区此前仅提供静态用户名展示，缺乏编辑管道，导致用户需跳转至 Profile 页面完成修改。
 * 目的：
 *  - 以状态模式封装用户名编辑/校验/持久化流程，对外暴露纯数据与事件，使展示组件保持无状态。
 * 关键决策与取舍：
 *  - 选用状态模式（view/edit/saving）统一管理交互分支，替代直接在组件内堆叠条件判断；
 *  - 备选方案为在 AccountSection 内直接使用 useState，但将违背展示/容器分层原则且难以复用，故舍弃。
 * 影响范围：
 *  - AccountSection 的字段渲染将依赖本 Hook 返回的受控结构；usePreferenceSections 需注入持久化实现。
 * 演进与TODO：
 *  - TODO: 后续若接入实时用户名占用校验，可在此扩展 debounce 与 API 校验策略。
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { validateUsername } from "@/utils/validators.js";

const VIEW_STATE = "view";
const EDIT_STATE = "edit";
const SAVING_STATE = "saving";

/**
 * 意图：
 *  - 管理用户名字段的查看/编辑/保存状态，暴露展示层所需的最小属性集。
 * 输入：
 *  - username: 当前用户名原值；
 *  - fallbackValue: 展示占位文案；
 *  - changeLabel/saveLabel: 两态按钮文案；
 *  - placeholder: 输入框占位符；
 *  - messages: 校验与错误提示文案集合；
 *  - persistUsername: 异步保存函数，返回成功后的用户名。
 * 输出：
 *  - 包含展示值、编辑态草稿、错误状态与触发器的对象。
 * 流程：
 *  1) 根据外部用户名同步确认态与展示值；
 *  2) view→edit 时重置草稿与错误；
 *  3) edit→saving 前执行本地校验，通过后调用持久化函数；
 *  4) 保存成功回到 view 状态，失败回退 edit 并展示错误。
 * 错误处理：
 *  - 本地校验失败直接返回提示；
 *  - persistUsername 抛出的 409 视为占用冲突，其余归类为通用错误。
 * 复杂度：
 *  - 时间：O(1)；空间：O(1)。
 */
function useUsernameFieldController({
  username,
  fallbackValue,
  changeLabel,
  saveLabel,
  placeholder,
  messages,
  persistUsername,
}) {
  const normalizedUsername =
    typeof username === "string" ? username : username === undefined || username === null ? "" : String(username);
  const [state, setState] = useState(VIEW_STATE);
  const [confirmedValue, setConfirmedValue] = useState(normalizedUsername);
  const [draftValue, setDraftValue] = useState(normalizedUsername);
  const [errorMessage, setErrorMessage] = useState("");
  const externalValueRef = useRef(normalizedUsername);

  useEffect(() => {
    if (externalValueRef.current === normalizedUsername) {
      return;
    }
    externalValueRef.current = normalizedUsername;
    if (state !== VIEW_STATE) {
      return;
    }
    setConfirmedValue(normalizedUsername);
    setDraftValue(normalizedUsername);
    setErrorMessage("");
  }, [normalizedUsername, state]);

  const displayValue = useMemo(() => {
    const trimmed = confirmedValue.trim();
    return trimmed.length > 0 ? trimmed : fallbackValue;
  }, [confirmedValue, fallbackValue]);

  const buttonLabel = state === VIEW_STATE ? changeLabel : saveLabel;
  const isSaving = state === SAVING_STATE;

  const handleChange = useCallback(
    (event) => {
      if (typeof event?.target?.value === "string") {
        setDraftValue(event.target.value);
      } else if (typeof event === "string") {
        setDraftValue(event);
      }
      if (errorMessage) {
        setErrorMessage("");
      }
    },
    [errorMessage],
  );

  const resolveValidationMessage = useCallback(
    (candidate) => {
      if (!candidate) {
        return messages.required;
      }
      if (!validateUsername(candidate)) {
        return messages.invalid;
      }
      return "";
    },
    [messages.invalid, messages.required],
  );

  const handleSubmit = useCallback(async () => {
    if (state === VIEW_STATE) {
      setState(EDIT_STATE);
      setDraftValue(confirmedValue);
      setErrorMessage("");
      return;
    }

    if (isSaving) {
      return;
    }

    const trimmed = draftValue.trim();
    const validation = resolveValidationMessage(trimmed);
    if (validation) {
      setErrorMessage(validation);
      return;
    }

    if (trimmed === confirmedValue.trim()) {
      setState(VIEW_STATE);
      setErrorMessage("");
      setDraftValue(trimmed);
      return;
    }

    setState(SAVING_STATE);
    try {
      const nextUsername = await persistUsername(trimmed);
      const normalizedNext =
        typeof nextUsername === "string"
          ? nextUsername
          : nextUsername === undefined || nextUsername === null
          ? ""
          : String(nextUsername);
      setConfirmedValue(normalizedNext);
      setDraftValue(normalizedNext);
      setErrorMessage("");
      setState(VIEW_STATE);
    } catch (error) {
      if (error?.status === 409) {
        setErrorMessage(messages.conflict);
      } else {
        setErrorMessage(messages.generic);
      }
      setState(EDIT_STATE);
    }
  }, [
    state,
    isSaving,
    draftValue,
    resolveValidationMessage,
    confirmedValue,
    persistUsername,
    messages.conflict,
    messages.generic,
  ]);

  return {
    displayValue,
    controller: {
      mode: state,
      draftValue,
      placeholder,
      buttonLabel,
      isBusy: isSaving,
      errorMessage,
      onChange: handleChange,
      onSubmit: handleSubmit,
    },
  };
}

export default useUsernameFieldController;
