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
  favorite?: boolean | null;
};

export type SearchRecordDto = {
  id?: string | number | null;
  term: string;
  language?: string | null;
  flavor?: string | null;
  createdAt?: string | null;
  favorite?: boolean | null;
  metadata?: { term?: string | null } | null;
  versions?: HistoryVersionPayload[] | null;
};

export interface HistoryVersion {
  id: string;
  createdAt: string | null;
  favorite: boolean;
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
  favorite: boolean;
  versions: HistoryVersion[];
  latestVersionId: string | null;
}
