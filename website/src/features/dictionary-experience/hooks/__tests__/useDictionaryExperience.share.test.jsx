/**
 * 背景：
 *  - 分享菜单需协调链接生成、图片导出等多通道能力，历史集中测试难以扩展。
 * 目的：
 *  - 独立验证分享链接复制、图片导出及降级提示路径，确保用户反馈一致。
 * 关键决策与取舍：
 *  - 引入公共辅助方法压缩重复步骤，同时保持断言语义清晰；
 *  - 依赖共享 harness 保持上下文一致，便于其他测试文件复用。
 * 影响范围：
 *  - 覆盖分享模型暴露的复制/导出行为及异常提示。
 * 演进与TODO：
 *  - 后续可扩展到社交分享、第三方渠道等路径的降级策略。
 */
import { renderHook, act } from "@testing-library/react";
import { jest } from "@jest/globals";
import {
  useDictionaryExperience,
  mockStreamWord,
  shareImageModule,
  utilsModule,
  createStreamFromChunks,
  resetDictionaryExperienceTestState,
  restoreDictionaryExperienceTimers,
} from "../testing/useDictionaryExperienceTestHarness.js";

/**
 * 意图：触发查询以构建 shareModel，复用在多个用例中。
 * 输入：term 为查询词，streamChunk 为可选的生成器数据。
 * 输出：返回渲染结果，方便调用 shareModel 上的方法。
 * 流程：
 *  1) 通过 setText 写入查询；
 *  2) 执行 handleSend 以生成 shareModel；
 *  3) 等待异步流程完成。
 * 错误处理：异常直接抛出。
 * 复杂度：O(n)，n 为流式输出次数，本场景为 0 或 1。
 */
const prepareShareModel = async ({ term, streamChunk = null }) => {
  if (streamChunk) {
    mockStreamWord.mockImplementation(() =>
      createStreamFromChunks(streamChunk),
    );
  }

  const { result } = renderHook(() => useDictionaryExperience());

  await act(async () => {
    result.current.setText(term);
  });

  await act(async () => {
    await result.current.handleSend({ preventDefault: jest.fn() });
  });

  return result;
};

describe("useDictionaryExperience/share model", () => {
  beforeEach(() => {
    resetDictionaryExperienceTestState();
  });

  afterEach(() => {
    restoreDictionaryExperienceTimers();
  });

  /**
   * 测试目标：当词条激活时复制分享链接应调用剪贴板并弹出提示。
   * 前置条件：设置查询文本并执行 handleSend。
   * 步骤：
   *  1) 通过辅助方法准备 shareModel；
   *  2) 调用 shareModel.onCopyLink。
   * 断言：
   *  - copyTextToClipboard 收到分享地址；
   *  - popupMsg 更新为 shareCopySuccess。
   */
  it("copies share link through clipboard when shareModel provided", async () => {
    const result = await prepareShareModel({ term: "lumen" });

    const shareModel = result.current.dictionaryActionBarProps.shareModel;
    expect(shareModel).not.toBeNull();

    await act(async () => {
      await shareModel.onCopyLink();
    });

    expect(utilsModule.copyTextToClipboard).toHaveBeenCalledWith(
      "https://example.com",
    );
    expect(result.current.popupMsg).toBe("复制链接");
  });

  /**
   * 测试目标：导出图片时应调用导出器并反馈成功。
   * 前置条件：模拟流式返回以生成 finalText，配置导出成功结果。
   * 步骤：
   *  1) 构造包含 Markdown 的流数据；
   *  2) 调用 shareModel.onExportImage。
   * 断言：
   *  - exportDictionaryShareImage 被调用且携带 term；
   *  - popupMsg 更新为 shareImageSuccess。
   */
  it("exports share image via exporter when data ready", async () => {
    shareImageModule.exportDictionaryShareImage.mockResolvedValue({
      status: "success",
    });
    const result = await prepareShareModel({
      term: "prism",
      streamChunk: { chunk: "## Heading" },
    });

    const shareModel = result.current.dictionaryActionBarProps.shareModel;
    expect(shareModel).not.toBeNull();

    await act(async () => {
      await shareModel.onExportImage();
    });

    expect(shareImageModule.exportDictionaryShareImage).toHaveBeenCalledWith(
      expect.objectContaining({ term: "prism" }),
    );
    expect(result.current.popupMsg).toBe("图片导出完成");
  });

  /**
   * 测试目标：当分享链接暂未生成但释义内容可导出时，分享菜单仍需保持可点状态。
   * 前置条件：resolveShareTarget 返回空串，流式输出生成 finalText。
   * 步骤：
   *  1) 使用辅助方法准备 shareModel；
   *  2) 调用 shareModel.onCopyLink 触发降级提示。
   * 断言：
   *  - shareModel.canShare 为 true；
   *  - copyTextToClipboard 未被调用且弹窗提示 shareFailed。
   * 边界/异常：
   *  - 若链接恢复生成应由其他用例验证复制成功路径。
   */
  it("keeps share menu enabled when link missing but image export ready", async () => {
    utilsModule.resolveShareTarget.mockReturnValueOnce("");
    const result = await prepareShareModel({
      term: "spectrum",
      streamChunk: { chunk: "## Heading" },
    });

    const shareModel = result.current.dictionaryActionBarProps.shareModel;
    expect(shareModel).not.toBeNull();
    expect(shareModel.canShare).toBe(true);

    await act(async () => {
      await shareModel.onCopyLink();
    });

    expect(utilsModule.copyTextToClipboard).not.toHaveBeenCalled();
    expect(result.current.popupMsg).toBe("分享失败");
  });
});
