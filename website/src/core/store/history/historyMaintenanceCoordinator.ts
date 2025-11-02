/**
 * 背景：
 *  - 历史状态机曾将所有增删改查逻辑集中在单类内，
 *    导致文件超长且难以替换单个命令。
 * 目的：
 *  - 将命令对象统一在维护协调器下装配，对外保持既有 API，
 *    内部则按职责拆分为可复用的命令组件。
 * 关键决策与取舍：
 *  - 采用命令模式组合（Command Aggregator），协调器仅负责路由；
 *  - 通过分页协调器与错误边界共享上下文，确保副作用一致。
 */

import type { HistoryItem } from "@core/history/index.ts";
import type { User } from "../userStore.ts";
import type {
  HistoryStoreContext,
  HistoryStoreDependencies,
} from "./contracts.ts";
import { HistoryPaginationCoordinator } from "./historyPaginationCoordinator.ts";
import { HistoryErrorBoundary } from "./historyErrorBoundary.ts";
import { AddHistoryCommand } from "./commands/addHistoryCommand.ts";
import { ClearHistoryCommand } from "./commands/clearHistoryCommand.ts";
import { LanguageCleanupCommand } from "./commands/languageCleanupCommand.ts";
import { RemoveHistoryCommand } from "./commands/removeHistoryCommand.ts";
import { ToggleFavoriteCommand } from "./commands/toggleFavoriteCommand.ts";
import { RetentionPolicyCommand } from "./commands/retentionPolicyCommand.ts";

export class HistoryMaintenanceCoordinator {
  private readonly addCommand: AddHistoryCommand;

  private readonly clearCommand: ClearHistoryCommand;

  private readonly languageCleanupCommand: LanguageCleanupCommand;

  private readonly removeCommand: RemoveHistoryCommand;

  private readonly toggleFavoriteCommand: ToggleFavoriteCommand;

  private readonly retentionCommand: RetentionPolicyCommand;

  public constructor(
    private readonly context: HistoryStoreContext,
    private readonly dependencies: HistoryStoreDependencies,
    private readonly pagination: HistoryPaginationCoordinator,
    private readonly errorBoundary: HistoryErrorBoundary,
  ) {
    this.addCommand = new AddHistoryCommand(
      context,
      dependencies,
      pagination,
      errorBoundary,
    );
    this.clearCommand = new ClearHistoryCommand(
      context,
      dependencies,
      errorBoundary,
    );
    this.languageCleanupCommand = new LanguageCleanupCommand(
      context,
      dependencies,
      pagination,
      errorBoundary,
    );
    this.removeCommand = new RemoveHistoryCommand(
      context,
      dependencies,
      pagination,
      errorBoundary,
    );
    this.toggleFavoriteCommand = new ToggleFavoriteCommand(
      context,
      dependencies,
      pagination,
      errorBoundary,
    );
    this.retentionCommand = new RetentionPolicyCommand(
      context,
      dependencies,
      pagination,
      errorBoundary,
    );
  }

  public addHistory(
    term: string,
    user?: User | null,
    language?: string,
    flavor?: string,
  ) {
    return this.addCommand.execute(term, user, language, flavor);
  }

  public clearHistory(user?: User | null) {
    return this.clearCommand.clearAll(user);
  }

  public clearHistoryByLanguage(language: string, user?: User | null) {
    return this.languageCleanupCommand.clearByLanguage(language, user);
  }

  public removeHistory(identifier: string | HistoryItem, user?: User | null) {
    return this.removeCommand.execute(identifier, user);
  }

  public favoriteHistory(
    identifier: string,
    user?: User | null,
    versionId?: string,
  ) {
    return this.toggleFavoriteCommand.favorite(identifier, user, versionId);
  }

  public unfavoriteHistory(
    identifier: string,
    user?: User | null,
    versionId?: string,
  ) {
    return this.toggleFavoriteCommand.unfavorite(identifier, user, versionId);
  }

  public applyRetentionPolicy(
    retentionDays: number | null,
    user?: User | null,
  ) {
    return this.retentionCommand.execute(retentionDays, user);
  }
}
