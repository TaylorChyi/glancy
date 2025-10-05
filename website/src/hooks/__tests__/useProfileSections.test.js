import { renderHook, act } from "@testing-library/react";
import { useProfileSections } from "@/hooks/useProfileSections.js";

const schema = [
  {
    id: "section-a",
    icon: "flag",
    titleKey: "section.a.title",
    descriptionKey: "section.a.desc",
    items: [
      {
        id: "item-a",
        labelKey: "section.a.item.a",
        placeholderKey: "section.a.item.a.placeholder",
        multiline: false,
      },
    ],
  },
  {
    id: "section-b",
    icon: "library",
    titleKey: "section.b.title",
    descriptionKey: null,
    items: [
      {
        id: "item-b",
        labelKey: "section.b.item.b",
        placeholderKey: "section.b.item.b.placeholder",
        multiline: true,
      },
    ],
  },
];

/**
 * 测试目标：验证 useProfileSections 在初始化时会将 Schema 与初始值合并，并能更新指定子项。
 * 前置条件：
 *  - 传入包含两个区块的 Schema；
 *  - 初始数据仅为第一个区块提供值。
 * 步骤：
 *  1) 渲染 Hook；
 *  2) 调用 updateItem 更新第一个区块的值；
 *  3) 读取最新状态。
 * 断言：
 *  - 初始状态保留传入的值；
 *  - updateItem 之后值被更新；
 *  - 未提供初始值的区块以空字符串作为默认值。
 * 边界/异常：
 *  - 若传入未知区块，应被保留（此用例未覆盖）。
 */
test("GivenInitialData_WhenUpdateItem_ThenSectionValueUpdates", () => {
  const initialSections = [
    {
      id: "section-a",
      title: "Custom",
      items: [{ id: "item-a", value: "hello" }],
    },
  ];
  const { result } = renderHook(() =>
    useProfileSections({ schema, initialSections }),
  );

  expect(result.current.sections[0].items[0].value).toBe("hello");
  expect(result.current.sections[1].items[0].value).toBe("");

  act(() => {
    result.current.updateItem("section-a", "item-a", "updated");
  });

  expect(result.current.sections[0].items[0].value).toBe("updated");
});

/**
 * 测试目标：验证 resetSections 会重建状态且 toPayload 会输出经过裁剪的值。
 * 前置条件：
 *  - 初始数据为空；
 *  - 调用 resetSections 提供新的区块值。
 * 步骤：
 *  1) 渲染 Hook；
 *  2) 调用 resetSections 并传入带有空白字符的值；
 *  3) 读取 toPayload 输出。
 * 断言：
 *  - 状态被重置为新值；
 *  - toPayload 输出的值已去除首尾空格；
 *  - 空字符串被转换为 null。
 * 边界/异常：
 *  - 若 future 扩展其他字段，需同步更新序列化逻辑（此用例未覆盖）。
 */
test("GivenReset_WhenSerialize_ThenPayloadIsTrimmed", () => {
  const { result } = renderHook(() => useProfileSections({ schema }));

  act(() => {
    result.current.resetSections([
      {
        id: "section-a",
        title: "  Title  ",
        items: [{ id: "item-a", value: "  value  " }],
      },
      {
        id: "section-b",
        title: null,
        items: [{ id: "item-b", value: "   " }],
      },
    ]);
  });

  expect(result.current.sections[0].items[0].value).toBe("  value  ");

  const payload = result.current.toPayload();
  expect(payload[0].title).toBe("Title");
  expect(payload[0].items[0].value).toBe("value");
  expect(payload[1].items[0].value).toBeNull();
});
