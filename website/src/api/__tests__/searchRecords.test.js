import { createSearchRecordsApi } from "@/api/searchRecords.js";
import { API_PATHS } from "@/config/api.js";
import { jest } from "@jest/globals";

test("fetchSearchRecords calls with token", async () => {
  const request = jest.fn().mockResolvedValue([]);
  const api = createSearchRecordsApi(request);
  await api.fetchSearchRecords({ token: "t" });
  expect(request).toHaveBeenCalledWith(`${API_PATHS.searchRecords}/user`, {
    token: "t",
  });
});

test("deleteSearchRecord uses record id", async () => {
  const request = jest.fn().mockResolvedValue();
  const api = createSearchRecordsApi(request);
  await api.deleteSearchRecord({ recordId: "r1", token: "t" });
  expect(request.mock.calls[0][0]).toBe(`${API_PATHS.searchRecords}/user/r1`);
});
