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

  private resolveTarget(identifier: string | HistoryItem): HistoryItem | null {
    if (identifier && typeof identifier === "object") {
      return identifier;
    }
    const historyItems = this.context.getState().history;
    return resolveHistoryItem(historyItems, identifier) ?? null;
  }

  private removeByIdentifier(identifier: string | HistoryItem) {
    if (typeof identifier !== "string") {
      return;
    }
    this.context.setState((state) => {
      const filtered = state.history.filter(
        (item) => item.termKey !== identifier && item.term !== identifier,
      );
      return {
        history: filtered,
        nextPage: this.pagination.resolveNextPage(filtered.length),
      };
    });
  }

  private async persistRemoval(target: HistoryItem, user?: User | null) {
    if (!user?.token) {
      return;
    }
    const recordId = target.recordId ?? target.latestVersionId;
    if (!recordId) {
      return;
    }

    try {
      await this.dependencies.api.deleteRecord({
        recordId,
        token: user.token,
      });
    } catch (error) {
      this.errorBoundary.capture(error);
    }
  }

  private purgeLocalHistory(target: HistoryItem) {
    this.context.setState((state) => {
      const filtered = state.history.filter(
        (item) => item.termKey !== target.termKey,
      );
      return {
        history: filtered,
        nextPage: this.pagination.resolveNextPage(filtered.length),
      };
    });
  }

  private purgeWordVersions(target: HistoryItem) {
    this.dependencies.wordStore.getState().removeVersions(target.termKey);
  }

  public async execute(identifier: string | HistoryItem, user?: User | null) {
    const target = this.resolveTarget(identifier);
    if (!target) {
      this.removeByIdentifier(identifier);
      return;
    }

    await this.persistRemoval(target, user);
    this.purgeLocalHistory(target);
    this.purgeWordVersions(target);
  }
}
