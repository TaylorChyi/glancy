import {
  RESPONSE_STYLE_ACTIONS,
  RESPONSE_STYLE_FIELDS,
  buildRequestPayload,
  createResponseStyleInitialState,
  hasFieldChanged,
  responseStyleReducer,
} from "../responseStyleModel.js";

/**
 * 测试目标：hydrate 动作应使用传入草稿初始化状态并清空错误。
 * 前置条件：初始状态为 idle，传入包含响应风格与职业的草稿。
 * 步骤：调用 reducer 并传入 hydrate 动作。
 * 断言：
 *  - status 为 ready；
 *  - values 与 persisted 匹配传入数据；
 *  - 错误被清空。
 * 边界/异常：无。
 */
test("Given hydrate action When reducing Then state mirrors payload", () => {
  const initial = createResponseStyleInitialState();
  const payload = {
    responseStyle: "沉稳",
    job: "产品经理",
    education: "硕士",
    goal: "冲刺110",
    interests: "英语、设计",
    currentAbility: "B2",
  };
  const next = responseStyleReducer(initial, {
    type: RESPONSE_STYLE_ACTIONS.hydrate,
    payload,
  });
  expect(next.status).toBe("ready");
  expect(next.values.responseStyle).toBe("沉稳");
  expect(next.persisted.job).toBe("产品经理");
  expect(next.error).toBeNull();
});

/**
 * 测试目标：change 与 hasFieldChanged 配合识别修改过的字段。
 * 前置条件：使用含响应风格的状态 hydrate 后修改 goal。
 * 步骤：依次 dispatch change，调用 hasFieldChanged。
 * 断言：
 *  - 修改字段返回 true；
 *  - 未修改字段返回 false。
 * 边界/异常：对未知字段调用返回 false。
 */
test("Given field change When checking dirty state Then only changed field flagged", () => {
  const hydrated = responseStyleReducer(createResponseStyleInitialState(), {
    type: RESPONSE_STYLE_ACTIONS.hydrate,
    payload: {
      responseStyle: "沉稳",
      goal: "托福110",
      job: "产品经理",
      education: "硕士",
      interests: "设计",
      currentAbility: "B2",
    },
  });
  const updated = responseStyleReducer(hydrated, {
    type: RESPONSE_STYLE_ACTIONS.change,
    field: "goal",
    value: "雅思8",
  });
  expect(hasFieldChanged(updated, "goal")).toBe(true);
  expect(hasFieldChanged(updated, "job")).toBe(false);
  expect(hasFieldChanged(updated, "unknown")).toBe(false);
});

/**
 * 测试目标：success 动作应同步最新持久化值并清空保存状态。
 * 前置条件：存在 change 后的状态。
 * 步骤：调用 success 动作；随后构造请求载荷。
 * 断言：
 *  - status 为 ready，savingField 为空；
 *  - buildRequestPayload 输出的字段去除空白。
 * 边界/异常：空白值转为空字符串，由后续序列化决定。
 */
test("Given save success When reducing Then payload mirrors latest values", () => {
  const base = responseStyleReducer(createResponseStyleInitialState(), {
    type: RESPONSE_STYLE_ACTIONS.hydrate,
    payload: {
      responseStyle: "沉稳",
      goal: "托福110",
      job: "产品经理",
      education: "硕士",
      interests: "设计",
      currentAbility: "B2",
    },
  });
  const saving = responseStyleReducer(base, {
    type: RESPONSE_STYLE_ACTIONS.change,
    field: "responseStyle",
    value: "  轻松幽默  ",
  });
  const success = responseStyleReducer(saving, {
    type: RESPONSE_STYLE_ACTIONS.success,
    payload: {
      responseStyle: "轻松幽默",
      goal: "托福110",
      job: "产品经理",
      education: "硕士",
      interests: "设计",
      currentAbility: "B2",
    },
  });
  expect(success.status).toBe("ready");
  expect(success.savingField).toBeNull();
  const payload = buildRequestPayload(success, {
    customSections: [],
  });
  expect(payload.responseStyle).toBe("轻松幽默");
  expect(Object.keys(payload)).toEqual(expect.arrayContaining(RESPONSE_STYLE_FIELDS));
});
