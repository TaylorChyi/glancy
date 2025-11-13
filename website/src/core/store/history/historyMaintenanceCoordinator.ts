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
    this.addCommand = this.createAddCommand();
    this.clearCommand = this.createClearCommand();
    this.languageCleanupCommand = this.createLanguageCleanupCommand();
    this.removeCommand = this.createRemoveCommand();
    this.toggleFavoriteCommand = this.createToggleFavoriteCommand();
    this.retentionCommand = this.createRetentionCommand();
  }

  private createAddCommand() {
    return new AddHistoryCommand(
      this.context,
      this.dependencies,
      this.pagination,
      this.errorBoundary,
    );
  }

  private createClearCommand() {
    return new ClearHistoryCommand(
      this.context,
      this.dependencies,
      this.errorBoundary,
    );
  }

  private createLanguageCleanupCommand() {
    return new LanguageCleanupCommand(
      this.context,
      this.dependencies,
      this.pagination,
      this.errorBoundary,
    );
  }

  private createRemoveCommand() {
    return new RemoveHistoryCommand(
      this.context,
      this.dependencies,
      this.pagination,
      this.errorBoundary,
    );
  }

  private createToggleFavoriteCommand() {
    return new ToggleFavoriteCommand(
      this.context,
      this.dependencies,
      this.pagination,
      this.errorBoundary,
    );
  }

  private createRetentionCommand() {
    return new RetentionPolicyCommand(
      this.context,
      this.dependencies,
      this.pagination,
      this.errorBoundary,
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
