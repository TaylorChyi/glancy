import translations from "@core/i18n/index.js";

test("en translations include navigation keys", () => {
  expect(translations.en.navHome).toBe("Home");
});

test("zh translations include navigation keys", () => {
  expect(translations.zh.navHome).toBe("首页");
});

test("auth translations are merged", () => {
  expect(translations.en.loginTitle).toBe("User Login");
  expect(translations.zh.loginTitle).toBe("用户登录");
});

test("profile translations are merged", () => {
  expect(translations.en.profileTitle).toBe("Profile");
  expect(translations.zh.profileTitle).toBe("个人资料");
});

test("common translations are preserved", () => {
  expect(translations.en.searchButton).toBe("Search");
  expect(translations.zh.searchButton).toBe("搜索");
});
