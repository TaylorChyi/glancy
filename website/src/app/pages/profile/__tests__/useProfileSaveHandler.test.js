/**
 * 测试目标：
 *  - 验证 useProfileSaveHandler 在提交成功与失败时的行为。
 * 前置条件：
 *  - 伪造 api、currentUser、details、persistedMeta。
 * 步骤：
 *  1) 成功路径：phone 变化触发 updateContact，保存 profile，并提示成功；
 *  2) 失败路径：保存抛错，提示失败。
 * 断言：
 *  - setUser/Popup 调用次数与参数正确，isSaving 状态回落。
 * 边界/异常：
 *  - 空用户直接返回。
 */
import { jest } from "@jest/globals";
import { renderHook, act } from "@testing-library/react";
import { useProfileSaveHandler } from "../useProfileSaveHandler.js";

const createEvent = () => ({ preventDefault: jest.fn() });

const t = {
  updateSuccess: "update-success",
  fail: "fail",
};

const currentUser = {
  id: "user-1",
  token: "token",
  email: "foo@bar",
  phone: "111",
};
const details = {
  job: "engineer",
  education: "",
  interests: "",
  goal: "",
  currentAbility: "",
  responseStyle: "",
  customSections: [],
};
const persistedMeta = {
  dailyWordTarget: 20,
  futurePlan: "plan",
};

const createHandler = ({ apiOverrides = {}, phone }) => {
  const api = {
    users: {
      updateContact: jest.fn().mockResolvedValue({ phone }),
    },
    profiles: {
      saveProfile: jest.fn().mockResolvedValue(undefined),
    },
    ...apiOverrides,
  };
  const setUser = jest.fn();
  const showPopup = jest.fn();
  const hook = renderHook(() =>
    useProfileSaveHandler({
      api,
      currentUser,
      details,
      phone,
      setUser,
      persistedMeta,
      showPopup,
      t,
    }),
  );
  return { ...hook, api, setUser, showPopup };
};

describe("useProfileSaveHandler", () => {
  it("保存成功时更新用户并提示成功", async () => {
    const { result, api, setUser, showPopup } = createHandler({ phone: "222" });

    await act(async () => {
      await result.current.handleSave(createEvent());
    });

    expect(api.users.updateContact).toHaveBeenCalledWith({
      userId: "user-1",
      email: "foo@bar",
      phone: "222",
      token: "token",
    });
    expect(api.profiles.saveProfile).toHaveBeenCalledWith({
      token: "token",
      profile: expect.objectContaining({
        dailyWordTarget: 20,
        futurePlan: "plan",
        job: "engineer",
      }),
    });
    expect(setUser).toHaveBeenCalledWith({
      ...currentUser,
      phone: "222",
    });
    expect(showPopup).toHaveBeenCalledWith("update-success");
    expect(result.current.isSaving).toBe(false);
  });

  it("保存失败时提示失败且不更新用户", async () => {
    const errorApi = {
      users: {
        updateContact: jest.fn().mockResolvedValue({ phone: "333" }),
      },
      profiles: {
        saveProfile: jest.fn().mockRejectedValue(new Error("boom")),
      },
    };
    const { result, api, setUser, showPopup } = createHandler({
      apiOverrides: errorApi,
      phone: "333",
    });
    jest.spyOn(console, "error").mockImplementation(() => {});

    await act(async () => {
      await result.current.handleSave(createEvent());
    });

    expect(api.profiles.saveProfile).toHaveBeenCalled();
    expect(setUser).not.toHaveBeenCalled();
    expect(showPopup).toHaveBeenCalledWith("fail");
    expect(result.current.isSaving).toBe(false);
    console.error.mockRestore();
  });
});
