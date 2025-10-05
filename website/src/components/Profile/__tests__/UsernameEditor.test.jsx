/* eslint-env jest */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { jest } from "@jest/globals";
import UsernameEditor from "@/components/Profile/UsernameEditor";
import styles from "@/components/Profile/UsernameEditor/UsernameEditor.module.css";

const t = {
  usernamePlaceholder: "Enter username",
  changeUsernameButton: "Change username",
  saveUsernameButton: "Save username",
  saving: "Saving...",
  usernameValidationEmpty: "Username is required",
  usernameValidationTooShort: "Username must be at least {{min}} characters",
  usernameValidationTooLong: "Username must be at most {{max}} characters",
  usernameUpdateFailed: "Unable to update username",
  usernameUpdateSuccess: "Username updated successfully",
};

function renderEditor(props = {}) {
  return render(
    <UsernameEditor username="taylor" emptyDisplayValue="Not set" t={t} {...props} />,
  );
}

describe("UsernameEditor", () => {
  /**
   * 测试目标：验证从查看态切换到编辑态后可以提交并恢复到查看态。
   * 前置条件：初始用户名为 taylor，提供成功解析的 onSubmit。
   * 步骤：
   *  1) 点击“Change username”进入编辑；
   *  2) 修改输入并点击“Save username”。
   * 断言：
   *  - onSubmit 收到修剪后的用户名；
   *  - 交互结束后按钮文案回到“Change username”。
   * 边界/异常：
   *  - 包含对按钮禁用与输入禁用状态的校验。
   */
  test("switches to edit mode and saves successfully", async () => {
    const handleSubmit = jest.fn().mockResolvedValue("taylor.glancy");
    renderEditor({ onSubmit: handleSubmit });

    const button = screen.getByRole("button", { name: "Change username" });
    const input = screen.getByPlaceholderText("Enter username");

    expect(input).toBeDisabled();
    expect(input).toHaveValue("taylor");

    fireEvent.click(button);
    expect(input).not.toBeDisabled();

    fireEvent.change(input, { target: { value: "  taylor.glancy  " } });
    fireEvent.click(screen.getByRole("button", { name: "Save username" }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith("taylor.glancy");
      expect(
        screen.getByRole("button", { name: "Change username" }),
      ).toBeInTheDocument();
    });
  });

  /**
   * 测试目标：确保非法用户名会给出错误提示并阻止提交。
   * 前置条件：未提供 onSubmit（默认退化逻辑）。
   * 步骤：
   *  1) 进入编辑态并输入过短用户名；
   *  2) 点击保存按钮。
   * 断言：
   *  - 显示最小长度提示；
   *  - 输入框具有错误样式与 aria 属性。
   * 边界/异常：
   *  - 验证不会调用 onSubmit。
   */
  test("renders validation error for short usernames", async () => {
    const handleSubmit = jest.fn();
    renderEditor({ onSubmit: handleSubmit });

    fireEvent.click(screen.getByRole("button", { name: "Change username" }));
    const input = screen.getByPlaceholderText("Enter username");
    fireEvent.change(input, { target: { value: "ab" } });
    fireEvent.click(screen.getByRole("button", { name: "Save username" }));

    expect(handleSubmit).not.toHaveBeenCalled();
    const error = await screen.findByText(/at least 3 characters/);
    expect(error).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveClass(styles.input, styles["input-invalid"]);
  });

  /**
   * 测试目标：验证服务端返回错误时可透传信息并展示错误态。
   * 前置条件：onSubmit 拒绝并返回特定错误消息。
   * 步骤：
   *  1) 进入编辑态并输入合法用户名；
   *  2) 点击保存触发 onSubmit 拒绝。
   * 断言：
   *  - 页面展示来自错误对象的消息；
   *  - 输入保持在编辑态且带有错误样式。
   * 边界/异常：
   *  - 涵盖异步错误处理。
   */
  test("surfaces server errors inline", async () => {
    const handleSubmit = jest.fn().mockRejectedValue(new Error("用户名已存在"));
    renderEditor({ onSubmit: handleSubmit });

    fireEvent.click(screen.getByRole("button", { name: "Change username" }));
    const input = screen.getByPlaceholderText("Enter username");
    fireEvent.change(input, { target: { value: "glancy" } });
    fireEvent.click(screen.getByRole("button", { name: "Save username" }));

    const error = await screen.findByText("用户名已存在");
    expect(error).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveClass(styles.input, styles["input-invalid"]);
  });

  /**
   * 测试目标：当用户名为空时应展示占位值且进入编辑后清空输入。
   * 前置条件：传入 username 为空字符串，并提供 emptyDisplayValue。
   * 步骤：
   *  1) 渲染组件并验证查看态显示占位文本；
   *  2) 点击按钮进入编辑态；
   *  3) 验证输入框被清空。
   * 断言：
   *  - 查看态 input value 为占位值；
   *  - 编辑态 input value 为空字符串。
   * 边界/异常：
   *  - 若缺失 emptyDisplayValue，应维持空字符串（由默认逻辑覆盖）。
   */
  test("renders empty display value while keeping edit draft clean", () => {
    render(
      <UsernameEditor
        username=""
        emptyDisplayValue="Not set"
        t={t}
        onSubmit={jest.fn()}
      />,
    );

    const button = screen.getByRole("button", { name: "Change username" });
    const input = screen.getByDisplayValue("Not set");
    expect(input).toBeDisabled();

    fireEvent.click(button);
    const editableInput = screen.getByPlaceholderText("Enter username");
    expect(editableInput).toHaveValue("");
  });
});
