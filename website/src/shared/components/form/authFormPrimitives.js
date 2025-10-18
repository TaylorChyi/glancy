/**
 * 背景：
 *  - AuthForm 组件需要独立的纯函数以支持多处复用与精细化单元测试。
 * 目的：
 *  - 提供与登录策略选择相关的无副作用工具，避免与 React Hook 耦合。
 * 关键决策与取舍：
 *  - 保持函数纯度，便于后续引入策略模式或缓存；
 *  - 不在此处处理副作用，确保在 SSR 与客户端场景下行为一致。
 * 影响范围：
 *  - AuthForm 控制器逻辑、单测及潜在的复用方。
 * 演进与TODO：
 *  - 未来可引入配置驱动的优先级矩阵，而非硬编码常量顺序。
 */
const USERNAME_METHOD = "username";

const resolveInitialMethod = (methods, preferredMethod = null) => {
  const availableMethods = Array.isArray(methods) ? methods : [];

  if (availableMethods.length === 0) {
    return preferredMethod ?? null;
  }

  if (availableMethods.includes(USERNAME_METHOD)) {
    return USERNAME_METHOD;
  }

  if (preferredMethod && availableMethods.includes(preferredMethod)) {
    return preferredMethod;
  }

  return availableMethods[0] ?? preferredMethod ?? null;
};

const sanitizeAccount = (value) =>
  typeof value === "string" ? value.trim() : value;

export { resolveInitialMethod, sanitizeAccount };
