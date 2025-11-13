import { expect, test } from "@playwright/test";

const NAV_ACTIVE_COLOR = "rgb(36, 41, 53)";
const NAV_HOVER_COLOR = "rgb(26, 30, 36)";
const GROUP_TITLE_COLOR = "rgb(162, 169, 180)";

test.describe("Sidebar navigation styling", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("nav items follow spacing tokens", async ({ page }) => {
    const firstNav = page.getByTestId("sidebar-nav-dictionary");
    await expect(firstNav).toHaveCSS("height", "40px");
    await expect(firstNav).toHaveCSS("padding-left", "12px");
    await expect(firstNav).toHaveCSS("padding-right", "12px");
    await expect(firstNav).toHaveCSS("border-radius", "12px");
    const icon = firstNav.locator("img").first();
    await expect(icon).toHaveAttribute("width", "18");
  });

  test("group titles honor typography tokens", async ({ page }) => {
    const title = page.locator('[class*="Group_module__title"]').first();
    await expect(title).toHaveCSS("font-size", "12px");
    await expect(title).toHaveCSS("font-weight", "600");
    await expect(title).toHaveCSS("color", GROUP_TITLE_COLOR);
  });

  test("hover and active styles use designated palette", async ({ page }) => {
    const firstNav = page.getByTestId("sidebar-nav-dictionary");
    await firstNav.hover();
    await expect(firstNav).toHaveCSS("background-color", NAV_HOVER_COLOR);
    await page.mouse.move(0, 0);
    const activeNav = page.locator('[aria-current="page"]').first();
    await expect(activeNav).toHaveCSS("background-color", NAV_ACTIVE_COLOR);
  });
});
