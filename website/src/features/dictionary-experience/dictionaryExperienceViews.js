/**
 * 背景：
 *  - 词典体验在演进中引入了历史、收藏等扩展视图，原有布尔状态逐渐膨胀。
 * 目的：
 *  - 以集中枚举定义主视图状态，为状态模式转型奠定稳定的语义边界。
 * 关键决策与取舍：
 *  - 选择冻结的枚举对象并提供语义化判定函数，避免散落的字符串常量造成错拼；
 *    相比引入第三方状态机库，更契合当前轻量场景且便于未来渐进增强。
 * 影响范围：
 *  - DictionaryExperience 及其关联 Hook 均依赖此枚举统一推导视图与派生逻辑。
 * 演进与TODO：
 *  - 若后续新增更多子视图，可在此扩展枚举并为新视图补充判定函数或元数据。
 */
export const DICTIONARY_EXPERIENCE_VIEWS = Object.freeze({
  DICTIONARY: "dictionary",
  HISTORY: "history",
});

export const isDictionaryView = (view) =>
  view === DICTIONARY_EXPERIENCE_VIEWS.DICTIONARY;

export const isHistoryView = (view) =>
  view === DICTIONARY_EXPERIENCE_VIEWS.HISTORY;
