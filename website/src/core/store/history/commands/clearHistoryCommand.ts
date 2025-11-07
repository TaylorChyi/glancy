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
