import { expect, test } from "@playwright/test";

test.describe("Sidebar layout shell", () => {
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
});
