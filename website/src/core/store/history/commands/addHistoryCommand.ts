import {
  createTermKey,
  normalizeFlavor,
  normalizeLanguage,
  sanitizeHistoryTerm,
  type HistoryItem,
} from "@core/history/index.ts";
import type { User } from "../../userStore.ts";
import type {
  HistoryStoreContext,
  HistoryStoreDependencies,
} from "../contracts.ts";
import { HistoryPaginationCoordinator } from "../historyPaginationCoordinator.ts";
import { HistoryErrorBoundary } from "../historyErrorBoundary.ts";

export class AddHistoryCommand {
  public constructor(
    private readonly context: HistoryStoreContext,
    private readonly dependencies: HistoryStoreDependencies,
    private readonly pagination: HistoryPaginationCoordinator,
    private readonly errorBoundary: HistoryErrorBoundary,
  ) {}

  /**
   * 意图：根据数据治理开关新增一条历史，并在成功后刷新首屏。
   */
  public async execute(
    term: string,
    user?: User | null,
    language?: string,
    flavor?: string,
  ) {
    if (!this.dependencies.dataGovernance.isCaptureEnabled()) {
      return;
    }

    const sanitizedTerm = sanitizeHistoryTerm(term) || term;
    const normalizedLanguage = normalizeLanguage(sanitizedTerm, language);
    const normalizedFlavor = normalizeFlavor(flavor);
    const termKey = createTermKey(
      sanitizedTerm,
      normalizedLanguage,
      normalizedFlavor,
    );
    const now = new Date().toISOString();
    const placeholder: HistoryItem = {
      recordId: null,
      term: sanitizedTerm,
      language: normalizedLanguage,
      flavor: normalizedFlavor,
      termKey,
      createdAt: now,
      favorite: false,
      versions: [],
      latestVersionId: null,
    };

    this.context.setState((state) => {
      const filtered = state.history.filter((item) => item.termKey !== termKey);
      const next = [placeholder, ...filtered];
      return {
        history: next,
        nextPage: this.pagination.resolveNextPage(next.length),
      };
    });

    if (!user?.token) {
      return;
    }

    try {
      await this.dependencies.api.saveRecord({
        token: user.token,
        term: sanitizedTerm,
        language: normalizedLanguage,
        flavor: normalizedFlavor,
      });
      await this.pagination.refreshFirstPage(user);
    } catch (error) {
      this.errorBoundary.capture(error);
    }
  }
}
