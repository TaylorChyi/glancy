import { useMemo } from "react";
import { useUser } from "@core/context";

/**
 * 统一管理侧边栏主导航的权限判定。
 * 当前站点的词典与收藏夹均对所有用户开放，
 * 但仍提取成 Hook 以便未来根据会员策略动态裁剪。
 */
export function useNavAccess() {
  const { user } = useUser();

  return useMemo(() => {
    const hasUser = Boolean(user);
    return {
      hasUser,
      canAccessDictionary: true,
      canAccessLibrary: true,
    };
  }, [user]);
}

export default useNavAccess;
