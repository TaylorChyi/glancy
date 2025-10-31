/**
 * 背景：
 *  - 样式拆分后需要通过门面对象聚合多份 CSS Module，并兼顾 Jest 中的 identity-obj-proxy 行为。
 * 目的：
 *  - 提供统一的只读代理，按顺序回退到各个模块检索 className，避免遍历展开导致 mock 丢失键值。
 * 关键决策与取舍：
 *  - 选择使用 Proxy 拦截属性访问而非对象展开，确保在真实环境与测试代理中均能按需解析；
 *  - 保持返回值冻结，防止运行时修改聚合结果。替代方案是返回普通对象，但无法拦截 identity-obj-proxy。
 * 影响范围：
 *  - 所有依赖门面聚合的组件与测试。
 * 演进与TODO：
 *  - TODO: 可扩展为记录访问轨迹或输出缺失警告，辅助样式迁移。
 */
const isSymbolKey = (key) => typeof key === "symbol";

const collectOwnKeys = (modules) => {
  const collected = new Set();
  modules.forEach((mod) => {
    if (!mod) {
      return;
    }
    Reflect.ownKeys(mod).forEach((key) => {
      collected.add(key);
    });
  });
  return collected;
};

const findDescriptor = (modules, key) => {
  for (const mod of modules) {
    if (!mod) {
      continue;
    }
    const descriptor = Object.getOwnPropertyDescriptor(mod, key);
    if (descriptor) {
      return descriptor;
    }
    if (key in mod) {
      const value = mod[key];
      return {
        configurable: true,
        enumerable: true,
        value,
        writable: false,
      };
    }
  }
  return undefined;
};

const resolveValue = (modules, key) => {
  for (const mod of modules) {
    if (!mod) {
      continue;
    }
    const value = mod[key];
    if (value !== undefined) {
      return value;
    }
  }
  return undefined;
};

const createStyleFacade = (modules) => {
  const moduleChain = modules.filter(Boolean);
  const handler = {
    get(target, key) {
      if (isSymbolKey(key)) {
        return target[key];
      }
      return resolveValue(moduleChain, key);
    },
    has(target, key) {
      if (isSymbolKey(key)) {
        return key in target;
      }
      return moduleChain.some((mod) => mod && key in mod);
    },
    ownKeys() {
      return [...collectOwnKeys(moduleChain)];
    },
    getOwnPropertyDescriptor(target, key) {
      if (isSymbolKey(key)) {
        return Object.getOwnPropertyDescriptor(target, key);
      }
      return findDescriptor(moduleChain, key);
    },
  };

  const proxy = new Proxy({}, handler);
  return Object.freeze(proxy);
};

export default createStyleFacade;
