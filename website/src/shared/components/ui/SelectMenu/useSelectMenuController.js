import { useCallback, useMemo, useRef, useState } from "react";

import useMenuNavigation from "@shared/hooks/useMenuNavigation.js";

import { normalizeOptions, resolveDisplayState } from "./optionNormalizer.js";

const focusMenuEdgeItem = (menuRef, direction) => {
  if (typeof requestAnimationFrame !== "function") {
    return;
  }

  requestAnimationFrame(() => {
    const items = menuRef.current?.querySelectorAll('[role="menuitem"]');
    if (!items?.length) {
      return;
    }
    const index = direction === "ArrowUp" ? items.length - 1 : 0;
    items[index]?.querySelector("button, [href], [tabindex]")?.focus();
  });
};

const useSelectMenuModel = ({ options, value, placeholder, ariaLabel }) => {
  const normalizedOptions = useMemo(() => normalizeOptions(options), [options]);

  const normalizedValue = value != null ? String(value) : "";
  const displayState = useMemo(
    () =>
      resolveDisplayState({
        options: normalizedOptions,
        normalizedValue,
        placeholder,
      }),
    [normalizedOptions, normalizedValue, placeholder],
  );

  const resolvedAriaLabel = useMemo(
    () => ariaLabel || displayState.triggerLabel,
    [ariaLabel, displayState.triggerLabel],
  );

  return {
    normalizedOptions,
    triggerLabel: displayState.triggerLabel,
    isShowingPlaceholder: displayState.isShowingPlaceholder,
    activeValue: displayState.activeOption?.normalizedValue ?? "",
    resolvedAriaLabel,
    hasOptions: normalizedOptions.length > 0,
  };
};

const useTriggerKeyDownHandler = ({ hasOptions, menuRef, setOpen }) =>
  useCallback(
    (event) => {
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
        return;
      }

      event.preventDefault();

      setOpen((prev) => {
        if (prev || !hasOptions) {
          return true;
        }

        focusMenuEdgeItem(menuRef, event.key);
        return true;
      });
    },
    [hasOptions, menuRef, setOpen],
  );

const useSelectMenuInteractions = ({ hasOptions, onChange }) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  useMenuNavigation(open, menuRef, triggerRef, setOpen);

  const handleToggle = useCallback(() => {
    if (!hasOptions) {
      return;
    }
    setOpen((prev) => !prev);
  }, [hasOptions]);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const handleSelect = useCallback(
    (option) => {
      if (!option) {
        return;
      }
      onChange?.(option.rawValue);
      setOpen(false);
    },
    [onChange],
  );

  const handleTriggerKeyDown = useTriggerKeyDownHandler({
    hasOptions,
    menuRef,
    setOpen,
  });

  return {
    open,
    triggerRef,
    menuRef,
    handleToggle,
    handleClose,
    handleSelect,
    handleTriggerKeyDown,
  };
};

export default function useSelectMenuController(params) {
  const model = useSelectMenuModel(params);
  const interactions = useSelectMenuInteractions({
    hasOptions: model.hasOptions,
    onChange: params.onChange,
  });

  return {
    ...model,
    ...interactions,
  };
}
