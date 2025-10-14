import { expect, test } from "@playwright/test";

const NAV_ACTIVE_COLOR = "rgb(36, 41, 53)";
const NAV_HOVER_COLOR = "rgb(26, 30, 36)";
const GROUP_TITLE_COLOR = "rgb(162, 169, 180)";

test.describe("Sidebar layout", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("sidebar shell respects fixed metrics", async ({ page }) => {
    const sidebar = page.getByTestId("sidebar");
    await expect(sidebar).toBeVisible();
    await expect(sidebar).toHaveCSS("width", "272px");
    const headerText = await page.getByTestId("sidebar-header").innerText();
    expect(headerText.trim().length).toBeGreaterThan(0);
  });

  test("only content area scrolls", async ({ page }) => {
    const headerOverflow = await page
      .getByTestId("sidebar-header")
      .evaluate((element) => getComputedStyle(element).overflowY);
    expect(headerOverflow).toBe("visible");

    const scrollOverflow = await page
      .getByTestId("sidebar-scroll")
      .evaluate((element) => getComputedStyle(element).overflowY);
    expect(
      scrollOverflow === "auto" || scrollOverflow === "scroll",
    ).toBeTruthy();

    const footerOverflow = await page
      .getByTestId("sidebar-footer")
      .evaluate((element) => getComputedStyle(element).overflowY);
    expect(footerOverflow).toBe("visible");
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

  test("help popover aligns with sidebar edge", async ({ page }) => {
    const sidebar = page.getByTestId("sidebar");
    const sidebarBox = await sidebar.boundingBox();
    await page.getByTestId("sidebar-action-help").click();
    const panel = page.locator('[class*="Popover_module__panel"]').first();
    await expect(panel).toBeVisible();
    await expect(panel).toHaveCSS("width", "304px");
    await expect(panel).toHaveCSS("border-radius", "14px");
    const panelBox = await panel.boundingBox();
    if (!sidebarBox || !panelBox) {
      throw new Error("Unable to resolve bounding boxes for popover assertion");
    }
    expect(Math.round(panelBox.left - sidebarBox.right)).toBe(8);
  });
});
