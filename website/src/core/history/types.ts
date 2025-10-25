/**
 * 背景：历史记录 Store 将常量、DTO 类型与领域模型散落在单一文件中，导致职责耦合和未来演进困难。
 * 目的：集中定义历史记录领域的常量与数据契约，作为 Store 与策略模块的稳定依赖层。
 * 关键决策与取舍：采用独立的类型模块而非直接在 Store 中声明，避免循环引用；保留与后端 DTO 的显式区分以便未来拆换数据源。
 * 影响范围：historyStore、归一化策略与保留策略均改为引用本文件导出的常量与类型。
 * 演进与TODO：后续可在此扩展分页游标、过滤条件等领域对象，或引入 io-ts 等运行时校验。
 */

export const HISTORY_PAGE_SIZE = 20;
export const REMOTE_HISTORY_PAGE_LIMIT = 50;

export const HISTORY_PAGINATION_MODES = Object.freeze({
  RESET: "reset",
  APPEND: "append",
} as const);

export type PaginationMode =
  (typeof HISTORY_PAGINATION_MODES)[keyof typeof HISTORY_PAGINATION_MODES];

export type HistoryVersionPayload = {
  id?: string | number | null;
  term?: string | null;
  metadata?: { term?: string | null } | null;
  createdAt?: string | null;
};

export type SearchRecordDto = {
  id?: string | number | null;
  term: string;
  language?: string | null;
  flavor?: string | null;
  createdAt?: string | null;
  metadata?: { term?: string | null } | null;
  versions?: HistoryVersionPayload[] | null;
};

export interface HistoryVersion {
  id: string;
  createdAt: string | null;
}

export interface HistoryItem {
  /**
   * 搜索记录在服务端的主键，用于删除/收藏等变更操作。
   * 老版本缓存可能不存在该字段，因此需在命令中做降级处理。
   */
  recordId: string | null;
  term: string;
  language: string;
  flavor: string;
  termKey: string;
  createdAt: string | null;
  versions: HistoryVersion[];
  latestVersionId: string | null;
}
