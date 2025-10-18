/**
 * 背景：
 *  - Profile 页面数据初始化逻辑散落在 useEffect 中，缺乏集中描述。
 * 目的：
 *  - 统一抽象初始化流程，明确依赖与副作用边界，降低组件体量。
 * 关键决策与取舍：
 *  - 保持与现有 API 交互一致，通过守卫避免组件卸载后的状态更新；
 *  - 错误提示通过回调传递，便于替换成多通道通知。
 * 影响范围：
 *  - Profile 页面在挂载时的取数逻辑集中在该 Hook，未来可拓展缓存策略。
 * 演进与TODO：
 *  - TODO: 后续可引入 SWR/React Query 接管缓存与重试策略。
 */
import { useEffect } from "react";
import { mapResponseToProfileDetails } from "./profileDetailsModel.js";

export function useProfileBootstrap({
  api,
  currentUser,
  dispatchDetails,
  setPersistedMeta,
  applyAvatar,
  showError,
}) {
  useEffect(() => {
    if (!currentUser) {
      return undefined;
    }
    let active = true;
    api.profiles
      .fetchProfile({ token: currentUser.token })
      .then((data) => {
        if (!active) {
          return;
        }
        dispatchDetails({
          type: "hydrate",
          payload: mapResponseToProfileDetails(data),
        });
        setPersistedMeta({
          dailyWordTarget: data.dailyWordTarget ?? null,
          futurePlan: data.futurePlan ?? null,
        });
        if (data.avatar) {
          applyAvatar(data.avatar);
        }
      })
      .catch((error) => {
        if (!active) {
          return;
        }
        console.error(error);
        showError();
      });
    return () => {
      active = false;
    };
  }, [
    api,
    applyAvatar,
    currentUser,
    dispatchDetails,
    setPersistedMeta,
    showError,
  ]);
}
