/**
 * 背景：
 *  - React Fast Refresh 要求功能模块按职责拆分，否则组件文件混杂逻辑导出会阻断热更新。
 *  - 原 `AuthForm.jsx` 聚合了控制器 Hook 与纯函数工具，难以在其他流程复用。
 * 目的：
 *  - 提供 AuthForm 领域的控制器能力与纯函数工具，供容器组件与测试用例共用。
 * 关键决策与取舍：
 *  - 采用控制器模块（Controller Module）集中管理状态协调逻辑，组件文件仅负责呈现；
 *  - 保持纯函数导出（例如 resolveInitialMethod）以便独立单测，未额外引入类封装以避免增加心智负担。
 * 影响范围：
 *  - AuthForm 组件、其单元测试以及未来可能复用登录策略的业务。
 * 演进与TODO：
 *  - 若后续引入更多登录策略，可在此新增策略模式实现，并通过特性开关切换。
 */
import { useEffect, useMemo, useState } from "react";
import { resolveInitialMethod } from "./authFormPrimitives.js";
import { useFeedbackChannels } from "./authFormFeedback.js";
import {
  composeControllerModel,
  useCodeRequestHandler,
  useSubmitHandler,
  useUnavailableMethodHandler,
} from "./authFormHandlers.js";

const useAuthMethods = ({ formMethods, methodOrder, defaultMethod }) => {
  const availableFormMethods = useMemo(
    () => (Array.isArray(formMethods) ? formMethods : []),
    [formMethods],
  );
  const orderedMethods = useMemo(
    () => (Array.isArray(methodOrder) ? methodOrder : []),
    [methodOrder],
  );
  const [method, setMethod] = useState(() =>
    resolveInitialMethod(availableFormMethods, defaultMethod),
  );

  useEffect(() => {
    const preferredMethod = resolveInitialMethod(
      availableFormMethods,
      defaultMethod,
    );
    setMethod((currentMethod) => {
      if (availableFormMethods.includes(currentMethod)) {
        return currentMethod;
      }
      return preferredMethod;
    });
  }, [availableFormMethods, defaultMethod]);

  return { availableFormMethods, orderedMethods, method, setMethod };
};

const useOtherOptionsLabel = (otherOptionsLabel, t) =>
  useMemo(() => {
    const fallback = t.otherLoginOptions ?? "Other login options";
    const trimmed =
      typeof otherOptionsLabel === "string" ? otherOptionsLabel.trim() : "";
    return trimmed || fallback;
  }, [otherOptionsLabel, t]);

const useToastDismissLabel = (t) =>
  useMemo(() => t.toastDismissLabel || t.close || "Dismiss notification", [t]);

const useAuthFormController = ({
  formMethods,
  methodOrder,
  defaultMethod,
  validateAccount,
  passwordPlaceholder,
  showCodeButton,
  icons,
  otherOptionsLabel,
  placeholders,
  onRequestCode,
  onSubmit,
  t,
}) => {
  const { availableFormMethods, orderedMethods, method, setMethod } =
    useAuthMethods({ formMethods, methodOrder, defaultMethod });
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const feedback = useFeedbackChannels();
  const toastDismissLabel = useToastDismissLabel(t);
  const resolvedOtherOptionsLabel = useOtherOptionsLabel(otherOptionsLabel, t);
  const handleSendCode = useCodeRequestHandler({
    account,
    method,
    onRequestCode,
    setAccount,
    showPopup: feedback.showPopup,
    showToast: feedback.showToast,
    t,
    validateAccount,
  });
  const handleSubmit = useSubmitHandler({
    account,
    method,
    onSubmit,
    password,
    showPopup: feedback.showPopup,
    t,
    validateAccount,
  });
  const onUnavailableMethod = useUnavailableMethodHandler(
    feedback.showPopup,
    t,
  );

  return composeControllerModel({
    account,
    availableFormMethods,
    feedback,
    handleSendCode,
    handleSubmit,
    icons,
    method,
    onUnavailableMethod,
    orderedMethods,
    otherOptionsLabel: resolvedOtherOptionsLabel,
    password,
    passwordPlaceholder,
    placeholders,
    setAccount,
    setMethod,
    setPassword,
    showCodeButton,
    toastDismissLabel,
  });
};

export { useAuthFormController };
export { resolveInitialMethod, sanitizeAccount } from "./authFormPrimitives.js";
export { useFeedbackChannels } from "./authFormFeedback.js";
