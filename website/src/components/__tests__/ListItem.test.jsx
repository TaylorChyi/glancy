import { render, fireEvent } from "@testing-library/react";
import ListItem from "@/components/ui/ListItem";

/**
 * 验证 ListItem 在指针交互时能正确切换样式类。
 */
test("toggles interactive classes on pointer events", () => {
  const { getByRole } = render(
    <ul>
      <ListItem text="示例" />
    </ul>,
  );
  const item = getByRole("listitem");

  fireEvent.mouseEnter(item);
  expect(item.className).toContain("hovered");
  fireEvent.mouseLeave(item);
  expect(item.className).not.toContain("hovered");

  fireEvent.mouseDown(item);
  expect(item.className).toContain("active");
  fireEvent.mouseUp(item);
  expect(item.className).not.toContain("active");
});
