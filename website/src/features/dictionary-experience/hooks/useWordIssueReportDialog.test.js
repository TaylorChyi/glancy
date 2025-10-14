import { act, renderHook } from "@testing-library/react";
import { jest } from "@jest/globals";

const submitWordReportMock = jest.fn();

jest.unstable_mockModule("@shared/hooks/useApi.js", () => ({
  useApi: () => ({ wordReports: { submitWordReport: submitWordReportMock } }),
}));

const userState = { user: { token: "token" } };

jest.unstable_mockModule("@core/context", () => ({
  useUser: () => userState,
}));

const { useWordIssueReportDialog } = await import(
  "./useWordIssueReportDialog.js"
);

beforeEach(() => {
  submitWordReportMock.mockReset();
  userState.user = { token: "token" };
});

/**
 * 测试目标：openDialog 应激活弹窗并重置默认表单状态。
 * 前置条件：初始状态关闭、表单为空。
 * 步骤：
 *  1) 调用 openDialog 传入词条上下文；
 * 断言：
 *  - open 为 true；
 *  - category 为默认值。
 * 边界/异常：
 *  - context.term 为空时不会开启（此用例未覆盖）。
 */
test("openDialog activates modal with default form", () => {
  const { result } = renderHook(() => useWordIssueReportDialog());

  act(() => {
    result.current.openDialog({
      term: "hello",
      language: "ENGLISH",
      flavor: "BILINGUAL",
    });
  });

  expect(result.current.state.open).toBe(true);
  expect(result.current.state.form.category).toBe("INCORRECT_MEANING");
});

/**
 * 测试目标：submit 在表单打开时会调用 API 并关闭弹窗。
 * 前置条件：mock API 返回成功 Promise。
 * 步骤：
 *  1) openDialog 打开表单；
 *  2) 调用 submit；
 *  3) 等待 Promise 结算。
 * 断言：
 *  - submitWordReport 被调用一次，包含词条信息；
 *  - 最终状态 open 为 false。
 * 边界/异常：
 *  - API 抛错时会记录 error（此用例未覆盖）。
 */
test("submit persists report and closes dialog", async () => {
  submitWordReportMock.mockResolvedValue({ id: 1 });
  const { result } = renderHook(() => useWordIssueReportDialog());

  act(() => {
    result.current.openDialog({
      term: "world",
      language: "CHINESE",
      flavor: "BILINGUAL",
    });
  });

  await act(async () => {
    await result.current.submit();
  });

  expect(submitWordReportMock).toHaveBeenCalledTimes(1);
  expect(submitWordReportMock.mock.calls[0][0]).toMatchObject({
    term: "world",
    language: "CHINESE",
  });
  expect(result.current.state.open).toBe(false);
});
