import { fireEvent, render, screen } from "@testing-library/react";
import { jest } from "@jest/globals";
import styles from "../HistoryList.module.css";
import navItemStyles from "../NavItem.module.css";
import HistoryListView from "../HistoryListView.jsx";

let itemSequence = 0;

const createHistoryItem = (overrides = {}) => {
  itemSequence += 1;
  return {
    termKey: overrides.termKey ?? `term-${itemSequence}`,
    term: overrides.term ?? `term-${itemSequence}`,
    latestVersionId: overrides.latestVersionId ?? `v${itemSequence}`,
    ...overrides,
  };
};

const createHistoryItems = (...items) =>
  items.length > 0
    ? items
    : [createHistoryItem({ term: "alpha" }), createHistoryItem({ term: "beta" })];

const buildNavigationFactory = (resolver = () => ({})) => {
  const handler = typeof resolver === "function" ? resolver : () => resolver;
  return jest.fn(handler);
};

const renderHistoryListView = ({
  items = createHistoryItems(),
  onSelect = jest.fn(),
  navigationResolver = () => ({}),
} = {}) => {
  const onNavigate = buildNavigationFactory(navigationResolver);

  render(
    <HistoryListView items={items} onSelect={onSelect} onNavigate={onNavigate} />,
  );

  return { items, onSelect, onNavigate };
};

describe("HistoryListView", function describeHistoryListView() {
  beforeEach(() => {
    itemSequence = 0;
    jest.clearAllMocks();
  });

  describe("rendering", () => {
    test("Given_items_When_rendered_Then_provides_accessible_structure", () => {
      const { items, onNavigate } = renderHistoryListView();

      expect(screen.getByRole("listbox")).toBeInTheDocument();
      const firstButton = screen.getByRole("button", { name: items[0].term });
      const secondButton = screen.getByRole("button", { name: items[1].term });

      expect(firstButton).toBeInTheDocument();
      expect(secondButton).toBeInTheDocument();
      expect(firstButton).toHaveClass(styles.entryButton);
      expect(secondButton).toHaveClass(styles.entryButton);
      expect(onNavigate).toHaveBeenCalledTimes(items.length);
    });

    test("Given_normalized_term_When_rendered_Then_uses_term_label", () => {
      renderHistoryListView({
        items: [createHistoryItem({ term: "student" })],
      });

      expect(screen.getByRole("button", { name: "student" })).toBeInTheDocument();
    });
  });

  describe("interactions", () => {
    test("Given_click_When_item_selected_Then_invokes_onSelect_with_payload", () => {
      const handleSelect = jest.fn();
      const items = createHistoryItems();

      renderHistoryListView({ items, onSelect: handleSelect });

      fireEvent.click(screen.getByRole("button", { name: items[0].term }));

      expect(handleSelect).toHaveBeenCalledWith(items[0]);
    });
  });

  describe("navigation bindings", () => {
    test("Given_key_event_When_navigation_triggered_Then_forwards_to_strategy", () => {
      const onKeyDown = jest.fn();

      renderHistoryListView({
        navigationResolver: () => ({ onKeyDown }),
      });

      const firstItem = screen.getAllByRole("button")[0];
      fireEvent.keyDown(firstItem, { key: "ArrowDown" });

      expect(onKeyDown).toHaveBeenCalledTimes(1);
    });
  });

  describe("presentation", () => {
    test("Given_long_term_When_history_rendered_Then_enables_multiline_display", () => {
      const longTerm =
        "a very very long dictionary lookup that should not be truncated";

      renderHistoryListView({
        items: [createHistoryItem({ term: longTerm })],
      });

      const button = screen.getByRole("button", { name: longTerm });
      const label = screen.getByText(longTerm);

      expect(button.className).toEqual(
        expect.stringContaining(navItemStyles["item-multiline"]),
      );
      expect(label).toHaveClass(navItemStyles["label-multiline"]);
    });
  });
});
