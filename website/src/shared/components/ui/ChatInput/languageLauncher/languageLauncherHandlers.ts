import { useCallback, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { resolveNormalizedValue } from "@shared/components/ui/LanguageMenu/normalizers.js";
import type {
  LanguageVariantKey,
  VariantModel,
} from "./languageLauncher.types.js";

export const useVariantOpenEmitter = () =>
  useCallback((variant: VariantModel | null) => {
    variant?.onOpen?.();
  }, []);

export const useVisibilityHandlers = (
  variants: VariantModel[],
  activeVariant: VariantModel | null,
  setActiveKey: Dispatch<SetStateAction<LanguageVariantKey | null>>,
  emitVariantOpen: (variant: VariantModel | null) => void,
) => {
  const [open, setOpen] = useState(false);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const handleToggle = useCallback(() => {
    setOpen((previous) => {
      const next = !previous;
      if (next) {
        const fallback = activeVariant ?? variants[0] ?? null;
        if (fallback) {
          setActiveKey(fallback.key);
          emitVariantOpen(fallback);
        }
      }
      return next;
    });
  }, [activeVariant, emitVariantOpen, setActiveKey, variants]);

  return { open, handleToggle, handleClose };
};

export const useVariantEnterHandler = (
  variants: VariantModel[],
  setActiveKey: Dispatch<SetStateAction<LanguageVariantKey | null>>,
  emitVariantOpen: (variant: VariantModel | null) => void,
) =>
  useCallback(
    (key: LanguageVariantKey) => {
      const targetVariant =
        variants.find((variant) => variant.key === key) ?? null;
      if (!targetVariant) {
        return;
      }
      setActiveKey(targetVariant.key);
      emitVariantOpen(targetVariant);
    },
    [emitVariantOpen, setActiveKey, variants],
  );

export const useVariantSelectHandler = (
  variants: VariantModel[],
  handleClose: () => void,
) =>
  useCallback(
    (key: LanguageVariantKey, value: string) => {
      const targetVariant = variants.find((variant) => variant.key === key);
      if (!targetVariant) {
        return;
      }

      const normalizedSelection = resolveNormalizedValue(
        value,
        targetVariant.normalizeValue,
      );

      targetVariant.onChange?.(normalizedSelection ?? value);
      handleClose();
    },
    [handleClose, variants],
  );
