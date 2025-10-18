/**
 * 测试目标：
 *  - 校验 avatarEditorReducer 的状态转移是否符合预期。
 * 前置条件：
 *  - 使用初始状态对象。
 * 步骤：
 *  1) 分别触发 open/startUpload/fail/close 动作；
 *  2) 断言状态字段与期望一致。
 * 断言：
 *  - phase/source/fileName/fileType 对应动作后正确更新。
 * 边界/异常：
 *  - 默认分支返回当前状态。
 */
import {
  avatarEditorInitialState,
  avatarEditorReducer,
  createAvatarEditorInitialState,
} from "../avatarEditorController.js";

describe("avatarEditorReducer", () => {
  it("在 open 动作时进入预览态", () => {
    const next = avatarEditorReducer(avatarEditorInitialState, {
      type: "open",
      payload: { source: "blob:1", fileName: "foo.png", fileType: "image/png" },
    });
    expect(next).toEqual({
      phase: "preview",
      source: "blob:1",
      fileName: "foo.png",
      fileType: "image/png",
    });
  });

  it("在 startUpload 后进入 uploading", () => {
    const preview = avatarEditorReducer(avatarEditorInitialState, {
      type: "open",
      payload: { source: "blob:1", fileName: "foo.png", fileType: "image/png" },
    });
    const uploading = avatarEditorReducer(preview, { type: "startUpload" });
    expect(uploading.phase).toBe("uploading");
  });

  it("在 fail 后回退到 preview", () => {
    const uploading = { ...avatarEditorInitialState, phase: "uploading" };
    const failed = avatarEditorReducer(uploading, { type: "fail" });
    expect(failed.phase).toBe("preview");
  });

  it("在 close 时重置为初始状态", () => {
    const preview = avatarEditorReducer(avatarEditorInitialState, {
      type: "open",
      payload: { source: "blob:1", fileName: "foo.png", fileType: "image/png" },
    });
    const closed = avatarEditorReducer(preview, { type: "close" });
    expect(closed).toEqual(createAvatarEditorInitialState());
  });

  it("遇到未知动作保持原状态", () => {
    const state = { ...avatarEditorInitialState, phase: "preview" };
    const next = avatarEditorReducer(state, { type: "unknown" });
    expect(next).toBe(state);
  });
});
