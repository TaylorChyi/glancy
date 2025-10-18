/**
 * 背景：
 *  - 提交与键盘代理逻辑之前与主 Hook 混杂，既增加复杂度又难以单元测试。
 * 目的：
 *  - 以单一 Hook 管理提交相关的回调，向外暴露统一的表单与快捷键接口。
 * 关键决策与取舍：
 *  - 利用 useCallback 确保返回处理器的引用稳定；
 *  - 在空字符串时短路返回，保持原有防抖语义。
 * 影响范围：
 *  - ChatInput 提交流程与快捷键交互。
 * 演进与TODO：
 *  - 后续可在此扩展节流或打字声效策略。
 */
import { useCallback } from "react";
import type React from "react";

import type { UseActionInputBehaviorParams } from "./useActionInputBehavior.types";

export interface UseSubmissionHandlersParams {
  value: string;
  onSubmit?: UseActionInputBehaviorParams["onSubmit"];
  formRef: React.MutableRefObject<HTMLFormElement | null>;
  releaseFocus: () => void;
}

export interface UseSubmissionHandlersResult {
  formProps: {
    ref: React.MutableRefObject<HTMLFormElement | null>;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  };
  onTextareaKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onActionSubmit: () => void;
}

export const useSubmissionHandlers = ({
  value,
  onSubmit,
  formRef,
  releaseFocus,
}: UseSubmissionHandlersParams): UseSubmissionHandlersResult => {
  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (value.trim() === "") {
        return;
      }
      releaseFocus();
      onSubmit?.(event);
    },
    [onSubmit, releaseFocus, value],
  );

  const onTextareaKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        formRef.current?.requestSubmit();
      }
    },
    [formRef],
  );

  const onActionSubmit = useCallback(() => {
    formRef.current?.requestSubmit();
  }, [formRef]);

  return {
    formProps: {
      ref: formRef,
      onSubmit: handleSubmit,
    },
    onTextareaKeyDown,
    onActionSubmit,
  };
};
