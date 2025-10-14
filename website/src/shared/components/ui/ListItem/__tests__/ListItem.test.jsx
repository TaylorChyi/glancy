import { render, screen } from "@testing-library/react";
import ListItem from "../ListItem.jsx";

function SampleList({ items, activeId }) {
  return (
    <ul>
      {items.map((item) => (
        <ListItem
          key={item.id}
          text={item.label}
          isActive={item.id === activeId}
          icon={<svg role="presentation" />}
        />
      ))}
    </ul>
  );
}

test("renders mapped list items with active state indicator and preserved title", () => {
  const items = [
    { id: "alpha", label: "晨光" },
    {
      id: "beta",
      label: "极光在北纬六十五度的绵长夜幕中缓缓蔓延",
    },
  ];

  render(<SampleList items={items} activeId="beta" />);

  const activeText = screen.getByText(items[1].label);

  expect(activeText).toHaveAttribute("title", items[1].label);
  expect(activeText.closest("li")).toHaveAttribute("data-active", "true");
});
