import { jest } from "@jest/globals";
import type { FocusEvent } from "react";

import { PANEL_MODE_SEARCH } from "../../hooks/useBottomPanelState";
import { buildDictionaryActionBarViewModel } from "../helpers/useDictionaryActionBarViewModel.ts";
import { createInputFocusChangeHandler } from "../helpers/dictionaryInputFocusHandlers.ts";
import { shouldAutoFocusSearchInput } from "../helpers/useDictionarySearchModeAutoFocus.ts";

describe("dictionary bottom panel helpers", () => {
  describe("buildDictionaryActionBarViewModel", () => {
    it("returns original props when onReoutput is missing", () => {
      const props = { label: "noop" };
      expect(
        buildDictionaryActionBarViewModel({
          dictionaryActionBarProps: props,
          activateSearchMode: jest.fn(),
        }),
      ).toBe(props);
    });

    it("wraps onReoutput to activate search mode", () => {
      const activateSearchMode = jest.fn();
      const originalReoutput = jest.fn();
      const wrapped = buildDictionaryActionBarViewModel({
        dictionaryActionBarProps: { onReoutput: originalReoutput },
        activateSearchMode,
      });

      wrapped.onReoutput("foo");

      expect(activateSearchMode).toHaveBeenCalledTimes(1);
      expect(originalReoutput).toHaveBeenCalledWith("foo");
    });
  });

  describe("createInputFocusChangeHandler", () => {
    it("respects focus transitions within the form", () => {
      const activateActionsMode = jest.fn();
      const handlePanelFocusChange = jest.fn();
      const formElement = document.createElement("form");
      const input = document.createElement("input");
      formElement.append(input);

      const handler = createInputFocusChangeHandler({
        handlePanelFocusChange,
        activateActionsMode,
      });

      handler({
        isFocused: false,
        formElement,
        event: { relatedTarget: input } as unknown as FocusEvent,
      });

      expect(handlePanelFocusChange).toHaveBeenCalled();
      expect(activateActionsMode).not.toHaveBeenCalled();
    });

    it("activates actions mode when leaving the form", () => {
      const activateActionsMode = jest.fn();
      const handlePanelFocusChange = jest.fn();
      const formElement = document.createElement("form");
      const handler = createInputFocusChangeHandler({
        handlePanelFocusChange,
        activateActionsMode,
      });

      handler({
        isFocused: false,
        formElement,
        event: { relatedTarget: null } as unknown as FocusEvent,
      });

      expect(activateActionsMode).toHaveBeenCalledTimes(1);
    });
  });

  describe("shouldAutoFocusSearchInput", () => {
    it("requires search mode and an attached input ref", () => {
      const focusable = { current: document.createElement("input") };
      const unattached = { current: null };

      expect(
        shouldAutoFocusSearchInput({
          bottomPanelMode: PANEL_MODE_SEARCH,
          inputRef: focusable,
        }),
      ).toBe(true);

      expect(
        shouldAutoFocusSearchInput({
          bottomPanelMode: "other",
          inputRef: focusable,
        }),
      ).toBe(false);

      expect(
        shouldAutoFocusSearchInput({
          bottomPanelMode: PANEL_MODE_SEARCH,
          inputRef: unattached,
        }),
      ).toBe(false);
    });
  });
});
