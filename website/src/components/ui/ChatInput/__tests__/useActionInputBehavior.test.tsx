import { act, renderHook } from "@testing-library/react";
import { jest } from "@jest/globals";
import type React from "react";

import useActionInputBehavior, {
  type FocusChangeContext,
} from "../hooks/useActionInputBehavior";

const createFocusEvent = (
  overrides: Partial<React.FocusEvent<HTMLTextAreaElement>> = {},
): React.FocusEvent<HTMLTextAreaElement> => {
  const textarea = document.createElement("textarea");
  return {
    currentTarget: textarea,
    target: textarea,
    relatedTarget: null,
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
    ...overrides,
  } as React.FocusEvent<HTMLTextAreaElement>;
};

/**
 * 测试目标：空输入时提交被拦截且保留 preventDefault 语义。
 * 前置条件：传入 value="" 与 onSubmit 回调。
 * 步骤：
 *  1) 渲染 Hook 并触发 formProps.onSubmit。
 *  2) 记录 preventDefault 与 onSubmit 的调用次数。
 * 断言：
 *  - preventDefault 被调用一次。
 *  - onSubmit 未被触发。
 * 边界/异常：
 *  - 确保 value.trim 为空字符串时不执行提交。
 */
test("GivenEmptyValue_WhenSubmitIntercepted_ThenPreventDefaultOnly", () => {
  const onSubmit = jest.fn();
  const { result } = renderHook(() =>
    useActionInputBehavior({ value: "", onSubmit }),
  );

  const preventDefault = jest.fn();
  act(() => {
    result.current.formProps.onSubmit({
      preventDefault,
    } as React.FormEvent<HTMLFormElement>);
  });

  expect(preventDefault).toHaveBeenCalledTimes(1);
  expect(onSubmit).not.toHaveBeenCalled();
});

/**
 * 测试目标：非空输入触发提交并复用 requestSubmit 代理。
 * 前置条件：初始 value 非空，formRef 替换为带 requestSubmit 的桩对象。
 * 步骤：
 *  1) 设置 formProps.ref.current 为伪造表单。
 *  2) 调用 formProps.onSubmit 与 actionButtonProps.onSubmit。
 * 断言：
 *  - onSubmit 被调用一次。
 *  - 代理 submit 被触发一次。
 * 边界/异常：
 *  - 再次调用 actionButtonProps.onSubmit 仍可触发 requestSubmit。
 */
test("GivenFilledValue_WhenSubmitting_ThenInvokeHandlersAndProxy", () => {
  const onSubmit = jest.fn();
  const requestSubmit = jest.fn();
  const { result } = renderHook(() =>
    useActionInputBehavior({ value: "hello", onSubmit }),
  );

  act(() => {
    result.current.formProps.ref.current = {
      requestSubmit,
    } as unknown as HTMLFormElement;
  });

  const preventDefault = jest.fn();
  act(() => {
    result.current.formProps.onSubmit({
      preventDefault,
    } as React.FormEvent<HTMLFormElement>);
  });

  act(() => {
    result.current.actionButtonProps.onSubmit();
  });

  expect(preventDefault).toHaveBeenCalledTimes(1);
  expect(onSubmit).toHaveBeenCalledTimes(1);
  expect(requestSubmit).toHaveBeenCalledTimes(1);
});

/**
 * 测试目标：Enter 与 Shift+Enter 的键盘行为分别对应提交与换行。
 * 前置条件：value 非空且 requestSubmit 为桩函数。
 * 步骤：
 *  1) 触发 Enter，检查 preventDefault 与 requestSubmit。
 *  2) 触发 Shift+Enter，确认无额外调用。
 * 断言：
 *  - Enter 时 preventDefault 被调用，requestSubmit 执行。
 *  - Shift+Enter 不触发 preventDefault 与 requestSubmit。
 * 边界/异常：
 *  - 处理 key 属性缺失时不会抛出异常（通过类型断言保障）。
 */
test("GivenKeyboardEvents_WhenPressingEnter_ComplyWithSubmitRules", () => {
  const { result } = renderHook(() =>
    useActionInputBehavior({ value: "draft" }),
  );

  const requestSubmit = jest.fn();
  act(() => {
    result.current.formProps.ref.current = {
      requestSubmit,
    } as unknown as HTMLFormElement;
  });

  const preventDefault = jest.fn();
  act(() => {
    result.current.textareaProps.onKeyDown({
      key: "Enter",
      shiftKey: false,
      preventDefault,
    } as React.KeyboardEvent<HTMLTextAreaElement>);
  });

  expect(preventDefault).toHaveBeenCalledTimes(1);
  expect(requestSubmit).toHaveBeenCalledTimes(1);

  const preventDefaultShift = jest.fn();
  act(() => {
    result.current.textareaProps.onKeyDown({
      key: "Enter",
      shiftKey: true,
      preventDefault: preventDefaultShift,
    } as React.KeyboardEvent<HTMLTextAreaElement>);
  });

  expect(preventDefaultShift).not.toHaveBeenCalled();
  expect(requestSubmit).toHaveBeenCalledTimes(1);
});

/**
 * 测试目标：输入框尺寸在变更时遵循自适应高度与最大行数约束。
 * 前置条件：mock getComputedStyle 返回固定 lineHeight，伪造 scrollHeight。
 * 步骤：
 *  1) 将 textarea 节点绑定至 ref。
 *  2) 触发 onChange，检查 style.height。
 * 断言：
 *  - 高度被限制在 maxRows * lineHeight。
 * 边界/异常：
 *  - 恢复原始 getComputedStyle，避免污染其他用例。
 */
test("GivenAutoResize_WhenContentExceedsMaxRows_ThenClampHeight", () => {
  const originalGetComputedStyle = window.getComputedStyle;
  window.getComputedStyle = jest.fn(() => ({ lineHeight: "24" })) as unknown as typeof window.getComputedStyle;

  const { result } = renderHook(() =>
    useActionInputBehavior({ value: "", maxRows: 3 }),
  );

  const textarea = document.createElement("textarea");
  Object.defineProperty(textarea, "scrollHeight", { value: 160, configurable: true });

  act(() => {
    result.current.textareaProps.ref(textarea);
  });

  act(() => {
    result.current.textareaProps.onChange({
      target: textarea,
    } as React.ChangeEvent<HTMLTextAreaElement>);
  });

  expect(textarea.style.height).toBe("72px");

  window.getComputedStyle = originalGetComputedStyle;
});

/**
 * 测试目标：语言控制区根据是否提供选项决定显隐，并保持归一化后的选项。
 * 前置条件：初始无选项，再 rerender 注入源语言与目标语言选项。
 * 步骤：
 *  1) 断言初始状态 isVisible=false，选项为空数组。
 *  2) rerender 后检查 isVisible=true 且选项长度匹配。
 * 断言：
 *  - 语言区可见性与选项数据同步。
 * 边界/异常：
 *  - 选项传入非数组时回退为空数组。
 */
test("GivenLanguageOptions_WhenProvided_ThenToggleVisibilityAndProps", () => {
  const { result, rerender } = renderHook((props: Parameters<typeof useActionInputBehavior>[0]) =>
    useActionInputBehavior(props),
  {
    initialProps: {
      value: "",
      sourceLanguageOptions: undefined,
      targetLanguageOptions: undefined,
    },
  });

  expect(result.current.languageControls.isVisible).toBe(false);
  expect(result.current.languageControls.props.sourceLanguageOptions).toHaveLength(0);
  expect(result.current.languageControls.props.targetLanguageOptions).toHaveLength(0);

  rerender({
    value: "",
    sourceLanguageOptions: [{ value: "ZH", label: "中文" }],
    targetLanguageOptions: [{ value: "EN", label: "English" }],
  });

  expect(result.current.languageControls.isVisible).toBe(true);
  expect(result.current.languageControls.props.sourceLanguageOptions).toHaveLength(1);
  expect(result.current.languageControls.props.targetLanguageOptions).toHaveLength(1);
});

/**
 * 测试目标：聚焦与失焦事件触发 onFocusChange 回调，确保外部状态机可同步。
 * 前置条件：提供 onFocusChange 桩函数。
 * 步骤：
 *  1) 调用 textareaProps.onFocus。
 *  2) 调用 textareaProps.onBlur。
 * 断言：
 *  - onFocusChange 依次收到 true、false。
 * 边界/异常：
 *  - 回调可选，未提供时不应抛出异常（由类型系统保证）。
 */
test("GivenFocusTransitions_WhenHandlersInvoke_ThenEmitFocusChange", () => {
  const onFocusChange = jest.fn();
  const { result } = renderHook(() =>
    useActionInputBehavior({ value: "", onFocusChange }),
  );

  const focusEvent = createFocusEvent();
  const blurEvent = createFocusEvent();

  act(() => {
    result.current.textareaProps.onFocus(focusEvent);
  });

  act(() => {
    result.current.textareaProps.onBlur(blurEvent);
  });

  const firstPayload = onFocusChange.mock.calls[0][0] as FocusChangeContext;
  const secondPayload = onFocusChange.mock.calls[1][0] as FocusChangeContext;

  expect(firstPayload.isFocused).toBe(true);
  expect(firstPayload.event).toBe(focusEvent);
  expect(secondPayload.isFocused).toBe(false);
  expect(secondPayload.event).toBe(blurEvent);
});

/**
 * 测试目标：restoreFocus 在 textarea 关联后可重新聚焦输入框。
 * 前置条件：创建 DOM textarea 并挂载到 Hook 的 ref。
 * 步骤：
 *  1) 绑定 textarea 至 textareaProps.ref；
 *  2) 模拟按钮调用 restoreFocus；
 * 断言：
 *  - textarea.focus 被调用一次；
 * 边界/异常：
 *  - 若节点缺失则不抛出异常（由实现内提前返回）。
 */
test("GivenTextareaMounted_WhenRestoreFocusInvoked_ThenFocusesTextarea", () => {
  const { result } = renderHook(() =>
    useActionInputBehavior({ value: "draft" }),
  );

  const textarea = document.createElement("textarea");
  const focusSpy = jest.spyOn(textarea, "focus");

  act(() => {
    result.current.textareaProps.ref(textarea);
  });

  act(() => {
    result.current.restoreFocus();
  });

  expect(focusSpy).toHaveBeenCalledTimes(1);
});

