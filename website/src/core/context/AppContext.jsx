import { createContext, useContext } from "react";
// 直接依赖具体 Store 模块，避免通过桶状导出引入的循环依赖在构建阶段打散到不同 chunk
// 导致执行顺序错乱。此举保持上下文与状态容器之间的一对一关系，后续如需扩展可考虑
// 通过依赖注入集中管理。
import { useUserStore } from "@core/store/userStore.ts";
import { useHistoryStore } from "@core/store/historyStore.ts";

// eslint-disable-next-line react-refresh/only-export-components
export const AppContext = createContext({
  user: null,
  history: null,
});

export function AppProvider({ children }) {
  const user = useUserStore();
  const history = useHistoryStore();

  return (
    <AppContext.Provider value={{ user, history }}>
      {children}
    </AppContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useUser = () => useContext(AppContext).user;
// eslint-disable-next-line react-refresh/only-export-components
export const useHistory = () => useContext(AppContext).history;
