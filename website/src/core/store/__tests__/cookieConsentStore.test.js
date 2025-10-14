import { act } from "@testing-library/react";
import { useCookieConsentStore, LOGIN_HISTORY_COOKIE_KEY } from "@core/store";

describe("cookieConsentStore", () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie = `${LOGIN_HISTORY_COOKIE_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    act(() => {
      useCookieConsentStore.getState().resetConsent();
    });
  });

  /**
   * 测试场景：用户同意使用 Cookie 时，会写入持久化状态并同步已有的登录历史 Cookie。
   */
  test("acceptCookies persists consent and reflects existing login cookie", () => {
    document.cookie = `${LOGIN_HISTORY_COOKIE_KEY}=1; path=/`;
    act(() => {
      useCookieConsentStore.getState().acceptCookies();
    });
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
    act(() => {
      result = useCookieConsentStore.getState().requireCookieAccess();
    });
    expect(result).toBe(false);
    expect(useCookieConsentStore.getState().promptVisible).toBe(true);
    expect(useCookieConsentStore.getState().promptContext).toBe("required");
  });

  /**
   * 测试场景：只有在用户授权后才会记录登录历史 Cookie，未授权时不会写入。
   */
  test("recordLoginCookie respects consent state", () => {
    expect(document.cookie.includes(LOGIN_HISTORY_COOKIE_KEY)).toBe(false);
    let recorded = true;
    act(() => {
      recorded = useCookieConsentStore.getState().recordLoginCookie();
    });
    expect(recorded).toBe(false);
    expect(document.cookie.includes(LOGIN_HISTORY_COOKIE_KEY)).toBe(false);

    act(() => {
      useCookieConsentStore.getState().acceptCookies();
    });
    act(() => {
      recorded = useCookieConsentStore.getState().recordLoginCookie();
    });
    expect(recorded).toBe(true);
    expect(document.cookie.includes(`${LOGIN_HISTORY_COOKIE_KEY}=1`)).toBe(
      true,
    );
  });
});
