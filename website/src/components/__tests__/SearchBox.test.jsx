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
 * 验证在提供聊天窗口背景变量时，背景色继承该值。
 */
test("uses themed background with body fallback", () => {
  const { container } = render(
    <SearchBox>
      <textarea data-testid="input" />
    </SearchBox>,
  );
  const box = container.firstChild;
  expect(getComputedStyle(box).backgroundColor).toContain("color-mix");
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
