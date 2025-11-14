import { useMemo } from "react";
import { useWordStore } from "@core/store/wordStore.js";
import { useDataGovernanceStore } from "@core/store/dataGovernanceStore.ts";
import { useDictionaryExperienceState } from "./useDictionaryExperienceState.js";
import { useDictionaryExperienceContext } from "./useDictionaryExperienceContext.js";
import { useDictionaryReportDialogManager } from "./useDictionaryReportDialogManager.js";
import { useDictionaryHomeControls } from "./useDictionaryHomeControls.js";
import { useDictionaryCopyController } from "./useDictionaryCopyController.js";
import { useDictionaryLookupController } from "./useDictionaryLookupController.ts";

const useWordEntries = () => useWordStore((store) => store.entries);

const useHistoryCaptureFlag = () =>
  useDataGovernanceStore((state) => state.historyCaptureEnabled);

const useLibraryLandingLabel = (t) =>
  useMemo(() => {
    if (t.primaryNavLibraryLabel) return t.primaryNavLibraryLabel;
    if (t.favorites) return t.favorites;
    if (t.primaryNavEntriesLabel) return t.primaryNavEntriesLabel;
    return "致用单词";
  }, [t.favorites, t.primaryNavEntriesLabel, t.primaryNavLibraryLabel]);

const useDictionaryExperienceReporting = ({ state, contexts }) => {
  const { languageContext, popup, toast, languageConfig } = contexts;
  const { entry, currentTerm } = state;

  return useDictionaryReportDialogManager({
    t: languageContext.t,
    showToast: toast.showToast,
    showPopup: popup.showPopup,
    dictionarySourceLanguage: languageConfig.dictionarySourceLanguage,
    dictionaryTargetLanguage: languageConfig.dictionaryTargetLanguage,
    dictionaryFlavor: languageConfig.dictionaryFlavor,
    entry,
    activeTerm: entry?.term || currentTerm,
  });
};

const useDictionaryExperienceHomeControls = ({
  state,
  contexts,
  resetCopyFeedback,
}) => {
  const { toast } = contexts;

  return useDictionaryHomeControls({
    state,
    contexts,
    resetCopyFeedback,
    closeToast: toast.closeToast,
  });
};

const useDictionaryExperienceStores = () => {
  const lookupController = useDictionaryLookupController();
  const wordStoreApi = useWordStore;
  const wordEntries = useWordEntries();
  const historyCaptureEnabled = useHistoryCaptureFlag();
  return { lookupController, wordStoreApi, wordEntries, historyCaptureEnabled };
};

const useDictionaryExperienceControllers = ({ state, contexts }) => {
  const { entry, finalText, currentTerm } = state;
  const { languageContext } = contexts;
  const copyController = useDictionaryCopyController({
    entry,
    finalText,
    currentTerm,
    t: languageContext.t,
    showPopup: contexts.popup.showPopup,
  });
  const homeControls = useDictionaryExperienceHomeControls({
    state,
    contexts,
    resetCopyFeedback: copyController.resetCopyFeedback,
  });
  const reporting = useDictionaryExperienceReporting({ state, contexts });
  const libraryLandingLabel = useLibraryLandingLabel(languageContext.t);
  return { copyController, homeControls, reporting, libraryLandingLabel };
};

export function useDictionaryExperienceCore() {
  const state = useDictionaryExperienceState();
  const contexts = useDictionaryExperienceContext();
  const stores = useDictionaryExperienceStores();
  const controllers = useDictionaryExperienceControllers({ state, contexts });
  return {
    state,
    contexts,
    ...stores,
    ...controllers,
  };
}
