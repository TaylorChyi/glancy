import { jest } from "@jest/globals";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockUseLanguage = jest.fn();
const mockUseUser = jest.fn();
const mockUseTheme = jest.fn();
const mockUseKeyboardShortcutContext = jest.fn();

jest.unstable_mockModule("@/context", () => ({
  useLanguage: mockUseLanguage,
  useUser: mockUseUser,
  useTheme: mockUseTheme,
  useKeyboardShortcutContext: mockUseKeyboardShortcutContext,
  KEYBOARD_SHORTCUT_RESET_ACTION: "__RESET__",
}));

let AvatarEditorDialog;

describe("AvatarEditorDialog", () => {
  const translations = {
    avatarEditorTitle: "Adjust avatar",
    avatarEditorInstruction:
      "Drag and zoom the image. The circle shows how your avatar will appear.",
    avatarEditorZoomLabel: "Zoom",
    avatarEditorZoomIn: "Zoom in",
    avatarEditorZoomOut: "Zoom out",
    avatarEditorCancel: "Cancel",
    avatarEditorConfirm: "Save avatar",
    avatarEditorProcessing: "Saving…",
    avatarEditorPreparing: "Preparing preview…",
    avatarEditorError: "We couldn't save your avatar. Try again.",
    avatarEditorPreviewLabel: "Avatar preview",
    avatarEditorPreviewAlt: "Avatar preview",
  };

  let originalCreateElement;
  let canvasContext;

  beforeAll(async () => {
    ({ default: AvatarEditorDialog } = await import("../AvatarEditorDialog.jsx"));
  });

  beforeEach(() => {
    mockUseLanguage.mockReset();
    mockUseUser.mockReset();
    mockUseTheme.mockReset();
    mockUseKeyboardShortcutContext.mockReset();
    mockUseLanguage.mockReturnValue({ t: translations });
    mockUseUser.mockReturnValue({ user: null, setUser: jest.fn() });
    mockUseTheme.mockReturnValue({ theme: "light", setTheme: jest.fn() });
    mockUseKeyboardShortcutContext.mockReturnValue({
      register: jest.fn(),
      unregister: jest.fn(),
    });
    originalCreateElement = document.createElement.bind(document);
    canvasContext = {
      clearRect: jest.fn(),
      drawImage: jest.fn(),
    };
    document.createElement = (tagName, options) => {
      if (tagName === "canvas") {
        return {
          width: 0,
          height: 0,
          getContext: jest.fn().mockReturnValue(canvasContext),
          toBlob: jest.fn((callback) =>
            callback(new Blob(["cropped"], { type: "image/png" })),
          ),
        };
      }
      return originalCreateElement(tagName, options);
    };
  });

  afterEach(() => {
    document.createElement = originalCreateElement;
  });

  /**
   * 测试目标：在 ready 状态点击确认应调用 handleConfirm 并传入裁剪后的 Blob。
   * 前置条件：提供 320x320 的裁剪上下文，toBlob 回调返回 Blob。
   * 步骤：
   *  1) 渲染组件；
   *  2) 点击 Save avatar 按钮。
   * 断言：
   *  - handleConfirm 收到 Blob；
   *  - drawImage 被调用一次。
   * 边界/异常：
   *  - 若 canvas 不可用则测试应失败，从而提醒环境缺失依赖。
   */
  test("GivenReadyState_WhenConfirm_ThenInvokesHandleConfirmWithBlob", async () => {
    const handleConfirm = jest.fn().mockResolvedValue(true);
    const handleCancel = jest.fn();

    render(
      <AvatarEditorDialog
        editor={{
          open: true,
          status: "ready",
          imageUrl: "data:image/png;base64,AAAA",
          imageWidth: 320,
          imageHeight: 320,
          fileName: "avatar.png",
          mimeType: "image/png",
          isPreparing: false,
          isProcessing: false,
          handleCancel,
          handleConfirm,
        }}
      />,
    );

    const confirmButton = await screen.findByRole("button", {
      name: translations.avatarEditorConfirm,
    });

    await act(async () => {
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(handleConfirm).toHaveBeenCalledTimes(1);
    });
    const [blobArg] = handleConfirm.mock.calls[0];
    expect(blobArg).toBeInstanceOf(Blob);
    expect(canvasContext.drawImage).toHaveBeenCalled();
  });

  /**
   * 测试目标：loading 状态应展示占位文案且禁用操作按钮。
   * 前置条件：editor.status 为 loading。
   * 步骤：
   *  1) 渲染组件；
   *  2) 获取按钮与占位文本。
   * 断言：
   *  - 出现 Preparing preview… 文案；
   *  - Save avatar 按钮被禁用。
   * 边界/异常：
   *  - 确保禁用态下点击不会触发 handleConfirm。
   */
  test("GivenLoadingState_WhenRender_ThenShowsPlaceholderAndDisablesActions", () => {
    const handleConfirm = jest.fn();
    const handleCancel = jest.fn();

    render(
      <AvatarEditorDialog
        editor={{
          open: true,
          status: "loading",
          imageUrl: "",
          imageWidth: 0,
          imageHeight: 0,
          fileName: "avatar.png",
          mimeType: "image/png",
          isPreparing: true,
          isProcessing: false,
          handleCancel,
          handleConfirm,
        }}
      />,
    );

    expect(screen.getByText(translations.avatarEditorPreparing)).toBeInTheDocument();
    const confirmButton = screen.getByRole("button", {
      name: translations.avatarEditorConfirm,
    });
    expect(confirmButton).toBeDisabled();
    fireEvent.click(confirmButton);
    expect(handleConfirm).not.toHaveBeenCalled();
  });

  /**
   * 测试目标：点击取消按钮应调用 handleCancel。
   * 前置条件：editor.open 为 true。
   * 步骤：
   *  1) 渲染组件；
   *  2) 点击 Cancel 按钮。
   * 断言：
   *  - handleCancel 被调用一次。
   * 边界/异常：
   *  - 若按钮禁用则不应触发。
   */
  test("GivenOpenDialog_WhenCancel_ThenInvokesHandleCancel", () => {
    const handleConfirm = jest.fn();
    const handleCancel = jest.fn();

    render(
      <AvatarEditorDialog
        editor={{
          open: true,
          status: "ready",
          imageUrl: "data:image/png;base64,AAAA",
          imageWidth: 320,
          imageHeight: 320,
          fileName: "avatar.png",
          mimeType: "image/png",
          isPreparing: false,
          isProcessing: false,
          handleCancel,
          handleConfirm,
        }}
      />,
    );

    const cancelButtons = screen.getAllByRole("button", {
      name: translations.avatarEditorCancel,
    });
    const actionCancelButton = cancelButtons[cancelButtons.length - 1];
    fireEvent.click(actionCancelButton);
    expect(handleCancel).toHaveBeenCalledTimes(1);
  });
});
