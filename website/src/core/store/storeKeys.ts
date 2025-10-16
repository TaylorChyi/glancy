/**
 * 背景：
 *  - 各 Store 以散落常量维护持久化 key，新增模块时容易重复命名导致状态覆盖且难以及时发现。
 * 目的：
 *  - 通过注册表集中描述 Store 与 key 的映射关系，让调用方只依赖受控出口，降低冲突风险并便于检索。
 * 关键决策与取舍：
 *  - 采用 Registry 模式：统一导出描述对象与快捷常量；拒绝继续在各 Store 内硬编码字符串以强化约束；
 *  - 引入运行期重复校验，换取初始化阶段的可观测性，而非在运行中静默覆盖；
 *  - 暂未拆分按平台的存储介质映射，后续如需多端差异可在描述中追加字段。
 * 影响范围：
 *  - 所有依赖持久化 store key 的模块与测试，需改为从此模块获取常量；
 *  - createPersistentStore 的 key 参数类型收窄，编译期即可捕获非法输入。
 * 演进与TODO：
 *  - TODO: 若引入跨端同步策略，可在描述上扩展 schemaVersion、migrations 等字段；
 *  - TODO: 结合遥测补充 store 初始化统计，便于观测真实使用情况。
 */

export type StoreDescriptor = {
  readonly key: string;
  readonly description: string;
};

const STORE_REGISTRY = {
  favorites: {
    key: "favorites",
    description: "收藏夹词条缓存，支撑词条收藏与取消收藏的本地回退。",
  },
  history: {
    key: "searchHistory",
    description: "查询历史列表，承担分页加载与本地保留策略。",
  },
  cookieConsent: {
    key: "cookie-consent",
    description: "Cookie 授权偏好，用于控制登录追踪与提示浮层。",
  },
  dataGovernance: {
    key: "dataGovernance",
    description: "数据治理策略（历史保留窗口、采集开关）配置。",
  },
  settings: {
    key: "settings",
    description: "界面与交互层偏好（语言、渲染模式、聊天模式等）。",
  },
  user: {
    key: "user",
    description: "当前登录用户信息与凭证缓存。",
  },
  voice: {
    key: "ttsVoicePrefs",
    description: "按语言缓存的语音播报偏好。",
  },
  wordCache: {
    key: "wordCache",
    description: "词条版本缓存，支撑离线回显与版本切换。",
  },
} as const satisfies Record<string, StoreDescriptor>;

export type StoreRegistry = typeof STORE_REGISTRY;
export type StoreIdentifier = keyof StoreRegistry;
export type StoreKey = StoreRegistry[StoreIdentifier]["key"];

type StoreDescriptorMap = Map<StoreKey, { id: StoreIdentifier } & StoreDescriptor>;

const descriptorsByKey: StoreDescriptorMap = new Map();

for (const [id, descriptor] of Object.entries(STORE_REGISTRY) as [
  StoreIdentifier,
  StoreDescriptor,
][]) {
  if (descriptorsByKey.has(descriptor.key as StoreKey)) {
    throw new Error(
      `检测到重复的 store key: ${descriptor.key}。请在 storeKeys.ts 中修正唯一性。`,
    );
  }
  descriptorsByKey.set(descriptor.key as StoreKey, { id, ...descriptor });
}

export const STORE_DESCRIPTORS = Object.freeze(STORE_REGISTRY);

export const STORE_KEYS = Object.freeze({
  FAVORITES: STORE_REGISTRY.favorites.key,
  HISTORY: STORE_REGISTRY.history.key,
  COOKIE_CONSENT: STORE_REGISTRY.cookieConsent.key,
  DATA_GOVERNANCE: STORE_REGISTRY.dataGovernance.key,
  SETTINGS: STORE_REGISTRY.settings.key,
  USER: STORE_REGISTRY.user.key,
  VOICE: STORE_REGISTRY.voice.key,
  WORD_CACHE: STORE_REGISTRY.wordCache.key,
} satisfies Record<string, StoreKey>);

/**
 * 意图：按标识符读取 Store 描述，供调试或自动化脚本使用。
 * 输入：Store 标识符。
 * 输出：包含 key 与描述的对象。
 */
export function getStoreDescriptor(id: StoreIdentifier) {
  return STORE_DESCRIPTORS[id];
}

/**
 * 意图：根据持久化 key 反查注册信息，辅助日志与诊断。
 * 输入：store key。
 * 输出：若找到则返回描述，否则返回 null。
 */
export function findStoreDescriptorByKey(key: StoreKey) {
  return descriptorsByKey.get(key) ?? null;
}
