/**
 * 背景：
 *  - 焦点回调在主 Hook 内部重复声明，既增加行数也不利于测试复用。
 * 目的：
 *  - 输出焦点事件处理器装配 Hook，将上下文封装为最小责任单元。
 * 关键决策与取舍：
 *  - 若未提供 onFocusChange 则返回 undefined，保持调用方无需分支判断；
 *  - 使用 useMemo 确保处理器稳定引用，避免无意义的重新渲染。
 * 影响范围：
 *  - ChatInput 焦点同步逻辑及依赖 restoreFocus 的上层组件。
 * 演进与TODO：
 *  - 后续可在此接入可观测性埋点或上下文识别策略。
 */
import { useMemo } from "react";
import type React from "react";

import type {
  FocusChangeContext,
  UseActionInputBehaviorParams,
} from "./useActionInputBehavior.types";

export interface UseFocusChangeHandlersParams {
  onFocusChange?: UseActionInputBehaviorParams["onFocusChange"];
  formRef: React.MutableRefObject<HTMLFormElement | null>;
  restoreFocus: () => void;
}

export interface UseFocusChangeHandlersResult {
  onFocus?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
}

export const useFocusChangeHandlers = ({
  onFocusChange,
  formRef,
  restoreFocus,
}: UseFocusChangeHandlersParams): UseFocusChangeHandlersResult => {
  return useMemo(() => {
    if (!onFocusChange) {
      return { onFocus: undefined, onBlur: undefined };
    }

    const createHandler =
      (
        isFocused: FocusChangeContext["isFocused"],
      ): ((event: React.FocusEvent<HTMLTextAreaElement>) => void) =>
      (event) => {
        onFocusChange({
          isFocused,
          event,
          formElement: formRef.current,
          restoreFocus,
        });
      };

    return {
      onFocus: createHandler(true),
      onBlur: createHandler(false),
    };
  }, [formRef, onFocusChange, restoreFocus]);
};
