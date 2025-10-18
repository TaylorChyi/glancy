/**
 * 背景：
 *  - 保留策略执行需剔除过期记录、清理缓存并同步远端删除。
 * 目的：
 *  - 封装为独立命令，方便后续支持多策略或调度。
 */

import { HistoryRetentionPolicy } from "@core/history/index.ts";
import type { User } from "../../userStore.ts";
import type {
  HistoryStoreContext,
  HistoryStoreDependencies,
} from "../contracts.ts";
import { HistoryPaginationCoordinator } from "../historyPaginationCoordinator.ts";
import { HistoryErrorBoundary } from "../historyErrorBoundary.ts";

export class RetentionPolicyCommand {
  public constructor(
    private readonly context: HistoryStoreContext,
    private readonly dependencies: HistoryStoreDependencies,
    private readonly pagination: HistoryPaginationCoordinator,
    private readonly errorBoundary: HistoryErrorBoundary,
  ) {}

  public async execute(retentionDays: number | null, user?: User | null) {
    const policy = HistoryRetentionPolicy.forDays(retentionDays);
    if (!policy) {
      return;
    }

    const evaluation = policy.evaluate(this.context.getState().history);
    if (evaluation.expired.length === 0) {
      return;
    }

    this.context.setState({
      history: evaluation.retained,
      nextPage: this.pagination.resolveNextPage(evaluation.retained.length),
    });

    evaluation.expired.forEach((item) => {
      this.dependencies.wordStore.getState().removeVersions(item.termKey);
    });

    if (!user?.token || evaluation.remoteRecordIds.size === 0) {
      return;
    }

    for (const recordId of evaluation.remoteRecordIds.values()) {
      try {
        await this.dependencies.api.deleteRecord({
          recordId,
          token: user.token,
        });
      } catch (error) {
        this.errorBoundary.capture(error);
        return;
      }
    }
  }
}
