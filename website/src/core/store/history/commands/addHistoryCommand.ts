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

type NormalizedTermPayload = {
  term: string;
  language: string;
  flavor: string;
  termKey: string;
  createdAt: string;
};

export class AddHistoryCommand {
  private readonly placeholderDefaults: Pick<
    HistoryItem,
    "favorite" | "versions" | "latestVersionId"
  > = {
    favorite: false,
    versions: [],
    latestVersionId: null,
  };

  public constructor(
    private readonly context: HistoryStoreContext,
    private readonly dependencies: HistoryStoreDependencies,
    private readonly pagination: HistoryPaginationCoordinator,
    private readonly errorBoundary: HistoryErrorBoundary,
  ) {}

  private isCaptureEnabled() {
    return this.dependencies.dataGovernance.isCaptureEnabled();
  }

  private sanitizeTerm(term: string) {
    return sanitizeHistoryTerm(term) || term;
  }

  private normalizeTermPayload(
    term: string,
    language?: string,
    flavor?: string,
  ): NormalizedTermPayload {
    const sanitizedTerm = this.sanitizeTerm(term);
    const normalizedLanguage = normalizeLanguage(sanitizedTerm, language);
    const normalizedFlavor = normalizeFlavor(flavor);
    return {
      term: sanitizedTerm,
      language: normalizedLanguage,
      flavor: normalizedFlavor,
      termKey: createTermKey(
        sanitizedTerm,
        normalizedLanguage,
        normalizedFlavor,
      ),
      createdAt: new Date().toISOString(),
    };
  }

  private buildPlaceholder(payload: NormalizedTermPayload) {
    const { term, language, flavor, termKey, createdAt } = payload;
    return {
      recordId: null,
      term,
      language,
      flavor,
      termKey,
      createdAt,
      ...this.placeholderDefaults,
    } satisfies HistoryItem;
  }

  private applyOptimisticInsert(placeholder: HistoryItem) {
    this.context.setState((state) => {
      const filtered = state.history.filter(
        (item) => item.termKey !== placeholder.termKey,
      );
      const next = [placeholder, ...filtered];
      return {
        history: next,
        nextPage: this.pagination.resolveNextPage(next.length),
      };
    });
  }

  private async persistRecord(
    payload: NormalizedTermPayload,
    user?: User | null,
  ) {
    if (!user?.token) {
      return;
    }

    try {
      await this.dependencies.api.saveRecord({
        token: user.token,
        term: payload.term,
        language: payload.language,
        flavor: payload.flavor,
      });
      await this.pagination.refreshFirstPage(user);
    } catch (error) {
      this.errorBoundary.capture(error);
    }
  }

  /**
   * 意图：根据数据治理开关新增一条历史，并在成功后刷新首屏。
   */
  public async execute(
    term: string,
    user?: User | null,
    language?: string,
    flavor?: string,
  ) {
    if (!this.isCaptureEnabled()) {
      return;
    }

    const payload = this.normalizeTermPayload(term, language, flavor);
    const placeholder = this.buildPlaceholder(payload);
    this.applyOptimisticInsert(placeholder);
    await this.persistRecord(payload, user);
  }
}
