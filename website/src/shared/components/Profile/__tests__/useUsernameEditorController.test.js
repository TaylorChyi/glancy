/* eslint-env jest */
import { act, renderHook } from "@testing-library/react";
import { jest } from "@jest/globals";
import useUsernameEditorController from "@shared/components/Profile/UsernameEditor/useUsernameEditorController.js";
import { UsernameEditorModes } from "@shared/components/Profile/UsernameEditor/usernameEditorState.js";

const t = {
  usernamePlaceholder: "Enter username",
  changeUsernameButton: "Change username",
  saveUsernameButton: "Save username",
  saving: "Saving...",
  usernameValidationEmpty: "Username is required",
  usernameValidationTooShort: "Username must be at least {{min}} characters",
  usernameValidationTooLong: "Username must be at most {{max}} characters",
  usernameUpdateFailed: "Unable to update username",
};

const createHook = (override = {}) =>
  renderHook((props) => useUsernameEditorController(props), {
    initialProps: {
      username: "taylor",
      emptyDisplayValue: "Not set",
      t,
      ...override,
    },
  });

describe("useUsernameEditorController", () => {
  /**
   * 测试目标：验证初始查看态下的视图模型与 actionDescriptor 回调。
   * 前置条件：用户名为 taylor，并提供 onResolveAction mock。
   * 步骤：
   *  1) 渲染 Hook；
   *  2) 观察返回的视图模型属性。
   * 断言：
   *  - mode 为 VIEW；
   *  - inputProps.disabled 为 true；
   *  - buttonLabel 与 onResolveAction 的标签一致。
   * 边界/异常：
   *  - 覆盖 actionDescriptor 副作用是否被触发。
   */
  test("GivenInitialState_WhenRendered_ThenExposeViewModelAndResolveAction", () => {
    const onResolveAction = jest.fn();
    const { result } = createHook({ onResolveAction });

    expect(result.current.mode).toBe(UsernameEditorModes.VIEW);
    expect(result.current.inputProps.disabled).toBe(true);
    expect(result.current.buttonLabel).toBe(t.changeUsernameButton);
    expect(onResolveAction).toHaveBeenCalledTimes(1);
    expect(onResolveAction.mock.calls[0][0]).toMatchObject({
      label: t.changeUsernameButton,
      mode: UsernameEditorModes.VIEW,
    });
  });

  /**
   * 测试目标：确认点击按钮后切换到编辑态并允许输入。
   * 前置条件：使用默认 props。
   * 步骤：
   *  1) 执行按钮点击；
   *  2) 检查 mode 与 inputProps.disabled。
   * 断言：
   *  - mode 切换为 EDIT；
   *  - 输入不再禁用。
   * 边界/异常：
   *  - 验证按钮点击行为来自返回的 buttonProps。
   */
  test("GivenViewMode_WhenTriggerButton_ThenEnterEditMode", () => {
    const { result } = createHook();

    act(() => {
      result.current.buttonProps.onClick();
    });

    expect(result.current.mode).toBe(UsernameEditorModes.EDIT);
    expect(result.current.inputProps.disabled).toBe(false);
  });

  /**
   * 测试目标：确认编辑后保存成功会返回查看态并清理错误。
   * 前置条件：使用默认 props（无 onSubmit，自行保存）。
   * 步骤：
   *  1) 进入编辑态；
   *  2) 修改输入值并再次点击按钮保存；
   *  3) 读取最新视图模型。
   * 断言：
   *  - mode 回到 VIEW；
   *  - inputProps.value 为去除空白后的新值；
   *  - buttonLabel 恢复为 change 按钮文案。
   * 边界/异常：
   *  - 覆盖草稿保存路径中的 normalize 逻辑。
   */
  test("GivenDraftUpdated_WhenSaving_ThenNormalizeAndResetView", () => {
    const { result } = createHook();

    act(() => {
      result.current.buttonProps.onClick();
    });

    act(() => {
      result.current.inputProps.onChange({ target: { value: "  glancy  " } });
    });

    act(() => {
      result.current.buttonProps.onClick();
    });

    expect(result.current.mode).toBe(UsernameEditorModes.VIEW);
    expect(result.current.inputProps.value).toBe("glancy");
    expect(result.current.buttonLabel).toBe(t.changeUsernameButton);
  });
});
