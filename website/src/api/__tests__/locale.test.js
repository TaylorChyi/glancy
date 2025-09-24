import { createLocaleApi } from "@/api/locale.js";
import { API_PATHS } from "@/config/api.js";
import { jest } from "@jest/globals";

test("getLocale fetches locale endpoint", async () => {
  const request = jest.fn().mockResolvedValue({});
  const api = createLocaleApi(request);
  await api.getLocale();
  expect(request).toHaveBeenCalledWith(API_PATHS.locale);
});
