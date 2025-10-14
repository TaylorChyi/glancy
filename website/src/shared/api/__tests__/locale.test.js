import { createLocaleApi } from "@shared/api/locale.js";
import { API_PATHS } from "@core/config/api.js";
import { jest } from "@jest/globals";

test("getLocale fetches locale endpoint", async () => {
  const request = jest.fn().mockResolvedValue({});
  const api = createLocaleApi(request);
  await api.getLocale();
  expect(request).toHaveBeenCalledWith(API_PATHS.locale);
});
