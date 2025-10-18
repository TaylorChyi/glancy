/**
 * 背景：
 *  - 邮箱绑定/解绑的副作用此前分散在页面组件中，导致逻辑难以复用与测试。
 * 目的：
 *  - 抽象邮箱操作流程，统一处理成功与失败提示，减少页面组件的分支数量。
 * 关键决策与取舍：
 *  - 通过 Hook 暴露命令式操作，保持邮箱模块的可组合性；
 *  - 通知逻辑通过回调上抛，避免对具体 UI 有硬编码依赖。
 * 影响范围：
 *  - Profile 页面与未来其他入口可以直接使用该 Hook 处理邮箱绑定流程。
 * 演进与TODO：
 *  - TODO: 后续若需要多语言埋点，可在回调中新增 telemetry 钩子。
 */
import { useCallback } from "react";
import { resolveEmailErrorMessage } from "./emailErrorMessages.js";

export function useEmailBindingWorkflow({
  emailBinding,
  currentUser,
  notifySuccess,
  notifyFailure,
  t,
}) {
  const requestCode = useCallback(
    async (nextEmail) => {
      if (!nextEmail) {
        notifyFailure(t.emailInputRequired);
        return false;
      }
      try {
        await emailBinding.requestCode(nextEmail);
        notifySuccess(t.emailCodeSent);
        return true;
      } catch (error) {
        console.error(error);
        notifyFailure(resolveEmailErrorMessage(error, t));
        return false;
      }
    },
    [emailBinding, notifyFailure, notifySuccess, t],
  );

  const confirmChange = useCallback(
    async ({ email: nextEmail, code }) => {
      const hadEmailBeforeSubmit = Boolean(currentUser?.email);
      try {
        await emailBinding.confirmChange({ email: nextEmail, code });
        notifySuccess(
          hadEmailBeforeSubmit ? t.emailChangeSuccess : t.emailBindSuccess,
        );
      } catch (error) {
        console.error(error);
        notifyFailure(resolveEmailErrorMessage(error, t));
      }
    },
    [currentUser?.email, emailBinding, notifyFailure, notifySuccess, t],
  );

  const unbind = useCallback(async () => {
    try {
      await emailBinding.unbindEmail();
      emailBinding.startEditing();
      notifySuccess(t.emailUnbindSuccess);
    } catch (error) {
      console.error(error);
      notifyFailure(resolveEmailErrorMessage(error, t));
    }
  }, [emailBinding, notifyFailure, notifySuccess, t]);

  return {
    requestCode,
    confirmChange,
    unbind,
  };
}
