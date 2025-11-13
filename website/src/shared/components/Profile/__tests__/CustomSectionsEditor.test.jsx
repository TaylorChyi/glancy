/* eslint-env jest */
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { jest } from "@jest/globals";
import CustomSectionsEditor from "@shared/components/Profile/CustomSectionsEditor";

const t = {
  customSectionsTitle: "Custom sections",
  customSectionsDescription: "Configure your custom fields",
  customSectionAdd: "Add section",
  customSectionsEmpty: "No sections",
  customSectionTitlePlaceholder: "Section title",
  customSectionRemove: "Remove section",
  customSectionItemLabelPlaceholder: "Item label",
  customSectionItemValuePlaceholder: "Item value",
  customSectionItemRemove: "Remove item",
  customSectionItemAdd: "Add item",
};

const styles = {
  "custom-sections": "custom-sections",
  "custom-sections-header": "custom-sections-header",
  "custom-section-add": "custom-section-add",
  "custom-sections-body": "custom-sections-body",
  "custom-sections-empty": "custom-sections-empty",
  "custom-section-card": "custom-section-card",
  "custom-section-header": "custom-section-header",
  "custom-section-remove": "custom-section-remove",
  "custom-items": "custom-items",
  "custom-item-row": "custom-item-row",
  "custom-item-remove": "custom-item-remove",
  "custom-item-add": "custom-item-add",
};

const baseSection = {
  id: "section-1",
  title: "Initial title",
  items: [
    { id: "item-1", label: "Initial label", value: "Initial value" },
  ],
};

const renderEditor = (overrides = {}) => {
  const props = {
    sections: [baseSection],
    onChange: jest.fn(),
    t,
    styles,
    ...overrides,
  };
  const utils = render(<CustomSectionsEditor {...props} />);
  return { ...utils, props };
};

const getLatestSections = (mockFn) => {
  const calls = mockFn.mock.calls;
  return calls[calls.length - 1][0];
};

describe("CustomSectionsEditor", () => {
  it("appends a new section when none exist", () => {
    const onChange = jest.fn();
    renderEditor({ sections: [], onChange });

    fireEvent.click(screen.getByRole("button", { name: "Add section" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    const sections = onChange.mock.calls[0][0];
    expect(sections).toHaveLength(1);
    expect(sections[0].items).toHaveLength(1);
  });

  it("propagates title and item edits", () => {
    const { props } = renderEditor();
    const { onChange } = props;

    fireEvent.change(screen.getByPlaceholderText("Section title"), {
      target: { value: "Updated title" },
    });

    let sections = getLatestSections(onChange);
    expect(sections[0].title).toBe("Updated title");

    fireEvent.change(screen.getByPlaceholderText("Item value"), {
      target: { value: "Updated value" },
    });

    sections = getLatestSections(onChange);
    expect(sections[0].items[0].value).toBe("Updated value");
  });

  it("ensures a placeholder item remains after deletion", () => {
    const { props } = renderEditor();
    const { onChange } = props;

    fireEvent.click(screen.getByRole("button", { name: "Remove item" }));

    const sections = getLatestSections(onChange);
    expect(sections[0].items).toHaveLength(1);
    expect(sections[0].items[0].label).toBe("");
    expect(sections[0].items[0].value).toBe("");
  });

  it("adds additional items within a section", () => {
    const { props } = renderEditor();
    const { onChange } = props;

    fireEvent.click(screen.getByRole("button", { name: "Add item" }));

    const sections = getLatestSections(onChange);
    expect(sections[0].items).toHaveLength(2);
  });
});
