import { render } from "@testing-library/react";
import SearchBox from "@/components/ui/SearchBox";

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
