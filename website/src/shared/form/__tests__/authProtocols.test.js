import { jest } from "@jest/globals";
import {
  AUTH_METHODS,
  AUTH_CODE_PURPOSES,
  buildLoginRequest,
  buildRegisterRequest,
  buildCodeRequest,
  createAuthSubmissionProtocol,
} from "../authProtocols.js";

const PATHS = {
  login: "/login",
  loginWithEmail: "/login/email",
  register: "/register",
  emailVerificationCode: "/email-code",
};

describe("authProtocols", () => {
  test("buildLoginRequest handles username method", () => {
    const request = buildLoginRequest({
      method: AUTH_METHODS.username,
      account: "user1",
      password: "secret",
      paths: PATHS,
    });
    expect(request).toEqual({
      path: PATHS.login,
      body: { account: "user1", password: "secret", method: "username" },
    });
  });

  test("buildLoginRequest handles email method", () => {
    const request = buildLoginRequest({
      method: AUTH_METHODS.email,
      account: "mail@example.com",
      password: " 123456 ",
      paths: PATHS,
    });
    expect(request).toEqual({
      path: PATHS.loginWithEmail,
      body: { email: "mail@example.com", code: "123456" },
    });
  });

  test("buildLoginRequest throws on unsupported method", () => {
    expect(() =>
      buildLoginRequest({
        method: "wechat",
        account: "id",
        password: "secret",
        paths: PATHS,
        unsupportedMessage: "nope",
      }),
    ).toThrow("nope");
  });

  test("buildRegisterRequest composes payload with dynamic key", () => {
    const request = buildRegisterRequest({
      method: AUTH_METHODS.email,
      account: "mail@example.com",
      password: " 999 ",
      paths: PATHS,
    });
    expect(request).toEqual({
      path: PATHS.register,
      body: { email: "mail@example.com", code: "999" },
    });
  });

  test("buildCodeRequest enforces email method", () => {
    expect(() =>
      buildCodeRequest({
        method: AUTH_METHODS.username,
        account: "user",
        purpose: AUTH_CODE_PURPOSES.LOGIN,
        paths: PATHS,
      }),
    ).toThrow();

    const request = buildCodeRequest({
      method: AUTH_METHODS.email,
      account: "mail@example.com",
      purpose: AUTH_CODE_PURPOSES.REGISTER,
      paths: PATHS,
    });
    expect(request).toEqual({
      path: PATHS.emailVerificationCode,
      body: { email: "mail@example.com", purpose: "REGISTER" },
    });
  });

  test("createAuthSubmissionProtocol executes api calls", async () => {
    const mockApi = {
      jsonRequest: jest.fn().mockResolvedValue({ ok: true }),
    };
    const protocol = createAuthSubmissionProtocol({
      api: mockApi,
      paths: PATHS,
    });

    await protocol.login({
      method: AUTH_METHODS.username,
      account: " user ",
      password: "secret",
    });
    expect(mockApi.jsonRequest).toHaveBeenCalledWith(PATHS.login, {
      method: "POST",
      body: { account: "user", password: "secret", method: "username" },
    });

    await protocol.register({
      method: AUTH_METHODS.email,
      account: "mail@example.com",
      password: " 321 ",
    });
    expect(mockApi.jsonRequest).toHaveBeenCalledWith(PATHS.register, {
      method: "POST",
      body: { email: "mail@example.com", code: "321" },
    });

    await protocol.requestCode({
      method: AUTH_METHODS.email,
      account: "mail@example.com",
      purpose: AUTH_CODE_PURPOSES.LOGIN,
    });
    expect(mockApi.jsonRequest).toHaveBeenCalledWith(PATHS.emailVerificationCode, {
      method: "POST",
      body: { email: "mail@example.com", purpose: "LOGIN" },
    });
  });
});
