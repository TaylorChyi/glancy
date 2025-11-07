import { resolveHistoryItem } from "@core/history/index.ts";
import type { User } from "../../userStore.ts";
import type {
  HistoryStoreContext,
  HistoryStoreDependencies,
} from "../contracts.ts";
import { HistoryPaginationCoordinator } from "../historyPaginationCoordinator.ts";
import { HistoryErrorBoundary } from "../historyErrorBoundary.ts";

export class ToggleFavoriteCommand {
  public constructor(
    private readonly context: HistoryStoreContext,
    private readonly dependencies: HistoryStoreDependencies,
    private readonly pagination: HistoryPaginationCoordinator,
    private readonly errorBoundary: HistoryErrorBoundary,
  ) {}

  public async favorite(
    identifier: string,
    user?: User | null,
    versionId?: string,
  ) {
    await this.toggle(true, identifier, user, versionId);
  }

  public async unfavorite(
    identifier: string,
    user?: User | null,
    versionId?: string,
  ) {
    await this.toggle(false, identifier, user, versionId);
  }

  private async toggle(
    isFavorite: boolean,
    identifier: string,
    user?: User | null,
    versionId?: string,
  ) {
    if (!user?.token) {
      return;
    }

    const recordId = this.resolveRecordId(identifier, versionId);
    if (!recordId) {
      return;
    }

    await this.performRemoteMutation(isFavorite, user, recordId);
  }

  private resolveRecordId(
    identifier: string,
    versionId?: string,
  ): string | null {
    const target = resolveHistoryItem(
      this.context.getState().history,
      identifier,
    );
    return versionId ?? target?.recordId ?? target?.latestVersionId ?? null;
  }

  private async performRemoteMutation(
    isFavorite: boolean,
    user: User,
    recordId: string,
  ) {
    try {
      const method = isFavorite
        ? this.dependencies.api.favoriteRecord
        : this.dependencies.api.unfavoriteRecord;
      await method({ token: user.token, recordId });
      await this.pagination.refreshFirstPage(user);
    } catch (error) {
      this.errorBoundary.capture(error);
    }
  }
}
