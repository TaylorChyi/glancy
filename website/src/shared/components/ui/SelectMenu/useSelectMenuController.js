/**
 * 背景：
 *  - SelectMenu 的交互状态（展开、聚焦、触发标签推导）曾与渲染耦合，触发文件超限且测试困难。
 * 目的：
 *  - 提炼独立的控制器 Hook，以策略模式承接选项派生逻辑，并暴露纯净接口供组件组合。
 * 关键决策与取舍：
 *  - Hook 返回结构化的视图状态与动作函数，调用方仅负责布局；
 *  - 保留 requestAnimationFrame 聚焦策略，保证键盘可访问性体验稳定。
 * 影响范围：
 *  - SelectMenu 组件的状态管理与可访问性标签。
 * 演进与TODO：
 *  - TODO: 后续可注入自定义聚焦策略或滚动定位，逐步抽象为策略接口。
 */
import { useCallback, useMemo, useRef, useState } from "react";

import useMenuNavigation from "@shared/hooks/useMenuNavigation.js";

import { normalizeOptions, resolveDisplayState } from "./optionNormalizer.js";

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
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        setOpen((prev) => {
          if (
            prev ||
            !hasOptions ||
            typeof requestAnimationFrame !== "function"
          ) {
            return true;
          }
          const direction = event.key;
          requestAnimationFrame(() => {
            const items =
              menuRef.current?.querySelectorAll('[role="menuitem"]');
            if (!items || items.length === 0) {
              return;
            }
            const index = direction === "ArrowUp" ? items.length - 1 : 0;
            items[index]?.querySelector("button, [href], [tabindex]")?.focus();
          });
          return true;
        });
      }
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
