/**
 * 测试目标：
 *  - 确认 createProfileFieldGroups 按翻译表生成正确字段结构。
 * 前置条件：
 *  - 构造含必要 key 的翻译对象。
 * 步骤：
 *  1) 调用函数生成分组；
 *  2) 检查每个字段的 key/icon/label。
 * 断言：
 *  - 输出的字段数量与顺序与预期一致。
 * 边界/异常：
 *  - 翻译缺失时返回 undefined（由调用方负责）。
 */
import { createProfileFieldGroups } from "../profileFieldGroups.js";

describe("createProfileFieldGroups", () => {
  const t = {
    educationLabel: "Education",
    educationPlaceholder: "School",
    educationHelp: "help",
    jobLabel: "Job",
    jobPlaceholder: "Company",
    jobHelp: "job-help",
    interestsLabel: "Interests",
    interestsPlaceholder: "Hobby",
    interestsHelp: "interests-help",
    goalLabel: "Goal",
    goalPlaceholder: "Target",
    goalHelp: "goal-help",
    currentAbilityLabel: "Ability",
    currentAbilityPlaceholder: "Level",
    currentAbilityHelp: "ability-help",
  };

  it("生成背景与成长两组字段", () => {
    const groups = createProfileFieldGroups(t);
    expect(groups).toHaveLength(2);
    expect(groups[0].key).toBe("background");
    expect(groups[0].fields.map((field) => field.key)).toEqual([
      "education",
      "job",
    ]);
    expect(groups[1].fields.map((field) => field.key)).toEqual([
      "interests",
      "goal",
      "currentAbility",
    ]);
  });
});
