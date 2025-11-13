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

const createApi = ({ phone, users, profiles } = {}) => {
  const nextPhone = phone ?? "222";
  const defaultUsers = {
    updateContact: jest.fn().mockResolvedValue({ phone: nextPhone }),
  };
  const defaultProfiles = {
    saveProfile: jest.fn().mockResolvedValue(undefined),
  };

  return {
    users: { ...defaultUsers, ...(users ?? {}) },
    profiles: { ...defaultProfiles, ...(profiles ?? {}) },
  };
};

const renderSaveHandler = ({ phone = "222", users, profiles } = {}) => {
  const api = createApi({ phone, users, profiles });
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
  return { ...hook, api, setUser, showPopup, phone };
};

const submitSave = async ({ result }) => {
  await act(async () => {
    await result.current.handleSave(createEvent());
  });
};

const expectUpdateContactCalledWith = (api, phone) => {
  expect(api.users.updateContact).toHaveBeenCalledWith({
    userId: currentUser.id,
    email: currentUser.email,
    phone,
    token: currentUser.token,
  });
};

const expectProfileSaved = (api) => {
  expect(api.profiles.saveProfile).toHaveBeenCalledWith({
    token: currentUser.token,
    profile: expect.objectContaining({
      dailyWordTarget: persistedMeta.dailyWordTarget,
      futurePlan: persistedMeta.futurePlan,
      job: details.job,
    }),
  });
};

const expectSavingCompleted = ({ result }) => {
  expect(result.current.isSaving).toBe(false);
};

describe("useProfileSaveHandler", () => {
  describe("保存成功时", () => {
    let context;

    beforeEach(() => {
      context = renderSaveHandler({ phone: "222" });
    });

    it("更新用户并提示成功", async () => {
      const { api, setUser, showPopup, phone } = context;

      await submitSave(context);

      expectUpdateContactCalledWith(api, phone);
      expectProfileSaved(api);
      expect(setUser).toHaveBeenCalledWith({ ...currentUser, phone });
      expect(showPopup).toHaveBeenCalledWith(t.updateSuccess);
      expectSavingCompleted(context);
    });
  });

  describe("保存失败时", () => {
    let context;
    let consoleErrorMock;

    beforeEach(() => {
      context = renderSaveHandler({
        phone: "333",
        profiles: {
          saveProfile: jest.fn().mockRejectedValue(new Error("boom")),
        },
      });
      consoleErrorMock = jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorMock.mockRestore();
    });

    it("提示失败且不更新用户", async () => {
      const { api, setUser, showPopup } = context;

      await submitSave(context);

      expect(api.profiles.saveProfile).toHaveBeenCalled();
      expect(setUser).not.toHaveBeenCalled();
      expect(showPopup).toHaveBeenCalledWith(t.fail);
      expectSavingCompleted(context);
    });
  });
});
