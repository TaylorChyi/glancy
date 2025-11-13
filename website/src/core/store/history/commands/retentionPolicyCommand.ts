import { HistoryRetentionPolicy } from "@core/history/index.ts";
import type { User } from "../../userStore.ts";
import type {
  HistoryStoreContext,
  HistoryStoreDependencies,
} from "../contracts.ts";
import { HistoryPaginationCoordinator } from "../historyPaginationCoordinator.ts";
import { HistoryErrorBoundary } from "../historyErrorBoundary.ts";

type RetentionEvaluation = ReturnType<
  HistoryRetentionPolicy["evaluate"]
>;

export class RetentionPolicyCommand {
  public constructor(
    private readonly context: HistoryStoreContext,
    private readonly dependencies: HistoryStoreDependencies,
    private readonly pagination: HistoryPaginationCoordinator,
    private readonly errorBoundary: HistoryErrorBoundary,
  ) {}

  private resolvePolicy(retentionDays: number | null) {
    return HistoryRetentionPolicy.forDays(retentionDays);
  }

  private evaluatePolicy(policy: HistoryRetentionPolicy) {
    const evaluation = policy.evaluate(this.context.getState().history);
    if (evaluation.expired.length === 0) {
      return null;
    }
    return evaluation;
  }

  private applyLocalRetention(evaluation: RetentionEvaluation) {
    this.context.setState({
      history: evaluation.retained,
      nextPage: this.pagination.resolveNextPage(evaluation.retained.length),
    });
    evaluation.expired.forEach((item) => {
      this.dependencies.wordStore.getState().removeVersions(item.termKey);
    });
  }

  private async persistRemoteExpirations(
    evaluation: RetentionEvaluation,
    user?: User | null,
  ) {
    if (!user?.token || evaluation.remoteRecordIds.size === 0) {
      return;
    }

    for (const recordId of evaluation.remoteRecordIds.values()) {
      try {
        await this.dependencies.api.deleteRecord({
          recordId,
          token: user.token,
        });
      } catch (error) {
        this.errorBoundary.capture(error);
        break;
      }
    }
  }

  public async execute(retentionDays: number | null, user?: User | null) {
    const policy = this.resolvePolicy(retentionDays);
    if (!policy) {
      return;
    }

    const evaluation = this.evaluatePolicy(policy);
    if (!evaluation) {
      return;
    }

    this.applyLocalRetention(evaluation);
    await this.persistRemoteExpirations(evaluation, user);
  }
}
