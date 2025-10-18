/**
 * 背景：
 *  - LanguageMenu 既承担状态管理又承载渲染逻辑，导致 hooks 难以复用并触发结构化 lint 豁免。
 * 目的：
 *  - 抽离专用 Hook 聚合菜单的打开/关闭、键盘导航与值选择逻辑，让 UI 层保持精简。
 * 关键决策与取舍：
 *  - 通过组合 useMenuNavigation 与本地状态组装菜单行为，保留原有交互；
 *  - 仍使用策略模式注入 normalizeValue，从而支持上下游差异化语言映射；
 *  - 拒绝引入全局状态，避免为单一组件引入额外依赖。
 * 影响范围：
 *  - LanguageMenu 组件及未来可能复用该 Hook 的衍生菜单。
 * 演进与TODO：
 *  - TODO: 若未来需要异步加载选项，可在此扩展 loading/disabled 状态并暴露给 UI 层。
 */
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
  const { open, setOpen, triggerRef, menuRef } = useMenuState();
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
    setOpen,
    menuRef,
  });

  return {
    open,
    triggerRef,
    menuRef,
    normalizedOptions,
    currentOption,
    ...handlers,
  };
}
