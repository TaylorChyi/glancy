/**
 * 背景：
 *  - useProfilePageModel 需聚合多条交互流程，若直接内联将再次触发体量超限。
 * 目的：
 *  - 将用户名、邮箱、头像与保存流程拆分至独立 Hook，供页面模型按需组合。
 * 关键决策与取舍：
 *  - 组合模式：集中暴露 useProfileWorkflows，内部保持细粒度 Hook，便于单测与扩展；
 *  - 复用既有副作用实现，避免在重构阶段引入额外 API 变动。
 * 影响范围：
 *  - Profile 页面模型装配逻辑下沉至本文件，后续扩展新的工作流只需在此添加即可。
 * 演进与TODO：
 *  - TODO: 后续可引入特性开关隔离实验性流程，减少对主流程的侵入。
 */
import { useCallback } from "react";
import { useEmailBinding } from "@shared/hooks";
import { useAvatarEditorController } from "./avatarEditorController.js";
import { useEmailBindingWorkflow } from "./useEmailBindingWorkflow.js";
import { useProfileSaveHandler } from "./useProfileSaveHandler.js";
import { useProfileBootstrap } from "./useProfileBootstrap.js";

function useUsernameWorkflow({ api, currentUser, setUser, popup, t }) {
  const submit = useCallback(
    async (nextUsername) => {
      if (!currentUser) {
        throw new Error("User session is unavailable");
      }
      const response = await api.users.updateUsername({
        userId: currentUser.id,
        username: nextUsername,
        token: currentUser.token,
      });
      const updatedUsername = response.username ?? nextUsername;
      setUser({ ...currentUser, username: updatedUsername });
      popup.show(t.usernameUpdateSuccess);
      return updatedUsername;
    },
    [api, currentUser, popup, setUser, t.usernameUpdateSuccess],
  );
  const handleFailure = useCallback((error) => {
    console.error(error);
  }, []);
  return { onSubmit: submit, onFailure: handleFailure };
}

function useProfileInitialLoad({
  api,
  currentUser,
  detailsState,
  setPersistedMeta,
  applyAvatar,
  popup,
  t,
}) {
  useProfileBootstrap({
    api,
    currentUser,
    dispatchDetails: detailsState.dispatchDetails,
    setPersistedMeta,
    applyAvatar,
    showError: () => popup.show(t.fail),
  });
}

function useProfileControllers({ api, currentUser, setUser, popup, t }) {
  const usernameHandlers = useUsernameWorkflow({
    api,
    currentUser,
    setUser,
    popup,
    t,
  });
  const avatarController = useAvatarEditorController({
    api,
    currentUser,
    setUser,
    t,
    notifyFailure: () => popup.show(t.fail),
  });
  const emailBinding = useEmailBinding({
    user: currentUser,
    onUserUpdate: setUser,
  });
  const emailWorkflow = useEmailBindingWorkflow({
    emailBinding,
    currentUser,
    notifySuccess: popup.show,
    notifyFailure: popup.show,
    t,
  });
  return {
    usernameHandlers,
    avatarController,
    emailBinding,
    emailWorkflow,
  };
}

function useProfilePersistence({
  api,
  currentUser,
  detailsState,
  phoneState,
  setUser,
  persistedMeta,
  popup,
  t,
}) {
  const { isSaving, handleSave } = useProfileSaveHandler({
    api,
    currentUser,
    details: detailsState.details,
    phone: phoneState.phone,
    setUser,
    persistedMeta,
    showPopup: popup.show,
    t,
  });
  return { isSaving, handleSave };
}

function useProfileBootstrapper({
  api,
  currentUser,
  detailsState,
  setPersistedMeta,
  avatarController,
  popup,
  t,
}) {
  useProfileInitialLoad({
    api,
    currentUser,
    detailsState,
    setPersistedMeta,
    applyAvatar: avatarController.applyServerAvatar,
    popup,
    t,
  });
}

export function useProfileWorkflows({
  api,
  currentUser,
  setUser,
  popup,
  t,
  detailsState,
  phoneState,
  persistedMeta,
  setPersistedMeta,
}) {
  const controllers = useProfileControllers({
    api,
    currentUser,
    setUser,
    popup,
    t,
  });
  const persistence = useProfilePersistence({
    api,
    currentUser,
    detailsState,
    phoneState,
    setUser,
    persistedMeta,
    popup,
    t,
  });
  useProfileBootstrapper({
    api,
    currentUser,
    detailsState,
    setPersistedMeta,
    avatarController: controllers.avatarController,
    popup,
    t,
  });
  return {
    ...controllers,
    ...persistence,
  };
}
