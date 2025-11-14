import { createProfilesApi } from "@shared/api/profiles.js";
import { API_PATHS } from "@core/config/api.js";
import { jest } from "@jest/globals";

describe("profiles API", () => {
  let request;
  let api;

  beforeEach(() => {
    request = jest.fn().mockResolvedValue({});
    api = createProfilesApi(request);
  });

  describe("fetchProfile", () => {
    beforeEach(async () => {
      await api.fetchProfile({ token: "t" });
    });

    it("calls the user profile endpoint", () => {
      expect(request).toHaveBeenCalledWith(`${API_PATHS.profiles}/user`, {
        token: "t",
      });
    });
  });

  describe("saveProfile", () => {
    beforeEach(async () => {
      await api.saveProfile({ token: "t", profile: { a: 1 } });
    });

    it("posts profile data to the endpoint", () => {
      expect(request.mock.calls[0][0]).toBe(`${API_PATHS.profiles}/user`);
      expect(request.mock.calls[0][1]).toMatchObject({
        method: "POST",
        token: "t",
      });
    });
  });
});
