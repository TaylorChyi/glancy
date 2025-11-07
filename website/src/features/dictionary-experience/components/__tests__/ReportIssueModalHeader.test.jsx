/* eslint-env jest */
import { render, screen, fireEvent } from "@testing-library/react";
import { jest } from "@jest/globals";

import ReportIssueModalHeader from "../ReportIssueModalHeader.jsx";
import styles from "../ReportIssueModal.module.css";


describe("ReportIssueModalHeader", () => {
  /**
   * 测试目标：验证关闭按钮具备正确的 aria-label，并在点击时委托给 onClose。
   * 前置条件：提供最小化的标题、id 与关闭回调。
   * 步骤：
   *  1) 渲染组件；
   *  2) 查找关闭按钮并触发点击；
   *  3) 断言按钮类名与回调执行。
   * 断言：
   *  - 关闭按钮拥有 header-close 类；
   *  - onClose 被调用一次。
   * 边界/异常：
   *  - 不涉及键盘交互，后续可补充。
   */
  test("renders accessible close control and delegates click", () => {
    const handleClose = jest.fn();

    render(
      <ReportIssueModalHeader
        headingId="heading-42"
        title="Report issue"
        closeLabel="关闭"
        onClose={handleClose}
      />,
    );

    const closeButton = screen.getByRole("button", { name: "关闭" });
    fireEvent.click(closeButton);

    expect(closeButton).toHaveClass(styles["header-close"]);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  /**
   * 测试目标：确保标题使用外部传入的 headingId，维持与 SettingsSurface 的 aria 关联。
   * 前置条件：提供唯一 id 与标题文案。
   * 步骤：
   *  1) 渲染组件；
   *  2) 通过标题文本查找对应元素；
   *  3) 检查元素 id 与父级类名。
   * 断言：
   *  - 标题元素 id 匹配传入的 headingId；
   *  - 标题父级具备 header 样式类。
   * 边界/异常：
   *  - 不包含描述插槽，后续扩展时需新增用例。
   */
  test("binds provided heading id to title semantics", () => {
    render(
      <ReportIssueModalHeader
        headingId="heading-24"
        title="举报"
        closeLabel="关闭"
        onClose={jest.fn()}
      />,
    );

    const heading = screen.getByRole("heading", { name: "举报" });
    expect(heading).toHaveAttribute("id", "heading-24");
    expect(heading.parentElement).toHaveClass(styles.header);
  });
});
