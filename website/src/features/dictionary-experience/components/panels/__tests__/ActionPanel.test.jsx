/* eslint-env jest */
import { render, screen, fireEvent } from "@testing-library/react";
import { jest } from "@jest/globals";
import styles from "../ActionPanel.module.css";

const recordedIconProps = [];

jest.unstable_mockModule("@shared/components/ui/Icon", () => ({
  __esModule: true,
  default: (props) => {
    recordedIconProps.push(props);
    return <span data-testid="theme-icon-stub" />;
  },
}));

jest.unstable_mockModule("@shared/components/DictionaryEntryActionBar", () => ({
  __esModule: true,
  default: ({ renderRoot }) =>
    renderRoot({
      children: <div data-testid="dictionary-entry-action-bar" />,
    }),
}));

const ActionPanel = (await import("../ActionPanel.jsx")).default;

describe("ActionPanel", () => {
  beforeEach(() => {
    recordedIconProps.length = 0;
  });

  test("renders search icon with expected sizing and delegates click", () => {
    const onRequestSearch = jest.fn();

    render(
      <ActionPanel
        actionBarProps={{ className: "" }}
        onRequestSearch={onRequestSearch}
        searchButtonLabel="返回搜索"
      />,
    );

    const searchButton = screen.getByRole("button", { name: "返回搜索" });
    fireEvent.click(searchButton);

    expect(recordedIconProps[0]?.name).toBe("search");
    expect(recordedIconProps[0]?.width).toBe(18);
    expect(recordedIconProps[0]?.height).toBe(18);
    expect(onRequestSearch).toHaveBeenCalledTimes(1);
  });

  test("wraps search box with layout shell across toolbar render modes", () => {
    const { rerender } = render(
      <ActionPanel
        actionBarProps={{ className: "" }}
        onRequestSearch={jest.fn()}
        searchButtonLabel="返回搜索"
      />,
    );

    const searchBox = screen.getByTestId("dictionary-action-panel");
    expect(searchBox.parentElement).toHaveClass(styles["panel-shell"]);

    rerender(
      <ActionPanel
        actionBarProps={{
          className: "",
          renderRoot: ({ children }) => <section>{children}</section>,
        }}
        onRequestSearch={jest.fn()}
        searchButtonLabel="返回搜索"
      />,
    );

    const searchBoxAfterRerender = screen.getByTestId(
      "dictionary-action-panel",
    );
    expect(searchBoxAfterRerender.parentElement).toHaveClass(
      styles["panel-shell"],
    );
  });
});
