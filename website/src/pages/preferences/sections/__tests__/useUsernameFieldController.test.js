/* eslint-env jest */
import { jest } from "@jest/globals";
import { renderHook, act, waitFor } from "@testing-library/react";
import useUsernameFieldController from "../useUsernameFieldController.js";

const BASE_MESSAGES = Object.freeze({
  required: "用户名不能为空",
  invalid: "用户名格式错误",
  conflict: "用户名已存在",
  generic: "保存失败",
});

/**
 * 测试目标：初始渲染时应处于查看态，点击按钮切换至编辑态并清空错误。
 * 前置条件：用户名初始值为 taylor，持久化函数为 mock。
 * 步骤：
 *  1) 渲染 Hook；
 *  2) 触发 onSubmit（首次点击视为进入编辑态）；
 * 断言：
 *  - 初始按钮文案为“更换”；
 *  - 切换后 mode=edit 且错误消息清空。
 * 边界/异常：
 *  - 若已处于 edit，再次触发 onSubmit 应执行校验（其他用例覆盖）。
 */
test("GivenViewState_WhenToggling_ThenEnterEditMode", () => {
  const persist = jest.fn();
  const { result } = renderHook(() =>
    useUsernameFieldController({
      username: "taylor",
      fallbackValue: "未设置",
      changeLabel: "更换",
      saveLabel: "保存",
      placeholder: "请输入用户名",
      messages: BASE_MESSAGES,
      persistUsername: persist,
    }),
  );

  expect(result.current.displayValue).toBe("taylor");
  expect(result.current.controller.buttonLabel).toBe("更换");

  act(() => {
    result.current.controller.onSubmit();
  });

  expect(result.current.controller.mode).toBe("edit");
  expect(result.current.controller.errorMessage).toBe("");
});

/**
 * 测试目标：编辑态输入非法用户名时应阻断保存并反馈错误。
 * 前置条件：保持默认 mock 持久化函数。
 * 步骤：
 *  1) 进入编辑态；
 *  2) 输入不符合规则的用户名；
 *  3) 触发提交。
 * 断言：
 *  - errorMessage 为 invalid 文案；
 *  - 未调用持久化函数。
 * 边界/异常：
 *  - required 文案在输入空值时触发（此处覆盖 invalid 分支）。
 */
test("GivenInvalidDraft_WhenSubmitting_ThenPreventPersist", () => {
  const persist = jest.fn();
  const { result } = renderHook(() =>
    useUsernameFieldController({
      username: "taylor",
      fallbackValue: "未设置",
      changeLabel: "更换",
      saveLabel: "保存",
      placeholder: "请输入用户名",
      messages: BASE_MESSAGES,
      persistUsername: persist,
    }),
  );

  act(() => {
    result.current.controller.onSubmit();
  });

  act(() => {
    result.current.controller.onChange({ target: { value: "ab" } });
  });

  act(() => {
    result.current.controller.onSubmit();
  });

  expect(result.current.controller.errorMessage).toBe(BASE_MESSAGES.invalid);
  expect(persist).not.toHaveBeenCalled();
});

/**
 * 测试目标：当输入合规且保存成功时，应更新展示值并回到查看态。
 * 前置条件：持久化函数返回 Promise.resolve("new_user")。
 * 步骤：
 *  1) 进入编辑态；
 *  2) 输入 new_user；
 *  3) 触发提交并等待 Promise 解析。
 * 断言：
 *  - displayValue 更新为 new_user；
 *  - mode 回到 view；
 *  - 错误消息为空。
 * 边界/异常：
 *  - 异步过程中 mode 会短暂为 saving（无需额外断言）。
 */
test("GivenValidDraft_WhenPersistSucceeds_ThenResetViewState", async () => {
  const persist = jest.fn().mockResolvedValue("new_user");
  const { result } = renderHook(() =>
    useUsernameFieldController({
      username: "taylor",
      fallbackValue: "未设置",
      changeLabel: "更换",
      saveLabel: "保存",
      placeholder: "请输入用户名",
      messages: BASE_MESSAGES,
      persistUsername: persist,
    }),
  );

  act(() => {
    result.current.controller.onSubmit();
  });

  act(() => {
    result.current.controller.onChange({ target: { value: "new_user" } });
  });

  await act(async () => {
    await result.current.controller.onSubmit();
  });

  expect(persist).toHaveBeenCalledWith("new_user");
  await waitFor(() => {
    expect(result.current.displayValue).toBe("new_user");
    expect(result.current.controller.mode).toBe("view");
    expect(result.current.controller.errorMessage).toBe("");
  });
});

/**
 * 测试目标：持久化返回 409 错误时，应维持编辑态并给出占用提示。
 * 前置条件：持久化函数 Promise 拒绝，error.status=409。
 * 步骤：
 *  1) 进入编辑态并输入合法用户名；
 *  2) 提交触发 reject。
 * 断言：
 *  - errorMessage 为 conflict 文案；
 *  - mode 保持 edit；
 *  - displayValue 未被修改。
 * 边界/异常：
 *  - 其他错误分支在通用提示中处理（未在本用例覆盖）。
 */
test("GivenConflictError_WhenPersisting_ThenStayInEditWithConflictMessage", async () => {
  const persist = jest.fn().mockRejectedValue({ status: 409 });
  const { result } = renderHook(() =>
    useUsernameFieldController({
      username: "taylor",
      fallbackValue: "未设置",
      changeLabel: "更换",
      saveLabel: "保存",
      placeholder: "请输入用户名",
      messages: BASE_MESSAGES,
      persistUsername: persist,
    }),
  );

  act(() => {
    result.current.controller.onSubmit();
  });

  act(() => {
    result.current.controller.onChange({ target: { value: "another_user" } });
  });

  await act(async () => {
    await result.current.controller.onSubmit();
  });

  expect(result.current.controller.errorMessage).toBe(BASE_MESSAGES.conflict);
  expect(result.current.controller.mode).toBe("edit");
  expect(result.current.displayValue).toBe("taylor");
});
