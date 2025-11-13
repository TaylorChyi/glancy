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

const buildBaseState = ({
  entry = makeEntry(),
  dictionaryActionBarProps = createActionBarProps(),
  viewState: viewStateOverrides,
  reportDialog: reportDialogOverrides,
  t = defaultTranslations,
  ...restOverrides
} = {}) => {
  const baseState = {
    inputRef: { current: null },
    t,
    text: "",
    setText: jest.fn(),
    dictionarySourceLanguage: "en",
    setDictionarySourceLanguage: jest.fn(),
    dictionaryTargetLanguage: "zh",
    setDictionaryTargetLanguage: jest.fn(),
    sourceLanguageOptions: [],
    targetLanguageOptions: [],
    handleSwapLanguages: jest.fn(),
    handleSend: jest.fn(),
    handleShowDictionary: jest.fn(),
    handleShowLibrary: jest.fn(),
    handleSelectHistory: jest.fn(),
    activeView: "dictionary",
    viewState: {
      active: "dictionary",
      isDictionary: true,
      isHistory: false,
      isLibrary: false,
    },
    focusInput: jest.fn(),
    entry,
    finalText: "",
    loading: false,
    dictionaryActionBarProps,
    displayClassName: "dictionary-experience",
    popupOpen: false,
    popupMsg: "",
    closePopup: jest.fn(),
    toast: null,
    closeToast: jest.fn(),
    dictionaryTargetLanguageLabel: "目标语言",
    dictionarySourceLanguageLabel: "源语言",
    dictionarySwapLanguagesLabel: "切换",
    searchEmptyState: {
      title: "开始探索",
      description: "输入任何词汇即可获取解释",
    },
    chatInputPlaceholder: "输入查询内容",
    libraryLandingLabel: "致用单词",
    reportDialog: createReportDialog(),
    reportDialogHandlers: {
      close: jest.fn(),
      setCategory: jest.fn(),
      setDescription: jest.fn(),
      submit: jest.fn(),
    },
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
