import {
  createPersonalizationInitialState,
  createPersonalizationSnapshot,
  personalizationReducer,
  resolveSnapshotFromState,
} from "@/pages/preferences/sections/personalizationModel.js";

/**
 * 测试目标：验证 createPersonalizationSnapshot 能正确填充字段并回退空值。
 * 前置条件：提供包含部分字段与自定义分区的详情对象。
 * 步骤：
 *  1) 调用 createPersonalizationSnapshot。
 *  2) 检查字段与自定义分区的结构。
 * 断言：
 *  - 空字段使用占位符；
 *  - 自定义分区过滤空项并保留有效值；
 *  - hasDetails 标志为 true。
 * 边界/异常：
 *  - 若过滤失败应回退为 false。
 */
test("Given partial details When snapshot created Then empty values fallback", () => {
  const details = {
    job: "Product Manager",
    interests: "AI, Writing",
    customSections: [
      {
        id: "section-1",
        title: "Projects",
        items: [
          { id: "item-1", label: "Current", value: "Agent" },
          { id: "item-2", label: "", value: "" },
        ],
      },
      {
        id: "section-2",
        title: " ",
        items: [{ id: "item-3", label: "", value: "" }],
      },
    ],
  };

  const snapshot = createPersonalizationSnapshot(details, {
    translations: {
      jobLabel: "Occupation",
      interestsLabel: "Interests",
      goalLabel: "Goal",
      educationLabel: "Education",
      currentAbilityLabel: "Current proficiency",
    },
    fallbackValue: "Not set",
  });

  expect(snapshot.fields.find((field) => field.id === "goal").value).toBe(
    "Not set",
  );
  expect(snapshot.customSections).toHaveLength(1);
  expect(snapshot.customSections[0].items).toHaveLength(1);
  expect(snapshot.hasDetails).toBe(true);
});

/**
 * 测试目标：验证 personalizationReducer 的状态迁移。
 * 前置条件：使用初始状态并构造成功与失败的 action。
 * 步骤：
 *  1) 依次派发 loading、success、failure、reset。
 * 断言：
 *  - loading 保留既有详情且清空错误；
 *  - success 写入详情并置为 ready；
 *  - failure 保留详情并暴露错误；
 *  - reset 回到初始状态。
 * 边界/异常：
 *  - 未知 action 返回原状态。
 */
test("Given reducer When actions dispatched Then states transition predictably", () => {
  const initial = createPersonalizationInitialState();
  const loading = personalizationReducer(initial, { type: "loading" });
  expect(loading.status).toBe("loading");
  expect(loading.error).toBeNull();

  const ready = personalizationReducer(loading, {
    type: "success",
    details: { job: "Engineer" },
  });
  expect(ready.status).toBe("ready");
  expect(ready.details.job).toBe("Engineer");

  const failed = personalizationReducer(ready, {
    type: "failure",
    error: new Error("network"),
  });
  expect(failed.status).toBe("error");
  expect(failed.error).toBeInstanceOf(Error);
  expect(failed.details.job).toBe("Engineer");

  const reset = personalizationReducer(failed, { type: "reset" });
  expect(reset).toEqual(initial);

  const unknown = personalizationReducer(reset, { type: "unknown" });
  expect(unknown).toBe(reset);
});

/**
 * 测试目标：确认 resolveSnapshotFromState 会使用 fallback 详情并生成快照。
 * 前置条件：状态中不含 details。
 * 步骤：
 *  1) 调用 resolveSnapshotFromState。
 * 断言：
 *  - 返回值 fields 长度与默认蓝图一致；
 *  - fallback 文案生效；
 *  - hasDetails 为 false。
 * 边界/异常：
 *  - 当 details 缺失时不抛异常。
 */
test("Given empty state When resolving snapshot Then use fallback details", () => {
  const state = createPersonalizationInitialState();
  const snapshot = resolveSnapshotFromState(state, {
    translations: {},
    fallbackValue: "—",
  });

  expect(snapshot.fields).toHaveLength(5);
  expect(snapshot.fields.every((field) => field.value === "—")).toBe(true);
  expect(snapshot.hasDetails).toBe(false);
});
