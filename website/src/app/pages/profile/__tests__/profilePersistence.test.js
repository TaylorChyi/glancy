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

const createApi = ({ phone = "222" } = {}) => ({
  users: {
    updateContact: jest.fn().mockResolvedValue({ phone }),
  },
  profiles: {
    saveProfile: jest.fn().mockResolvedValue(undefined),
  },
});

const expectIdentityOutcome = (result, { hasUpdates, phone = baseUser.phone }) => {
  expect(result).toEqual({
    hasIdentityUpdates: hasUpdates,
    nextUser: hasUpdates ? { ...baseUser, phone } : baseUser,
  });
};

const expectProfileSavedWith = (api, matcher) => {
  expect(api.profiles.saveProfile).toHaveBeenCalledWith({
    token: baseUser.token,
    profile: expect.objectContaining(matcher),
  });
};

const buildPersistParams = ({ api, phone = "222" }) => ({
  api,
  currentUser: baseUser,
  details,
  phone,
  persistedMeta,
});

describe("profilePersistence", () => {
  describe("updateContactIfChanged", () => {
    let api;

    const callUpdateContact = (phone) =>
      updateContactIfChanged({ api, currentUser: baseUser, phone });

    beforeEach(() => {
      api = createApi();
    });

    it("updateContactIfChanged 跳过未变化的电话", async () => {
      const result = await callUpdateContact(baseUser.phone);

      expect(api.users.updateContact).not.toHaveBeenCalled();
      expectIdentityOutcome(result, { hasUpdates: false });
    });

    it("updateContactIfChanged 更新电话并返回新用户", async () => {
      const nextPhone = "222";
      const result = await callUpdateContact(nextPhone);

      expect(api.users.updateContact).toHaveBeenCalledWith({
        userId: baseUser.id,
        email: baseUser.email,
        phone: nextPhone,
        token: baseUser.token,
      });
      expectIdentityOutcome(result, { hasUpdates: true, phone: nextPhone });
    });
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

  describe("saveProfileDetails", () => {
    let api;

    beforeEach(() => {
      api = createApi();
    });

    it("saveProfileDetails 调用保存接口", async () => {
      await saveProfileDetails({
        api,
        currentUser: baseUser,
        profile: { foo: "bar" },
      });

      expectProfileSavedWith(api, { foo: "bar" });
    });
  });

  describe("persistProfile", () => {
    let api;

    const callPersistProfile = (phone = "222") =>
      persistProfile(buildPersistParams({ api, phone }));

    beforeEach(() => {
      api = createApi();
    });

    it("persistProfile 组合更新与保存流程", async () => {
      const nextPhone = "222";
      const outcome = await callPersistProfile(nextPhone);

      expect(api.users.updateContact).toHaveBeenCalled();
      expectProfileSavedWith(api, { dailyWordTarget: 30 });
      expectIdentityOutcome(outcome, { hasUpdates: true, phone: nextPhone });
    });
  });
});
