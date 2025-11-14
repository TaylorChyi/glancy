import { jest } from "@jest/globals";
import {
  AUTH_CODE_PURPOSES,
  AUTH_METHODS,
  buildCodeRequest,
  buildLoginRequest,
  buildRegisterRequest,
  createAuthSubmissionProtocol,
} from "../authProtocols.js";

const PATHS = {
  emailVerificationCode: "/email-code",
  login: "/login",
  loginWithEmail: "/login/email",
  register: "/register",
};

describe("authProtocols", describeAuthProtocols);

function describeAuthProtocols() {
  describe("buildLoginRequest", describeBuildLoginRequest);
  describe("buildRegisterRequest", describeBuildRegisterRequest);
  describe("buildCodeRequest", describeBuildCodeRequest);
  describe(
    "createAuthSubmissionProtocol",
    describeCreateAuthSubmissionProtocol,
  );
}

function describeBuildLoginRequest() {
  test("handles username method", () => {
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

  test("handles email method", () => {
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

  test("throws on unsupported method", () => {
    const buildWithUnsupportedMethod = () =>
      buildLoginRequest({
        method: "wechat",
        account: "id",
        password: "secret",
        paths: PATHS,
        unsupportedMessage: "nope",
      });

    expect(buildWithUnsupportedMethod).toThrow("nope");
  });
}

function describeBuildRegisterRequest() {
  test("composes payload with dynamic key", () => {
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
}

function describeBuildCodeRequest() {
  test("enforces email method", () => {
    const buildWithUsername = () =>
      buildCodeRequest({
        method: AUTH_METHODS.username,
        account: "user",
        purpose: AUTH_CODE_PURPOSES.LOGIN,
        paths: PATHS,
      });

    expect(buildWithUsername).toThrow();

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
}

function describeCreateAuthSubmissionProtocol() {
  let mockApi;
  let protocol;

  beforeEach(() => {
    mockApi = {
      jsonRequest: jest.fn().mockResolvedValue({ ok: true }),
    };
    protocol = createAuthSubmissionProtocol({
      api: mockApi,
      paths: PATHS,
    });
  });

  test("login executes api call", async () => {
    await protocol.login({
      method: AUTH_METHODS.username,
      account: " user ",
      password: "secret",
    });
    expect(mockApi.jsonRequest).toHaveBeenCalledWith(PATHS.login, {
      method: "POST",
      body: { account: "user", password: "secret", method: "username" },
    });
  });

  test("register executes api call", async () => {
    await protocol.register({
      method: AUTH_METHODS.email,
      account: "mail@example.com",
      password: " 321 ",
    });
    expect(mockApi.jsonRequest).toHaveBeenCalledWith(PATHS.register, {
      method: "POST",
      body: { email: "mail@example.com", code: "321" },
    });
  });

  test("requestCode executes api call", async () => {
    await protocol.requestCode({
      method: AUTH_METHODS.email,
      account: "mail@example.com",
      purpose: AUTH_CODE_PURPOSES.LOGIN,
    });
    expect(mockApi.jsonRequest).toHaveBeenCalledWith(
      PATHS.emailVerificationCode,
      {
        method: "POST",
        body: { email: "mail@example.com", purpose: "LOGIN" },
      },
    );
  });
}
