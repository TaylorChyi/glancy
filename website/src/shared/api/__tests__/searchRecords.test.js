import {
  createFetchSearchRecords,
  createSaveSearchRecord,
  createDeleteSearchRecord,
} from "@shared/api/searchRecords.js";
import { API_PATHS } from "@core/config/api.js";
import { WORD_FLAVOR_BILINGUAL } from "@shared/utils/language.js";
import { jest } from "@jest/globals";

test("fetchSearchRecords calls without query when pagination omitted", async () => {
  const request = jest.fn().mockResolvedValue([]);
  const fetchSearchRecords = createFetchSearchRecords({ request });
  await fetchSearchRecords({ token: "t" });
  expect(request).toHaveBeenCalledWith(`${API_PATHS.searchRecords}/user`, {
    token: "t",
  });
});

test("fetchSearchRecords appends pagination params when provided", async () => {
  const request = jest.fn().mockResolvedValue([]);
  const fetchSearchRecords = createFetchSearchRecords({ request });
  await fetchSearchRecords({ token: "t", page: 2, size: 40 });
  expect(request).toHaveBeenCalledWith(
    `${API_PATHS.searchRecords}/user?page=2&size=40`,
    { token: "t" },
  );
});

test("saveSearchRecord posts flavor payload", async () => {
  const jsonRequest = jest.fn().mockResolvedValue({});
  const saveSearchRecord = createSaveSearchRecord({ jsonRequest });
  await saveSearchRecord({ token: "t", term: "foo", language: "ENGLISH" });
  const [, options] = jsonRequest.mock.calls[0];
  expect(options.body).toEqual({
    term: "foo",
    language: "ENGLISH",
    flavor: WORD_FLAVOR_BILINGUAL,
  });
});

test("deleteSearchRecord uses record id", async () => {
  const request = jest.fn().mockResolvedValue();
  const deleteSearchRecord = createDeleteSearchRecord({ request });
  await deleteSearchRecord({ recordId: "r1", token: "t" });
  expect(request.mock.calls[0][0]).toBe(`${API_PATHS.searchRecords}/user/r1`);
});
