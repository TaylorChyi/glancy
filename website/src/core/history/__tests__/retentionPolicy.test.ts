import { HistoryRetentionPolicy } from "@core/history/index.ts";
import type { HistoryItem } from "@core/history/index.ts";

/**
 * 测试目标：策略在指定天数内正确区分保留与过期记录。
 * 前置条件：给定固定时间戳，构造包含过期与有效记录的集合。
 * 步骤：
 *  1) 创建策略实例；
 *  2) 执行 evaluate；
 * 断言：
 *  - expired 仅包含超出阈值的记录；
 *  - remoteRecordIds 收集 recordId 与 latestVersionId。
 * 边界/异常：
 *  - createdAt 为空或不可解析时视为保留。
 */
test("Given retention days When evaluate Then separate expired history", () => {
  const now = Date.UTC(2024, 5, 1);
  const policy = HistoryRetentionPolicy.forDays(30, now);
  if (!policy) {
    throw new Error("policy should be created");
  }
  const history: HistoryItem[] = [
    {
      recordId: "rec-1",
      term: "old",
      language: "ENGLISH",
      flavor: "BILINGUAL",
      termKey: "ENGLISH:BILINGUAL:old",
      createdAt: new Date(now - 40 * 24 * 60 * 60 * 1000).toISOString(),
      favorite: false,
      versions: [],
      latestVersionId: null,
    },
    {
      recordId: null,
      term: "recent",
      language: "ENGLISH",
      flavor: "BILINGUAL",
      termKey: "ENGLISH:BILINGUAL:recent",
      createdAt: new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString(),
      favorite: true,
      versions: [],
      latestVersionId: "ver-123",
    },
    {
      recordId: "rec-3",
      term: "missing",
      language: "ENGLISH",
      flavor: "BILINGUAL",
      termKey: "ENGLISH:BILINGUAL:missing",
      createdAt: null,
      favorite: false,
      versions: [],
      latestVersionId: null,
    },
  ];

  const evaluation = policy.evaluate(history);

  expect(evaluation.expired).toHaveLength(1);
  expect(evaluation.expired[0].term).toBe("old");
  expect(evaluation.retained).toHaveLength(2);
  expect(Array.from(evaluation.remoteRecordIds)).toEqual(["rec-1"]);
});

/**
 * 测试目标：forDays 在传入非法参数时返回 null，避免误创建策略。
 * 前置条件：days 取值为 null 或非正数。
 * 步骤：
 *  1) 分别调用 forDays；
 * 断言：
 *  - 返回值均为 null。
 * 边界/异常：
 *  - 正常值已由其他测试覆盖。
 */
test("Given invalid days When create policy Then return null", () => {
  expect(HistoryRetentionPolicy.forDays(null)).toBeNull();
  expect(HistoryRetentionPolicy.forDays(0)).toBeNull();
  expect(HistoryRetentionPolicy.forDays(-10)).toBeNull();
});
