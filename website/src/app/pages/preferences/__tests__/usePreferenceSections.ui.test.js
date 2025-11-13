import { act, renderHook, waitFor } from "@testing-library/react";
import {
  createPreferenceSectionsBlueprintTestkit,
} from "./preferenceSectionsBlueprintTestkit.js";
import { loadPreferenceSectionsModules } from "../testing/usePreferenceSections.fixtures.js";

let usePreferenceSections;
let ACCOUNT_USERNAME_FIELD_TYPE;
let setupContext;
let teardown;

const renderPreferenceSections = (hookProps = {}, contextOptions) => {
  setupContext(contextOptions);
  return renderHook(() => usePreferenceSections(hookProps));
};

const selectSection = (result, sectionId) => {
  act(() =>
    result.current.handleSectionSelect({
      id: sectionId,
      disabled: false,
    }),
  );
};

beforeAll(async () => {
  ({ usePreferenceSections, ACCOUNT_USERNAME_FIELD_TYPE } =
    await loadPreferenceSectionsModules());
  const testkit = createPreferenceSectionsBlueprintTestkit({
    usePreferenceSections,
    ACCOUNT_USERNAME_FIELD_TYPE,
  });
  setupContext = testkit.setupContext;
  teardown = testkit.teardown;
});

afterEach(() => {
  teardown?.();
});

test("Given legacy section id When initializing Then selection falls back to general", () => {
  // Arrange & Act
  const { result } = renderPreferenceSections({ initialSectionId: "privacy" });

  // Assert
  expect(result.current.activeSectionId).toBe("general");
  expect(result.current.panel.headingId).toBe("general-section-heading");
});

test("Given blank section titles When resolving modal heading Then fallback title is used", () => {
  // Arrange
  const { result } = renderPreferenceSections(
    { initialSectionId: "keyboard" },
    {
      translationOverrides: {
        settingsTabKeyboard: "   ",
        settingsKeyboardDescription: "   ",
      },
    },
  );

  // Assert
  expect(result.current.panel.focusHeadingId).toBe("keyboard-section-heading");
  expect(result.current.panel.modalHeadingText).toBe(result.current.copy.title);
  expect(result.current.panel.modalHeadingId).toBe(
    "settings-modal-fallback-heading",
  );
});

test("Given keyboard section without summary When rendering Then panel description clears", () => {
  // Arrange & Act
  const { result } = renderPreferenceSections({
    initialSectionId: "keyboard",
  });

  // Assert
  expect(result.current.activeSection?.componentProps?.message).toBeUndefined();
  expect(result.current.panel.descriptionId).toBeUndefined();
});

test("Given section switch When selecting data Then heading metadata updates", async () => {
  // Arrange
  const { result } = renderPreferenceSections({
    initialSectionId: undefined,
  });

  // Act
  selectSection(result, "data");

  // Assert
  expect(result.current.activeSectionId).toBe("data");
  await waitFor(() => {
    expect(result.current.panel.focusHeadingId).toBe("data-section-heading");
    expect(result.current.panel.modalHeadingText).toBe("Data controls");
  });
});
