import {
  CORE_FIELDS,
  createCustomSection,
  createEmptyProfileDetails,
  mapProfileDetailsToRequest,
  mapResponseToProfileDetails,
  profileDetailsReducer,
} from "@/pages/profile/profileDetailsModel.js";

/**
 * 测试目标：验证 mapResponseToProfileDetails 能正确构建前端表单状态。
 * 前置条件：提供包含核心字段与自定义大项的响应对象。
 * 步骤：调用映射函数并检查返回结构。
 * 断言：
 *  - 字段被填充为响应中的值；
 *  - 自定义大项被转换为带有 id 的数组。
 * 边界/异常：无。
 */
test("mapResponseToProfileDetails populates state", () => {
  const response = {
    job: "工程师",
    education: "硕士",
    interest: "AI, 辩论",
    goal: "冲刺 B2",
    currentAbility: "B1",
    responseStyle: "沉稳",
    customSections: [
      {
        title: "项目",
        items: [
          { label: "近期", value: "智能体" },
          { label: "计划", value: "知识图谱" },
        ],
      },
    ],
  };

  const state = mapResponseToProfileDetails(response);
  expect(state.job).toBe("工程师");
  expect(state.education).toBe("硕士");
  expect(state.responseStyle).toBe("沉稳");
  expect(state.customSections).toHaveLength(1);
  expect(state.customSections[0].items).toHaveLength(2);
});

/**
 * 测试目标：验证 mapProfileDetailsToRequest 过滤空值并保留有效自定义项。
 * 前置条件：构造包含空标题和空项的状态对象。
 * 步骤：调用映射函数。
 * 断言：
 *  - 核心字段被去除首尾空格；
 *  - 仅保留包含内容的自定义项；
 *  - 空字段被转换为 null。
 * 边界/异常：无。
 */
test("mapProfileDetailsToRequest normalizes data", () => {
  const details = {
    job: " 工程师 ",
    interests: "",
    goal: " 提升",
    education: " 本科 ",
    currentAbility: " B1 ",
    responseStyle: " 温和 ",
    customSections: [
      createCustomSection({ title: " ", items: [{ label: "", value: "" }] }),
      createCustomSection({
        title: "成长",
        items: [
          { label: "待提升", value: "听力" },
          { label: "", value: "" },
        ],
      }),
    ],
  };

  const payload = mapProfileDetailsToRequest(details);
  expect(payload.job).toBe("工程师");
  expect(payload.interest).toBeNull();
  expect(payload.goal).toBe("提升");
  expect(payload.education).toBe("本科");
  expect(payload.currentAbility).toBe("B1");
  expect(payload.responseStyle).toBe("温和");
  expect(payload.customSections).toHaveLength(1);
  expect(payload.customSections[0].items).toHaveLength(1);
});

/**
 * 测试目标：确认 reducer 能更新核心字段并在 hydrate 时合并状态。
 * 前置条件：使用空状态初始化。
 * 步骤：依次 dispatch hydrate 与 updateField。
 * 断言：字段按预期更新。
 * 边界/异常：未知 action 返回原状态。
 */
test("profileDetailsReducer hydrates and updates fields", () => {
  const initial = createEmptyProfileDetails();
  const hydrated = profileDetailsReducer(initial, {
    type: "hydrate",
    payload: { job: "工程师" },
  });
  expect(hydrated.job).toBe("工程师");

  const updated = profileDetailsReducer(hydrated, {
    type: "updateField",
    field: CORE_FIELDS[1],
    value: "硕士",
  });
  expect(updated.education).toBe("硕士");

  const toneUpdated = profileDetailsReducer(updated, {
    type: "updateField",
    field: "responseStyle",
    value: "沉稳",
  });
  expect(toneUpdated.responseStyle).toBe("沉稳");

  const untouched = profileDetailsReducer(updated, { type: "unknown" });
  expect(untouched).toBe(updated);
});
