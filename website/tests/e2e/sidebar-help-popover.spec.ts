import { expect, test } from "@playwright/test";

test.describe("Sidebar help popover", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
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
    // Playwright exposes raw geometry via x/width; we derive semantic edges to keep assertions explicit.
    const sidebarRightEdge = sidebarBox.x + sidebarBox.width;
    const panelLeftEdge = panelBox.x;
    expect(Math.round(panelLeftEdge - sidebarRightEdge)).toBe(8);
  });
});
