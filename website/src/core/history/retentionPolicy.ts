/**
 * 背景：历史数据的保留策略直接写在 store 中，导致逻辑难以复用且缺乏扩展点。
 * 目的：引入策略（Strategy）模式，将不同保留策略抽象为可组合的类，当前实现为按天数的时间阈值策略。
 * 关键决策与取舍：使用策略类而非纯函数，便于未来在不修改 store 的情况下扩展“按数量”“按标签”等策略；保持无状态构造，避免全局副作用。
 * 影响范围：historyStore 的保留流程改为委托策略执行，并获取需要同步删除的记录 ID。
 * 演进与TODO：后续可实现策略组合器或引入特性开关以切换策略实现。
 */

import type { HistoryItem } from "./types.js";

export interface RetentionEvaluation {
  retained: HistoryItem[];
  expired: HistoryItem[];
  remoteRecordIds: Set<string>;
}

export class HistoryRetentionPolicy {
  private constructor(private readonly cutoffTimestamp: number) {}

  static forDays(
    days: number | null | undefined,
    now: number = Date.now(),
  ): HistoryRetentionPolicy | null {
    if (days == null || days <= 0) {
      return null;
    }
    const cutoff = now - days * 24 * 60 * 60 * 1000;
    return new HistoryRetentionPolicy(cutoff);
  }

  evaluate(history: HistoryItem[]): RetentionEvaluation {
    const expired: HistoryItem[] = [];
    const retained: HistoryItem[] = [];
    const remoteRecordIds = new Set<string>();

    history.forEach((item) => {
      if (!item.createdAt) {
        retained.push(item);
        return;
      }
      const timestamp = Date.parse(item.createdAt);
      if (Number.isNaN(timestamp) || timestamp >= this.cutoffTimestamp) {
        retained.push(item);
        return;
      }
      expired.push(item);
      if (item.recordId) {
        remoteRecordIds.add(item.recordId);
      } else if (item.latestVersionId) {
        remoteRecordIds.add(item.latestVersionId);
      }
    });

    return { retained, expired, remoteRecordIds };
  }
}
