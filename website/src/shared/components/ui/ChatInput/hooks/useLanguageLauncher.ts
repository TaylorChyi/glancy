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
  VariantInput,
  VariantModel,
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

type ActiveVariantState = ReturnType<typeof useActiveVariantState>;
type EmitVariantOpen = ReturnType<typeof useVariantOpenEmitter>;

const useLauncherFilterScenario = (
  sourceInput: VariantInput,
  targetInput: VariantInput,
  emitVariantOpen: EmitVariantOpen,
) => {
  const sourceModel = useVariantModel(sourceInput);
  const targetModel = useVariantModel(targetInput);
  const variants = useVariants(sourceModel, targetModel);
  const { activeVariant, setActiveKey } = useActiveVariantState(variants);
  const handleVariantEnter = useVariantEnterHandler(
    variants,
    setActiveKey,
    emitVariantOpen,
  );

  return {
    variants,
    activeVariant,
    setActiveKey,
    handleVariantEnter,
  };
};

const useLauncherOpenScenario = ({
  variants,
  activeVariant,
  setActiveKey,
  emitVariantOpen,
}: {
  variants: VariantModel[];
  activeVariant: VariantModel | null;
  setActiveKey: ActiveVariantState["setActiveKey"];
  emitVariantOpen: EmitVariantOpen;
}) =>
  useVisibilityHandlers(
    variants,
    activeVariant,
    setActiveKey,
    emitVariantOpen,
  );

const useLauncherSubmitScenario = (
  variants: VariantModel[],
  handleClose: () => void,
) => {
  const handleSelect = useVariantSelectHandler(variants, handleClose);
  return { handleSelect };
};

export default function useLanguageLauncher({
  source,
  target,
}: UseLanguageLauncherParams): UseLanguageLauncherResult {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const emitVariantOpen = useVariantOpenEmitter();
  const { variants, activeVariant, setActiveKey, handleVariantEnter } = useLauncherFilterScenario(
    source,
    target,
    emitVariantOpen,
  );
  const visibility = useLauncherOpenScenario({
    variants,
    activeVariant,
    setActiveKey,
    emitVariantOpen,
  });
  const { handleSelect } = useLauncherSubmitScenario(variants, visibility.handleClose);
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
