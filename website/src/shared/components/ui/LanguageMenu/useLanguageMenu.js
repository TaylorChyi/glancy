import { useCallback, useMemo, useRef, useState } from "react";

import useMenuNavigation from "@shared/hooks/useMenuNavigation.js";

import {
  resolveComparableValue,
  resolveCurrentOption,
  resolveNormalizedValue,
  toNormalizedOptions,
} from "./normalizers.js";

function useMenuState() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  useMenuNavigation(open, menuRef, triggerRef, setOpen);

  return { open, setOpen, triggerRef, menuRef };
}

function useNormalizedSelection({ options, value, normalizeValue }) {
  const normalizedOptions = useMemo(
    () => toNormalizedOptions(options, normalizeValue),
    [options, normalizeValue],
  );

  const comparableValue = useMemo(
    () => resolveComparableValue(value, normalizeValue),
    [normalizeValue, value],
  );

  const currentOption = useMemo(
    () => resolveCurrentOption(normalizedOptions, comparableValue),
    [comparableValue, normalizedOptions],
  );

  return { normalizedOptions, currentOption };
}

function useOpenEmitter(onOpen, variant) {
  return useCallback(() => {
    if (typeof onOpen === "function") {
      onOpen(variant);
    }
  }, [onOpen, variant]);
}

function useToggleHandler({ normalizedOptions, emitOpenEvent, setOpen }) {
  return useCallback(() => {
    if (normalizedOptions.length === 0) {
      return;
    }
    setOpen((prev) => {
      const next = !prev;
      if (next) {
        emitOpenEvent();
      }
      return next;
    });
  }, [emitOpenEvent, normalizedOptions, setOpen]);
}

function useSelectHandler({ normalizeValue, onChange, setOpen }) {
  return useCallback(
    (nextValue) => {
      if (!nextValue) {
        return;
      }
      const normalizedSelection = resolveNormalizedValue(
        nextValue,
        normalizeValue,
      );
      onChange?.(normalizedSelection ?? nextValue);
      setOpen(false);
    },
    [normalizeValue, onChange, setOpen],
  );
}

function useTriggerKeyDownHandler({ emitOpenEvent, menuRef, setOpen }) {
  return useCallback(
    (event) => {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        setOpen((prev) => {
          if (!prev) {
            emitOpenEvent();
          }
          return true;
        });
        requestAnimationFrame(() => {
          const items = menuRef.current?.querySelectorAll('[role="menuitem"]');
          if (!items || items.length === 0) {
            return;
          }
          const index = event.key === "ArrowUp" ? items.length - 1 : 0;
          items[index]?.querySelector("button, [href], [tabindex]")?.focus();
        });
      }
    },
    [emitOpenEvent, menuRef, setOpen],
  );
}

function useCloseHandler(setOpen) {
  return useCallback(() => {
    setOpen(false);
  }, [setOpen]);
}

function useLanguageMenuHandlers({
  normalizedOptions,
  normalizeValue,
  onChange,
  onOpen,
  variant,
  setOpen,
  menuRef,
}) {
  const emitOpenEvent = useOpenEmitter(onOpen, variant);
  const handleToggle = useToggleHandler({
    normalizedOptions,
    emitOpenEvent,
    setOpen,
  });
  const handleSelect = useSelectHandler({
    normalizeValue,
    onChange,
    setOpen,
  });
  const handleTriggerKeyDown = useTriggerKeyDownHandler({
    emitOpenEvent,
    menuRef,
    setOpen,
  });
  const closeMenu = useCloseHandler(setOpen);

  return { handleToggle, handleSelect, handleTriggerKeyDown, closeMenu };
}

export default function useLanguageMenu({
  options,
  value,
  normalizeValue,
  onChange,
  onOpen,
  variant,
}) {
  const menuState = useMenuState();
  const { normalizedOptions, currentOption } = useNormalizedSelection({
    options,
    value,
    normalizeValue,
  });

  const handlers = useLanguageMenuHandlers({
    normalizedOptions,
    normalizeValue,
    onChange,
    onOpen,
    variant,
    setOpen: menuState.setOpen,
    menuRef: menuState.menuRef,
  });

  return {
    ...menuState,
    normalizedOptions,
    currentOption,
    ...handlers,
  };
}
