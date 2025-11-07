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
