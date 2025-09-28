import { render } from "@testing-library/react";
import SearchBox from "@/components/ui/SearchBox";
import fs from "node:fs";

beforeAll(() => {
  const css = fs.readFileSync(
    new URL("../ui/SearchBox/SearchBox.module.css", import.meta.url),
    "utf8",
  );
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);
  document.documentElement.style.setProperty("--sb-panel", "#1b1f27");
  document.documentElement.style.setProperty("--sb-radius", "14px");
});

afterAll(() => {
  document.documentElement.style.removeProperty("--sb-panel");
  document.documentElement.style.removeProperty("--sb-radius");
});

/**
 * 验证 SearchBox 能正确应用自定义的垂直内边距变量。
 */
test("applies custom vertical padding variable", () => {
  const { container } = render(
    <SearchBox paddingY="24px">
      <textarea data-testid="input" />
    </SearchBox>,
  );
  const box = container.firstChild;
  expect(box.style.getPropertyValue("--padding-y")).toBe("24px");
});

/**
 * 验证搜索框容器使用设计令牌提供的圆角与背景色。
 */
test("applies design token defaults", () => {
  const { container } = render(
    <SearchBox>
      <textarea data-testid="input" />
    </SearchBox>,
  );
  const box = container.firstChild;
  const styles = getComputedStyle(box);
  expect(styles.borderRadius).toBe("var(--sb-radius, 14px)");
  expect(styles.minHeight).toBe("var(--sb-h, 48px)");
});

/**
 * 验证自定义 className 会被拼接进最终类名。
 */
test("merges custom className", () => {
  const { container } = render(
    <SearchBox className="extra-class">
      <textarea data-testid="input" />
    </SearchBox>,
  );
  const box = container.firstChild;
  expect(box.className).toContain("extra-class");
});
