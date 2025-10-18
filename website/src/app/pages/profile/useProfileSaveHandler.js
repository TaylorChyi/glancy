/**
 * 背景：
 *  - Profile 保存逻辑原先耦合在页面组件中，难以复用且影响结构化 lint。
 * 目的：
 *  - 封装保存流程，统一处理手机号更新与详情提交，减少页面组件的副作用。
 * 关键决策与取舍：
 *  - 依旧串行调用现有 API，但通过 Promise.all 聚合，确保最小改动；
 *  - 利用外部传入的提示函数避免对 UI 的硬编码依赖，便于测试。
 * 影响范围：
 *  - Profile 页面提交逻辑迁移至 Hook，未来其他入口复用成本更低。
 * 演进与TODO：
 *  - TODO: 后续可在此引入乐观更新或错误恢复策略。
 */
import { useCallback, useState } from "react";
import { mapProfileDetailsToRequest } from "./profileDetailsModel.js";

async function persistProfile({
  api,
  currentUser,
  details,
  phone,
  persistedMeta,
}) {
  const nextUser = { ...currentUser };
  let hasIdentityUpdates = false;
  const tasks = [];

  if (phone !== currentUser.phone) {
    tasks.push(
      api.users
        .updateContact({
          userId: currentUser.id,
          email: currentUser.email,
          phone,
          token: currentUser.token,
        })
        .then(({ phone: updatedPhone }) => {
          nextUser.phone = updatedPhone;
          hasIdentityUpdates = true;
        }),
    );
  }

  const profilePayload = mapProfileDetailsToRequest(details);
  tasks.push(
    api.profiles.saveProfile({
      token: currentUser.token,
      profile: {
        ...profilePayload,
        dailyWordTarget: persistedMeta.dailyWordTarget,
        futurePlan: persistedMeta.futurePlan,
      },
    }),
  );

  await Promise.all(tasks);
  return { hasIdentityUpdates, nextUser };
}

export function useProfileSaveHandler({
  api,
  currentUser,
  details,
  phone,
  setUser,
  persistedMeta,
  showPopup,
  t,
}) {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = useCallback(
    async (event) => {
      event.preventDefault();
      if (!currentUser) {
        return;
      }
      setIsSaving(true);
      try {
        const { hasIdentityUpdates, nextUser } = await persistProfile({
          api,
          currentUser,
          details,
          phone,
          persistedMeta,
        });
        if (hasIdentityUpdates) {
          setUser(nextUser);
        }
        showPopup(t.updateSuccess);
      } catch (error) {
        console.error(error);
        showPopup(t.fail);
      } finally {
        setIsSaving(false);
      }
    },
    [
      api,
      currentUser,
      details,
      persistedMeta,
      phone,
      setUser,
      showPopup,
      t.fail,
      t.updateSuccess,
    ],
  );

  return { isSaving, handleSave };
}
