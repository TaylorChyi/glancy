/**
 * 背景：
 *  - 删除历史需要解析多种 identifier 形式并同步移除缓存。
 * 目的：
 *  - 命令化封装该流程，方便未来追加撤销或批处理能力。
 */

import { resolveHistoryItem } from "@core/history/index.ts";
import type { HistoryItem } from "@core/history/index.ts";
import type { User } from "../../userStore.ts";
import type {
  HistoryStoreContext,
  HistoryStoreDependencies,
} from "../contracts.ts";
import { HistoryPaginationCoordinator } from "../historyPaginationCoordinator.ts";
import { HistoryErrorBoundary } from "../historyErrorBoundary.ts";

export class RemoveHistoryCommand {
  public constructor(
    private readonly context: HistoryStoreContext,
    private readonly dependencies: HistoryStoreDependencies,
    private readonly pagination: HistoryPaginationCoordinator,
    private readonly errorBoundary: HistoryErrorBoundary,
  ) {}

  public async execute(identifier: string | HistoryItem, user?: User | null) {
    const historyItems = this.context.getState().history;
    const target =
      typeof identifier === "object" && identifier
        ? identifier
        : resolveHistoryItem(historyItems, identifier);

    if (!target) {
      this.context.setState((state) => {
        const filtered = state.history.filter(
          (item) => item.termKey !== identifier && item.term !== identifier,
        );
        return {
          history: filtered,
          nextPage: this.pagination.resolveNextPage(filtered.length),
        };
      });
      return;
    }

    if (user?.token) {
      const recordId = target.recordId ?? target.latestVersionId;
      if (recordId) {
        try {
          await this.dependencies.api.deleteRecord({
            recordId,
            token: user.token,
          });
        } catch (error) {
          this.errorBoundary.capture(error);
        }
      }
    }

    this.context.setState((state) => {
      const filtered = state.history.filter(
        (item) => item.termKey !== target.termKey,
      );
      return {
        history: filtered,
        nextPage: this.pagination.resolveNextPage(filtered.length),
      };
    });

    this.dependencies.wordStore.getState().removeVersions(target.termKey);
  }
}
