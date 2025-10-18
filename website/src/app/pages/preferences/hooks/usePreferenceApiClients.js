/**
 * 背景：
 *  - 偏好设置页面需要同时与用户、档案、兑换等多个 API 协作，若散落在主 Hook 中会导致依赖难追踪。
 * 目的：
 *  - 聚合偏好设置所需的 API 客户端，输出统一接口，便于领域 Hook 复用。
 * 关键决策与取舍：
 *  - 复用共享层的 useEmailBinding，以保持邮件绑定状态的一致性。
 * 影响范围：
 *  - 偏好设置账户区、兑换区等需要发起网络请求的模块。
 * 演进与TODO：
 *  - 可在此接入断路器或重试策略，以强化网络健壮性。
 */
import useEmailBinding from "@shared/hooks/useEmailBinding.js";
import { useUsersApi } from "@shared/api/users.js";
import { useProfilesApi } from "@shared/api/profiles.js";
import { useRedemptionCodesApi } from "@shared/api/redemptionCodes.js";

export const usePreferenceApiClients = ({ user, setUser }) => {
  const usersApi = useUsersApi();
  const profilesApi = useProfilesApi();
  const redemptionApi = useRedemptionCodesApi();

  const emailBinding = useEmailBinding({
    user,
    onUserUpdate: setUser,
    apiClient: usersApi,
  });

  return {
    emailBinding,
    updateUsernameRequest: usersApi?.updateUsername,
    fetchProfile: profilesApi?.fetchProfile,
    saveProfile: profilesApi?.saveProfile,
    redeemCodeRequest: redemptionApi?.redeem,
  };
};
