/**
 * 背景：
 *  - 清空历史需同时处理本地状态与远端数据，
 *    原实现散落在状态机中难以组合复用。
 * 目的：
 *  - 将该行为封装为命令对象，便于未来追加审计或提示。
 */

import type { User } from "../../userStore.ts";
import {
  INITIAL_HISTORY_SLICE,
  type HistoryStoreContext,
  type HistoryStoreDependencies,
} from "../contracts.ts";
import { HistoryErrorBoundary } from "../historyErrorBoundary.ts";

export class ClearHistoryCommand {
  public constructor(
    private readonly context: HistoryStoreContext,
    private readonly dependencies: HistoryStoreDependencies,
    private readonly errorBoundary: HistoryErrorBoundary,
  ) {}

  public async clearAll(user?: User | null) {
    if (user?.token) {
      this.dependencies.api
        .clearRecords({ token: user.token })
        .catch((error) => this.errorBoundary.capture(error));
    }

    this.context.setState({ ...INITIAL_HISTORY_SLICE });
  }
}
