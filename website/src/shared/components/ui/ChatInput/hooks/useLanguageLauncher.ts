import { useRef } from "react";
import {
  useVariantModel,
  useVariants,
  useActiveVariantState,
} from "../languageLauncher/languageLauncherModels.js";
import {
  useVariantOpenEmitter,
  useVisibilityHandlers,
  useVariantEnterHandler,
  useVariantSelectHandler,
} from "../languageLauncher/languageLauncherHandlers.js";
import type {
  UseLanguageLauncherParams,
  UseLanguageLauncherResult,
} from "../languageLauncher/languageLauncher.types.js";

export type {
  LanguageVariantKey,
  VariantInput,
  VariantModel,
  UseLanguageLauncherParams,
  UseLanguageLauncherResult,
} from "../languageLauncher/languageLauncher.types.js";

export default function useLanguageLauncher({
  source,
  target,
}: UseLanguageLauncherParams): UseLanguageLauncherResult {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const sourceModel = useVariantModel(source);
  const targetModel = useVariantModel(target);
  const variants = useVariants(sourceModel, targetModel);
  const { activeVariant, setActiveKey } = useActiveVariantState(variants);
  const emitVariantOpen = useVariantOpenEmitter();
  const visibility = useVisibilityHandlers(
    variants,
    activeVariant,
    setActiveKey,
    emitVariantOpen,
  );
  const handleVariantEnter = useVariantEnterHandler(
    variants,
    setActiveKey,
    emitVariantOpen,
  );
  const handleSelect = useVariantSelectHandler(
    variants,
    visibility.handleClose,
  );

  return {
    triggerRef,
    menuRef,
    variants,
    activeVariant,
    handleVariantEnter,
    handleSelect,
    ...visibility,
  };
}
