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

const setupUpdateContact = () => {
  const api = createApi();
  const callUpdateContact = (phone) =>
    updateContactIfChanged({ api, currentUser: baseUser, phone });

  return { api, callUpdateContact };
};

const executePersistProfile = async ({ phone }) => {
  const api = createApi({ phone });
  const params = buildPersistParams({ api, phone });
  const outcome = await persistProfile(params);
  return { api, outcome, phone };
};

describe("updateContactIfChanged", () => {
  it("skips updating the contact when the phone number is unchanged", async () => {
    const { api, callUpdateContact } = setupUpdateContact();
    const result = await callUpdateContact(baseUser.phone);

    expect(api.users.updateContact).not.toHaveBeenCalled();
    expectIdentityOutcome(result, { hasUpdates: false });
  });

  it("updates the contact record when the phone number changes", async () => {
    const { api, callUpdateContact } = setupUpdateContact();
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

describe("createProfileSavePayload", () => {
  it("merges normalized details with persisted metadata", () => {
    const payload = createProfileSavePayload({ details, persistedMeta });

    expect(payload).toMatchObject({
      job: "engineer",
      interest: "music",
      dailyWordTarget: 30,
      futurePlan: "plan",
    });
  });
});

describe("saveProfileDetails", () => {
  it("delegates to the profiles.saveProfile API", async () => {
    const api = createApi();

    await saveProfileDetails({
      api,
      currentUser: baseUser,
      profile: { foo: "bar" },
    });

    expectProfileSavedWith(api, { foo: "bar" });
  });
});

describe("persistProfile", () => {
  it("updates contact information when identity data changes", async () => {
    const nextPhone = "222";
    const { api, outcome } = await executePersistProfile({ phone: nextPhone });

    expect(api.users.updateContact).toHaveBeenCalled();
    expectProfileSavedWith(api, { dailyWordTarget: 30 });
    expectIdentityOutcome(outcome, { hasUpdates: true, phone: nextPhone });
  });

  it("skips the contact API call when identity data is unchanged", async () => {
    const { api, outcome } = await executePersistProfile({
      phone: baseUser.phone,
    });

    expect(api.users.updateContact).not.toHaveBeenCalled();
    expectProfileSavedWith(api, { dailyWordTarget: 30 });
    expectIdentityOutcome(outcome, { hasUpdates: false });
  });
});
