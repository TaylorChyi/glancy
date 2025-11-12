import { act, renderHook } from "@testing-library/react";
import { usePreferenceNavigation } from "../usePreferenceNavigation.js";

const buildSections = () => [
  { id: "general", label: "General" },
  { id: "account", label: "Account" },
  { id: "data", label: "Data" },
];

describe("usePreferenceNavigation", () => {
  it("Given unknown initial section when hook mounts then falls back to a valid section", () => {
    const sections = buildSections();
    const { result } = renderHook(() =>
      usePreferenceNavigation({
        initialSectionId: "missing",
        sections,
      }),
    );

    expect(result.current.activeSectionId).toBe("general");

    act(() => {
      result.current.handleSectionSelect(sections[2]);
    });

    expect(result.current.activeSectionId).toBe("data");
  });

  it("Given disabled selections and shrinking sections when interactions happen then state stays sanitized", async () => {
    const enabled = { id: "general", label: "General" };
    const disabled = { id: "account", label: "Account", disabled: true };

    const { result, rerender } = renderHook(
      ({ sections }) =>
        usePreferenceNavigation({
          initialSectionId: "general",
          sections,
        }),
      {
        initialProps: { sections: [enabled, disabled] },
      },
    );

    act(() => {
      result.current.handleSectionSelect(disabled);
    });

    expect(result.current.activeSectionId).toBe("general");

    await act(async () => {
      rerender({ sections: [disabled] });
    });

    expect(result.current.activeSectionId).toBe("account");
  });
});
