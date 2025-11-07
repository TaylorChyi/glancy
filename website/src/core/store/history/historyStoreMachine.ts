import type { User } from "../userStore.ts";
import {
  INITIAL_HISTORY_SLICE,
  type HistoryActions,
  type HistorySlice,
  type HistoryState,
  type HistoryStoreContext,
  type HistoryStoreDependencies,
} from "./contracts.ts";
import { HistoryErrorBoundary } from "./historyErrorBoundary.ts";
import { HistoryPaginationCoordinator } from "./historyPaginationCoordinator.ts";
import { HistoryMaintenanceCoordinator } from "./historyMaintenanceCoordinator.ts";

export type {
  HistoryState,
  HistoryActions,
  HistorySlice,
} from "./contracts.ts";

export type {
  HistoryStoreContext,
  HistoryStoreDependencies,
} from "./contracts.ts";

export class HistoryStoreMachine {
  public readonly initialState: HistorySlice = { ...INITIAL_HISTORY_SLICE };

  private readonly pagination: HistoryPaginationCoordinator;

  private readonly maintenance: HistoryMaintenanceCoordinator;

  public constructor(
    private readonly context: HistoryStoreContext,
    private readonly dependencies: HistoryStoreDependencies,
  ) {
    const errorBoundary = new HistoryErrorBoundary(context, dependencies);
    this.pagination = new HistoryPaginationCoordinator(
      context,
      dependencies,
      errorBoundary,
    );
    this.maintenance = new HistoryMaintenanceCoordinator(
      context,
      dependencies,
      this.pagination,
      errorBoundary,
    );
  }

  public loadHistory: HistoryActions["loadHistory"] = async (
    user?: User | null,
  ) => {
    await this.pagination.loadInitial(user);
  };

  public loadMoreHistory: HistoryActions["loadMoreHistory"] = async (
    user?: User | null,
  ) => {
    await this.pagination.loadMore(user);
  };

  public addHistory: HistoryActions["addHistory"] = async (
    term,
    user,
    language?,
    flavor?,
  ) => {
    await this.maintenance.addHistory(term, user, language, flavor);
  };

  public clearHistory: HistoryActions["clearHistory"] = async (
    user?: User | null,
  ) => {
    await this.maintenance.clearHistory(user);
  };

  public clearHistoryByLanguage: HistoryActions["clearHistoryByLanguage"] =
    async (language, user) => {
      await this.maintenance.clearHistoryByLanguage(language, user);
    };

  public removeHistory: HistoryActions["removeHistory"] = async (
    identifier,
    user?,
  ) => {
    await this.maintenance.removeHistory(identifier, user);
  };

  public favoriteHistory: HistoryActions["favoriteHistory"] = async (
    identifier,
    user?,
    versionId?,
  ) => {
    await this.maintenance.favoriteHistory(identifier, user, versionId);
  };

  public unfavoriteHistory: HistoryActions["unfavoriteHistory"] = async (
    identifier,
    user?,
    versionId?,
  ) => {
    await this.maintenance.unfavoriteHistory(identifier, user, versionId);
  };

  public applyRetentionPolicy: HistoryActions["applyRetentionPolicy"] = async (
    retentionDays,
    user?,
  ) => {
    await this.maintenance.applyRetentionPolicy(retentionDays, user);
  };
}
