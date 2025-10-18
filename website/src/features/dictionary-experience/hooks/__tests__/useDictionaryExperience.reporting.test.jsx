/**
 * 背景：
 *  - 举报流程需覆盖成功与失败的分支，历史上集中测试文件导致维护困难。
 * 目的：
 *  - 将举报相关行为独立校验，确保 UI 提示与接口交互稳定。
 * 关键决策与取舍：
 *  - 延续既有测试步骤，复用公共 harness 暴露的 mock；
 *  - 通过局部文件拆分降低结构化规则压力。
 * 影响范围：
 *  - 覆盖举报弹窗提交成功与失败的分支提示。
 * 演进与TODO：
 *  - 后续可补充具体错误消息透传、重试逻辑等场景。
 */
import { renderHook, act } from "@testing-library/react";
import { jest } from "@jest/globals";
import {
  useDictionaryExperience,
  submitWordReportMock,
  resetDictionaryExperienceTestState,
  restoreDictionaryExperienceTimers,
} from "../testing/useDictionaryExperienceTestHarness.js";

describe("useDictionaryExperience/reporting", () => {
  beforeEach(() => {
    resetDictionaryExperienceTestState();
  });

  afterEach(() => {
    restoreDictionaryExperienceTimers();
  });

  /**
   * 测试目标：举报成功后应通过 toast 提示成功信息。
   * 前置条件：mock 举报接口返回成功，完成一次查询以激活举报按钮。
   * 步骤：
   *  1) 输入并提交查询文本；
   *  2) 触发举报弹窗并执行提交；
   *  3) 等待提交 Promise 完成。
   * 断言：
   *  - toast.open 为 true 且 message 为 reportSuccess；
   *  - popup 渠道保持关闭以避免重复提示。
   * 边界/异常：
   *  - 错误路径在后续用例覆盖。
   */
  it("shows toast when word issue report submission succeeds", async () => {
    submitWordReportMock.mockResolvedValue({ id: 1 });
    const { result } = renderHook(() => useDictionaryExperience());

    await act(async () => {
      result.current.setText("alpha");
    });

    await act(async () => {
      await result.current.handleSend({ preventDefault: jest.fn() });
    });

    act(() => {
      result.current.dictionaryActionBarProps.onReport();
    });

    await act(async () => {
      await result.current.reportDialogHandlers.submit();
    });

    expect(submitWordReportMock).toHaveBeenCalledWith(
      expect.objectContaining({ term: "alpha" }),
    );
    expect(result.current.toast).toMatchObject({
      open: true,
      message: "报告成功",
    });
    expect(result.current.popupOpen).toBe(false);
  });

  /**
   * 测试目标：举报失败时沿用弹窗渠道提示错误并保持 toast 关闭。
   * 前置条件：mock 举报接口抛出异常。
   * 步骤：
   *  1) 激活举报弹窗；
   *  2) 执行提交触发异常。
   * 断言：
   *  - popupMsg 为 reportFailed；
   *  - toast.open 为 false。
   * 边界/异常：
   *  - 错误消息为空的场景需后续补充。
   */
  it("uses popup channel when word issue report submission fails", async () => {
    submitWordReportMock.mockRejectedValue(new Error("unavailable"));
    const { result } = renderHook(() => useDictionaryExperience());

    await act(async () => {
      result.current.setText("beta");
    });

    await act(async () => {
      await result.current.handleSend({ preventDefault: jest.fn() });
    });

    act(() => {
      result.current.dictionaryActionBarProps.onReport();
    });

    await act(async () => {
      await result.current.reportDialogHandlers.submit();
    });

    expect(result.current.popupMsg).toBe("报告失败");
    expect(result.current.toast.open).toBe(false);
  });
});
