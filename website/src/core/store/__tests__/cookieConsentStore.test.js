import { useCookieConsentStore } from "@core/store";
import {
  hasLoginHistoryCookie,
  resetCookieConsentStore,
  withCookieConsentStore,
  writeLoginHistoryCookie,
} from "../test-support/cookieConsentStore.fixtures.js";

describe("cookieConsentStore", () => {
  beforeEach(resetCookieConsentStore);

  /**
   * 测试场景：用户同意使用 Cookie 时，会写入持久化状态并同步已有的登录历史 Cookie。
   */
  test("acceptCookies persists consent and reflects existing login cookie", () => {
    writeLoginHistoryCookie();
    withCookieConsentStore((state) => state.acceptCookies());
    expect(useCookieConsentStore.getState().status).toBe("accepted");
    expect(useCookieConsentStore.getState().hasLoginCookie).toBe(true);
    const persisted = JSON.parse(localStorage.getItem("cookie-consent"));
    expect(persisted.state.status).toBe("accepted");
  });

  /**
   * 测试场景：当功能需要 Cookie 而尚未授权时，会自动唤起底部提示并标记请求来源。
   */
  test("requireCookieAccess surfaces prompt when consent is missing", () => {
    let result = true;
    withCookieConsentStore((state) => {
      result = state.requireCookieAccess();
    });
    expect(result).toBe(false);
    expect(useCookieConsentStore.getState().promptVisible).toBe(true);
    expect(useCookieConsentStore.getState().promptContext).toBe("required");
  });

  /**
   * 测试场景：只有在用户授权后才会记录登录历史 Cookie，未授权时不会写入。
   */
  test("recordLoginCookie respects consent state", () => {
    expect(hasLoginHistoryCookie()).toBe(false);
    let recorded = true;
    withCookieConsentStore((state) => {
      recorded = state.recordLoginCookie();
    });
    expect(recorded).toBe(false);
    expect(hasLoginHistoryCookie()).toBe(false);

    withCookieConsentStore((state) => state.acceptCookies());
    withCookieConsentStore((state) => {
      recorded = state.recordLoginCookie();
    });
    expect(recorded).toBe(true);
    expect(hasLoginHistoryCookie()).toBe(true);
  });
});
