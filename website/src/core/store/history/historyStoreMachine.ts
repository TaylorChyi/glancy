/**
 * 背景：
 *  - 历史记录 Store 长期内聚合了分页、治理、词条缓存等多类逻辑，
 *    单文件实现难以按职责拆分，导致结构化 lint 长期豁免。
 * 目的：
 *  - 将状态机重构为组合式架构：对外仍暴露相同契约，内部通过协调器拆分职责，
 *    为未来扩展新策略或替换依赖预留接口。
 * 关键决策与取舍：
 *  - 采用“状态机 orchestrator + 命令/分页协调器”的组合模式；
 *    分页采用模板方法，维护操作采用命令模式，错误统一交由边界处理；
 *  - 拒绝一次性拆分为函数片段，而是保留可注入的对象结构以利测试与演进。
 * 影响范围：
 *  - useHistoryStore 的全部调用方；
 *  - 词条缓存、数据治理与用户登出等侧向依赖在协调器中统一编排。
 * 演进与TODO：
 *  - 后续可将 api 依赖替换为端口接口，引入离线策略或批量操作；
 *  - 如需多租户支持，可扩展上下文以承载租户标识并下沉到策略判定。
 */

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

  public applyRetentionPolicy: HistoryActions["applyRetentionPolicy"] = async (
    retentionDays,
    user?,
  ) => {
    await this.maintenance.applyRetentionPolicy(retentionDays, user);
  };
}
