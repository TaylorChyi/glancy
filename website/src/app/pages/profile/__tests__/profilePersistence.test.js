import { jest } from "@jest/globals";
import {
  updateContactIfChanged,
  createProfileSavePayload,
  saveProfileDetails,
  persistProfile,
} from "../profilePersistence.js";

const baseUser = {
  id: "user-1",
  token: "token",
  email: "foo@bar",
  phone: "111",
};

const details = {
  job: " engineer ",
  education: "",
  interests: "music",
  goal: "grow",
  currentAbility: "",
  responseStyle: "",
  customSections: [],
};

const persistedMeta = {
  dailyWordTarget: 30,
  futurePlan: "plan",
};

const createApi = () => ({
  users: {
    updateContact: jest.fn().mockResolvedValue({ phone: "222" }),
  },
  profiles: {
    saveProfile: jest.fn().mockResolvedValue(undefined),
  },
});

describe("profilePersistence", () => {
  it("updateContactIfChanged 跳过未变化的电话", async () => {
    const api = createApi();
    const result = await updateContactIfChanged({
      api,
      currentUser: baseUser,
      phone: "111",
    });
    expect(api.users.updateContact).not.toHaveBeenCalled();
    expect(result).toEqual({ hasIdentityUpdates: false, nextUser: baseUser });
  });

  it("updateContactIfChanged 更新电话并返回新用户", async () => {
    const api = createApi();
    const result = await updateContactIfChanged({
      api,
      currentUser: baseUser,
      phone: "222",
    });
    expect(api.users.updateContact).toHaveBeenCalledWith({
      userId: "user-1",
      email: "foo@bar",
      phone: "222",
      token: "token",
    });
    expect(result.hasIdentityUpdates).toBe(true);
    expect(result.nextUser).toEqual({ ...baseUser, phone: "222" });
  });

  it("createProfileSavePayload 合并详情与元数据", () => {
    const payload = createProfileSavePayload({ details, persistedMeta });
    expect(payload).toMatchObject({
      job: "engineer",
      interest: "music",
      dailyWordTarget: 30,
      futurePlan: "plan",
    });
  });

  it("saveProfileDetails 调用保存接口", async () => {
    const api = createApi();
    await saveProfileDetails({
      api,
      currentUser: baseUser,
      profile: { foo: "bar" },
    });
    expect(api.profiles.saveProfile).toHaveBeenCalledWith({
      token: "token",
      profile: { foo: "bar" },
    });
  });

  it("persistProfile 组合更新与保存流程", async () => {
    const api = createApi();
    const outcome = await persistProfile({
      api,
      currentUser: baseUser,
      details,
      phone: "222",
      persistedMeta,
    });
    expect(api.users.updateContact).toHaveBeenCalled();
    expect(api.profiles.saveProfile).toHaveBeenCalledWith({
      token: "token",
      profile: expect.objectContaining({ dailyWordTarget: 30 }),
    });
    expect(outcome).toEqual({
      hasIdentityUpdates: true,
      nextUser: { ...baseUser, phone: "222" },
    });
  });
});
