import type { MutableRefObject, ReactNode } from "react";
import type { LanguageOption, LanguageValue } from "../hooks/useActionInputBehavior.types";

export type LanguageVariantKey = "source" | "target";

export interface VariantInput {
  key: LanguageVariantKey;
  label?: string;
  value?: LanguageValue;
  options: LanguageOption[];
  onChange?: (value: LanguageValue) => void;
  normalizeValue?: (value: LanguageValue) => LanguageValue;
  onOpen?: () => void;
}

export interface NormalizedOption {
  value: string;
  badge: ReactNode;
  label: string;
  description?: string;
}

export interface VariantModel {
  key: LanguageVariantKey;
  label: string;
  normalizedOptions: NormalizedOption[];
  currentOption: NormalizedOption | null;
  hasOptions: boolean;
  onChange?: (value: LanguageValue) => void;
  normalizeValue?: (value: LanguageValue) => LanguageValue;
  onOpen?: () => void;
}

export interface UseLanguageLauncherParams {
  source: VariantInput;
  target: VariantInput;
}

export interface UseLanguageLauncherResult {
  open: boolean;
  triggerRef: MutableRefObject<HTMLButtonElement | null>;
  menuRef: MutableRefObject<HTMLDivElement | null>;
  variants: VariantModel[];
  activeVariant: VariantModel | null;
  handleToggle: () => void;
  handleClose: () => void;
  handleVariantEnter: (key: LanguageVariantKey) => void;
  handleSelect: (key: LanguageVariantKey, value: string) => void;
}
