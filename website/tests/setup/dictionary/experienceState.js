import { jest } from "@jest/globals";
import { makeEntry } from "../../../src/__tests__/factories/makeEntry.js";

const defaultTranslations = {
  returnToSearch: "返回搜索",
  reoutput: "重试释义",
};

const createReportDialog = () => ({
  open: false,
  term: "",
  language: "ENGLISH",
  flavor: "BILINGUAL",
  sourceLanguage: "ENGLISH",
  targetLanguage: "CHINESE",
  category: null,
  categories: [],
  description: "",
  submitting: false,
  error: "",
});

const createActionBarProps = () => ({
  onReoutput: jest.fn(),
});

const mergeState = (base, overrides) => ({
  ...base,
  ...(overrides ?? {}),
});

const createInputControls = () => ({
  inputRef: { current: null },
  text: "",
  setText: jest.fn(),
  finalText: "",
  loading: false,
  focusInput: jest.fn(),
});

const createLanguageControls = () => ({
  dictionarySourceLanguage: "en",
  setDictionarySourceLanguage: jest.fn(),
  dictionaryTargetLanguage: "zh",
  setDictionaryTargetLanguage: jest.fn(),
  sourceLanguageOptions: [],
  targetLanguageOptions: [],
});

const createInteractionHandlers = () => ({
  handleSwapLanguages: jest.fn(),
  handleSend: jest.fn(),
  handleShowDictionary: jest.fn(),
  handleShowLibrary: jest.fn(),
  handleSelectHistory: jest.fn(),
});

const createExperienceViewState = () => ({
  activeView: "dictionary",
  viewState: {
    active: "dictionary",
    isDictionary: true,
    isHistory: false,
    isLibrary: false,
  },
});

const createDisplayState = (dictionaryActionBarProps) => ({
  dictionaryActionBarProps,
  displayClassName: "dictionary-experience",
  popupOpen: false,
  popupMsg: "",
  closePopup: jest.fn(),
  toast: null,
  closeToast: jest.fn(),
});

const createLabels = () => ({
  dictionaryTargetLanguageLabel: "目标语言",
  dictionarySourceLanguageLabel: "源语言",
  dictionarySwapLanguagesLabel: "切换",
  chatInputPlaceholder: "输入查询内容",
  libraryLandingLabel: "致用单词",
});

const createSearchState = () => ({
  searchEmptyState: {
    title: "开始探索",
    description: "输入任何词汇即可获取解释",
  },
});

const createReportDialogHandlers = () => ({
  close: jest.fn(),
  setCategory: jest.fn(),
  setDescription: jest.fn(),
  submit: jest.fn(),
});

const buildBaseState = ({
  entry = makeEntry(),
  dictionaryActionBarProps = createActionBarProps(),
  viewState: viewStateOverrides,
  reportDialog: reportDialogOverrides,
  t = defaultTranslations,
  ...restOverrides
} = {}) => {
  const baseState = {
    ...createInputControls(),
    ...createLanguageControls(),
    ...createInteractionHandlers(),
    ...createExperienceViewState(),
    ...createDisplayState(dictionaryActionBarProps),
    ...createLabels(),
    ...createSearchState(),
    t,
    entry,
    reportDialog: createReportDialog(),
    reportDialogHandlers: createReportDialogHandlers(),
    ...restOverrides,
  };

  return {
    ...baseState,
    viewState: mergeState(baseState.viewState, viewStateOverrides),
    reportDialog: mergeState(baseState.reportDialog, reportDialogOverrides),
  };
};

export function createDictionaryExperienceState(overrides = {}) {
  return buildBaseState(overrides);
}
