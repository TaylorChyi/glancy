/**
 * 背景：
 *  - 新增历史的逻辑涉及词形归一化、占位插入与远程同步，
 *    直接嵌在状态机中导致命令逻辑难以复用测试。
 * 目的：
 *  - 将新增流程封装为命令对象，便于单独演进词形策略或扩展埋点。
 * 关键决策与取舍：
 *  - 依赖注入分页协调器以复用刷新能力；
 *  - 保留本地占位插入，确保乐观体验不受影响。
 */

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
