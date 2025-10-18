/**
 * 背景：
 *  - Profile 页面字段分组以 useMemo 内联配置，扩展时难以复用和测试。
 * 目的：
 *  - 提供纯函数生成字段分组，统一管理图标、文案与占位符定义。
 * 关键决策与取舍：
 *  - 维持现有分组结构，确保页面渲染顺序不变；
 *  - 通过函数化封装方便未来基于配置动态扩展字段。
 * 影响范围：
 *  - Profile 页面渲染字段的配置来源集中，便于多入口共享。
 * 演进与TODO：
 *  - TODO: 若后续接入服务端 schema，可在此处增加格式化逻辑以支持动态字段。
 */
export function createProfileFieldGroups(t) {
  return [
    {
      key: "background",
      fields: [
        {
          key: "education",
          icon: "library",
          label: t.educationLabel,
          placeholder: t.educationPlaceholder,
          help: t.educationHelp,
        },
        {
          key: "job",
          icon: "command-line",
          label: t.jobLabel,
          placeholder: t.jobPlaceholder,
          help: t.jobHelp,
        },
      ],
    },
    {
      key: "growth",
      fields: [
        {
          key: "interests",
          icon: "star-outline",
          label: t.interestsLabel,
          placeholder: t.interestsPlaceholder,
          help: t.interestsHelp,
        },
        {
          key: "goal",
          icon: "flag",
          label: t.goalLabel,
          placeholder: t.goalPlaceholder,
          help: t.goalHelp,
        },
        {
          key: "currentAbility",
          icon: "shield-check",
          label: t.currentAbilityLabel,
          placeholder: t.currentAbilityPlaceholder,
          help: t.currentAbilityHelp,
        },
      ],
    },
  ];
}
