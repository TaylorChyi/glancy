import { createProfilesApi } from "@/api/profiles.js";
import { API_PATHS } from "@/config/api.js";
import { jest } from "@jest/globals";

test("fetchProfile calls correct path", async () => {
  const request = jest.fn().mockResolvedValue({});
  const api = createProfilesApi(request);
  await api.fetchProfile({ token: "t" });
  expect(request).toHaveBeenCalledWith(`${API_PATHS.profiles}/user`, {
    token: "t",
  });
});

test("saveProfile posts profile data", async () => {
  const request = jest.fn().mockResolvedValue({});
  const api = createProfilesApi(request);
  await api.saveProfile({ token: "t", profile: { a: 1 } });
  expect(request.mock.calls[0][0]).toBe(`${API_PATHS.profiles}/user`);
  expect(request.mock.calls[0][1]).toMatchObject({
    method: "POST",
    token: "t",
  });
});
