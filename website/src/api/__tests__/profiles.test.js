import { createProfilesApi } from "@/api/profiles.js";
import { API_PATHS } from "@/config/api.js";
import { jest } from "@jest/globals";

/**
 * 测试流程：
 * 1. 构造一个请求函数桩来捕获请求参数。
 * 2. 调用 fetchProfile 并传入认证令牌。
 * 3. 校验请求被路由到用户档案固定端点，且携带令牌。
 */
test("fetchProfile calls correct path", async () => {
  const request = jest.fn().mockResolvedValue({});
  const api = createProfilesApi(request);
  await api.fetchProfile({ token: "t" });
  expect(request).toHaveBeenCalledWith(`${API_PATHS.profiles}/user`, {
    token: "t",
  });
});

/**
 * 测试流程：
 * 1. 构造请求桩函数并初始化档案 API。
 * 2. 调用 saveProfile 传入令牌与档案内容。
 * 3. 验证请求的 URL 指向用户档案端点，并包含 POST 方法与令牌。
 */
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
