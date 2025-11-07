import type { User } from "../../userStore.ts";
import type {
  HistoryStoreContext,
  HistoryStoreDependencies,
} from "../contracts.ts";
import { HistoryPaginationCoordinator } from "../historyPaginationCoordinator.ts";
import { HistoryErrorBoundary } from "../historyErrorBoundary.ts";
import type { HistoryItem } from "@core/history/index.ts";

export class LanguageCleanupCommand {
  public constructor(
    private readonly context: HistoryStoreContext,
    private readonly dependencies: HistoryStoreDependencies,
    private readonly pagination: HistoryPaginationCoordinator,
    private readonly errorBoundary: HistoryErrorBoundary,
  ) {}

  public async clearByLanguage(language: string, user?: User | null) {
    const normalized = this.normalizeLanguage(language);
    if (!normalized) {
      return;
    }

    const aggregated = this.aggregateLocalCandidates(normalized);
    await this.extendWithRemoteCandidates(user, normalized, aggregated);
    this.cleanupLocalCaches(aggregated, normalized);

    if (!user?.token || aggregated.size === 0) {
      return;
    }

    await this.deleteRemoteRecords(user, aggregated);
  }

  private normalizeLanguage(language: string): string | null {
    const normalized = String(language ?? "")
      .trim()
      .toUpperCase();
    return normalized ? normalized : null;
  }

  private aggregateLocalCandidates(language: string) {
    const candidates = this.context
      .getState()
      .history.filter((item) => item.language === language);
    if (candidates.length > 0) {
      this.context.setState((state) => {
        const filtered = state.history.filter(
          (item) => item.language !== language,
        );
        return {
          history: filtered,
          nextPage: this.pagination.resolveNextPage(filtered.length),
        };
      });
    }

    const aggregated = new Map<string, HistoryItem>();
    candidates.forEach((item) => {
      aggregated.set(item.termKey, item);
    });
    return aggregated;
  }

  private async extendWithRemoteCandidates(
    user: User | null | undefined,
    language: string,
    aggregated: Map<string, HistoryItem>,
  ) {
    if (!user?.token) {
      return;
    }

    const remoteCandidates = await this.pagination.collectRemoteMatches(
      user,
      (item) => item.language === language,
    );
    remoteCandidates.forEach((item) => {
      aggregated.set(item.termKey, item);
    });
  }

  private cleanupLocalCaches(
    aggregated: Map<string, HistoryItem>,
    language: string,
  ) {
    aggregated.forEach((item) => {
      this.dependencies.wordStore.getState().removeVersions(item.termKey);
    });
    this.pruneWordCacheByLanguage(language);
  }

  private async deleteRemoteRecords(
    user: User,
    aggregated: Map<string, HistoryItem>,
  ) {
    const recordIds = new Set<string>();
    aggregated.forEach((item) => {
      if (item.recordId) {
        recordIds.add(item.recordId);
      }
    });

    for (const recordId of recordIds.values()) {
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

    await this.pagination.refreshFirstPage(user);
  }

  private pruneWordCacheByLanguage(language: string) {
    const prefix = `${language}:`;
    this.dependencies.wordStore.setState((state) => {
      const entries = state.entries ?? {};
      const keys = Object.keys(entries);
      if (keys.length === 0) {
        return {};
      }

      let mutated = false;
      const nextEntries: typeof entries = {};
      keys.forEach((termKey) => {
        if (termKey.startsWith(prefix)) {
          mutated = true;
          return;
        }
        nextEntries[termKey] = entries[termKey];
      });

      if (!mutated) {
        return {};
      }

      return { entries: nextEntries };
    });
  }
}
