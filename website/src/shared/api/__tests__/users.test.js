import { createUsersApi } from "@shared/api/users.js";
import { API_PATHS } from "@core/config/api.js";
import { jest } from "@jest/globals";

test("uploadAvatar posts FormData", async () => {
  const request = jest.fn().mockResolvedValue({});
  const api = createUsersApi(request);
  const file = new Blob(["x"], { type: "text/plain" });
  await api.uploadAvatar({ userId: "1", token: "t", file });
  const [url, options] = request.mock.calls[0];
  expect(url).toBe(`${API_PATHS.users}/1/avatar-file`);
  expect(options.method).toBe("POST");
  expect(options.body).toBeInstanceOf(FormData);
});
