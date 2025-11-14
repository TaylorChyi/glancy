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

    describe("when the phone number is unchanged", () => {
      let result;

      beforeEach(async () => {
        result = await callUpdateContact(baseUser.phone);
      });

      it("skips updating the contact", () => {
        expect(api.users.updateContact).not.toHaveBeenCalled();
      });

      it("returns the current user identity", () => {
        expectIdentityOutcome(result, { hasUpdates: false });
      });
    });

    describe("when the phone number changes", () => {
      const nextPhone = "222";
      let result;

      beforeEach(async () => {
        result = await callUpdateContact(nextPhone);
      });

      it("sends the update request with new phone", () => {
        expect(api.users.updateContact).toHaveBeenCalledWith({
          userId: baseUser.id,
          email: baseUser.email,
          phone: nextPhone,
          token: baseUser.token,
        });
      });

      it("returns the updated identity payload", () => {
        expectIdentityOutcome(result, { hasUpdates: true, phone: nextPhone });
      });
    });
  });

  describe("createProfileSavePayload", () => {
    let payload;

    beforeEach(() => {
      payload = createProfileSavePayload({ details, persistedMeta });
    });

    it("merges normalized details with persisted metadata", () => {
      expect(payload).toMatchObject({
        job: "engineer",
        interest: "music",
        dailyWordTarget: 30,
        futurePlan: "plan",
      });
    });
  });

  describe("saveProfileDetails", () => {
    let api;

    beforeEach(() => {
      api = createApi();
    });

    it("delegates to the profiles.saveProfile API", async () => {
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
    let params;
    const callPersistProfile = () => persistProfile(params);

    beforeEach(() => {
      api = createApi();
      params = buildPersistParams({ api });
    });

    describe("when identity data changes", () => {
      const nextPhone = "222";
      let outcome;

      beforeEach(async () => {
        params.phone = nextPhone;
        outcome = await callPersistProfile();
      });

      it("updates the contact record", () => {
        expect(api.users.updateContact).toHaveBeenCalled();
      });

      it("saves the profile payload", () => {
        expectProfileSavedWith(api, { dailyWordTarget: 30 });
      });

      it("returns the identity update outcome", () => {
        expectIdentityOutcome(outcome, { hasUpdates: true, phone: nextPhone });
      });
    });

    describe("when identity data is unchanged", () => {
      let outcome;

      beforeEach(async () => {
        params.phone = baseUser.phone;
        outcome = await callPersistProfile();
      });

      it("skips the contact API call", () => {
        expect(api.users.updateContact).not.toHaveBeenCalled();
      });

      it("still saves the profile payload", () => {
        expectProfileSavedWith(api, { dailyWordTarget: 30 });
      });

      it("reports that identity data was unchanged", () => {
        expectIdentityOutcome(outcome, { hasUpdates: false });
      });
    });
  });
});
