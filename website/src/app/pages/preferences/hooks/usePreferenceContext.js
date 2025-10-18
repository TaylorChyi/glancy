/**
 * 背景：
 *  - 偏好设置页面频繁读取语言与用户上下文，若分散在各 Hook 中会导致重复逻辑。
 * 目的：
 *  - 提供统一入口抽象，聚合翻译函数与用户写入能力，方便后续扩展（例如特性开关）。
 * 关键决策与取舍：
 *  - 维持纯读取逻辑，不引入额外副作用，确保可在任意组合 Hook 中安全复用。
 * 影响范围：
 *  - 所有依赖偏好设置上下文的 Hook。
 * 演进与TODO：
 *  - 后续可扩展返回值，例如注入 feature flag 或 A/B 试验参数。
 */
import { useLanguage, useUser } from "@core/context";

export const usePreferenceContext = () => {
  const { t } = useLanguage();
  const userStore = useUser();
  const { user, setUser } = userStore ?? {};

  return { translations: t, user, setUser };
};
