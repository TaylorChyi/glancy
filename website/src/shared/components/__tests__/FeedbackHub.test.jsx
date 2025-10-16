/* eslint-env jest */
import { jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react";
import FeedbackHub from "@shared/components/ui/FeedbackHub";

describe("FeedbackHub", () => {
  /**
   * 测试目标：验证 FeedbackHub 能同时渲染弹窗与轻提示策略。
   * 前置条件：提供开启状态的 popup 与 toast 配置。
   * 步骤：
   *  1) 渲染 FeedbackHub 并传入弹窗与 Toast 配置。
   *  2) 读取 alertdialog 与 status 角色的可访问节点。
   * 断言：
   *  - 弹窗文案与轻提示文案均正确渲染。
   * 边界/异常：
   *  - message 为空字符串时仍应渲染默认结构。
   */
  test("renders popup and toast surfaces", () => {
    const handlePopupClose = jest.fn();
    const handleToastClose = jest.fn();

    render(
      <FeedbackHub
        popup={{
          open: true,
          message: "操作成功",
          onClose: handlePopupClose,
        }}
        toast={{
          open: true,
          message: "已保存至词典",
          onClose: handleToastClose,
        }}
      />,
    );

    expect(screen.getByRole("alertdialog")).toHaveTextContent("操作成功");
    expect(screen.getByRole("status")).toHaveTextContent("已保存至词典");
  });

  /**
   * 测试目标：确保策略可以通过 renderActions 自定义弹窗行为。
   * 前置条件：传入 popup.renderActions 生成升级按钮。
   * 步骤：
   *  1) 渲染 FeedbackHub 并提供 renderActions 回调。
   *  2) 触发自定义按钮点击事件。
   * 断言：
   *  - renderActions 渲染的按钮存在且点击时触发自定义逻辑。
   * 边界/异常：
   *  - 当回调抛出异常时，由测试框架捕获（此处不触发）。
   */
  test("supports renderActions strategy for popup", () => {
    const handleUpgrade = jest.fn();

    render(
      <FeedbackHub
        popup={{
          open: true,
          message: "需要升级",
          onClose: jest.fn(),
          renderActions: () => (
            <button type="button" onClick={handleUpgrade}>
              立即升级
            </button>
          ),
        }}
      />,
    );

    const upgradeButton = screen.getByRole("button", { name: "立即升级" });
    fireEvent.click(upgradeButton);
    expect(handleUpgrade).toHaveBeenCalledTimes(1);
  });
});
