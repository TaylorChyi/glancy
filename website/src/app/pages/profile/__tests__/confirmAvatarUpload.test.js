/* eslint-env jest */
import { jest } from "@jest/globals";
import confirmAvatarUpload from "../confirmAvatarUpload.js";

class MockFile extends Blob {
  constructor(parts, name, options = {}) {
    super(parts, options);
    this.name = name;
  }
}

const originalFile = global.File;

const mockBrowserSpies = () => {
  const originalRevoke = URL.revokeObjectURL;
  if (!originalRevoke) {
    URL.revokeObjectURL = () => {};
  }
  const revokeSpy = jest
    .spyOn(URL, "revokeObjectURL")
    .mockImplementation(() => {});
  const consoleSpy = jest
    .spyOn(console, "error")
    .mockImplementation(() => {});

  return {
    revokeSpy,
    restore: () => {
      consoleSpy.mockRestore();
      revokeSpy.mockRestore();
      if (!originalRevoke) {
        URL.revokeObjectURL = originalRevoke;
      }
    },
  };
};

const buildUploadFailureScenario = () => {
  const uploadError = new Error("network error");
  const api = {
    users: {
      uploadAvatar: jest.fn().mockRejectedValue(uploadError),
    },
  };
  const notifyFailure = jest.fn();
  const dispatch = jest.fn();
  const setAvatar = jest.fn();
  const setUser = jest.fn();
  const previousAvatarRef = { current: "" };
  const editorState = jest.fn().mockReturnValue({
    fileName: "avatar.png",
    fileType: "image/png",
  });
  const serverAvatar = "server-avatar.png";
  const currentAvatar = jest.fn().mockReturnValue(serverAvatar);
  const blob = new Blob(["binary"], { type: "image/png" });
  const previewUrl = "blob:preview";
  const { revokeSpy, restore } = mockBrowserSpies();

  return {
    uploadArgs: { blob, previewUrl },
    confirmOptions: {
      api,
      currentUser: { id: "user-1", token: "token" },
      editorState,
      currentAvatar,
      setAvatar,
      setUser,
      dispatch,
      previousAvatarRef,
      notifyFailure,
    },
    expectations: {
      dispatch,
      setAvatar,
      notifyFailure,
      setUser,
      previousAvatarRef,
      previewUrl,
      revokeSpy,
      serverAvatar,
    },
    restoreSpies: restore,
  };
};

beforeAll(() => {
  global.File = MockFile;
});

afterAll(() => {
  global.File = originalFile;
});

describe("confirmAvatarUpload", () => {
  it("rolls back to the previous avatar when the upload fails", async () => {
    const { uploadArgs, confirmOptions, expectations, restoreSpies } =
      buildUploadFailureScenario();

    await confirmAvatarUpload(uploadArgs, confirmOptions);

    const {
      dispatch,
      setAvatar,
      notifyFailure,
      setUser,
      previousAvatarRef,
      previewUrl,
      revokeSpy,
      serverAvatar,
    } = expectations;

    expect(dispatch).toHaveBeenNthCalledWith(1, { type: "startUpload" });
    expect(setAvatar).toHaveBeenNthCalledWith(1, previewUrl);
    expect(notifyFailure).toHaveBeenCalledTimes(1);
    expect(setAvatar).toHaveBeenNthCalledWith(2, serverAvatar);
    expect(dispatch).toHaveBeenLastCalledWith({ type: "fail" });
    expect(previousAvatarRef.current).toBe("");
    expect(setUser).not.toHaveBeenCalled();
    expect(revokeSpy).toHaveBeenCalledWith(previewUrl);

    restoreSpies();
  });
});
