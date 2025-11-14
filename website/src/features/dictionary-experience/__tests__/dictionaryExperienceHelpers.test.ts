import { jest } from "@jest/globals";

import { shouldRenderDictionaryEntry } from "../components/helpers/dictionaryLayoutHelpers.ts";
import type { BottomPanelAssemblyArgs } from "../components/helpers/dictionaryBottomPanelHelpers.ts";
import {
  buildBottomPanelModel,
  createBottomPanelInputProps,
  createBottomPanelProps,
  shouldRenderBottomPanel,
} from "../components/helpers/dictionaryBottomPanelHelpers.ts";

const createBottomPanelStateMock = () => ({
  mode: "search",
  activateSearchMode: jest.fn(),
});

const createBottomPanelArgs = ({
  stateMock,
  handleInputFocusChange,
}: {
  stateMock: ReturnType<typeof createBottomPanelStateMock>;
  handleInputFocusChange: jest.Mock;
}): BottomPanelAssemblyArgs => ({
  isLibraryView: false,
  bottomPanelState: stateMock as any,
  dictionaryActionBarViewModel: { foo: "bar" },
  hasDefinition: true,
  inputRef: { current: document.createElement("input") },
  text: "hello",
  setText: jest.fn(),
  handleSend: jest.fn(),
  placeholder: "type",
  dictionarySourceLanguage: "en",
  dictionarySourceLanguageLabel: "English",
  setDictionarySourceLanguage: jest.fn(),
  dictionaryTargetLanguage: "zh",
  dictionaryTargetLanguageLabel: "Chinese",
  setDictionaryTargetLanguage: jest.fn(),
  sourceLanguageOptions: ["en"],
  targetLanguageOptions: ["zh"],
  handleSwapLanguages: jest.fn(),
  swapLabel: "swap",
  searchButtonLabel: "search",
  handleInputFocusChange,
});

const expectBottomPanelAssembly = (args: BottomPanelAssemblyArgs) => {
  expect(createBottomPanelInputProps(args)).toMatchObject({
    text: "hello",
    sourceLanguageLabel: "English",
    targetLanguageLabel: "Chinese",
    searchButtonLabel: "search",
  });

  const props = createBottomPanelProps(args);
  expect(props).toMatchObject({
    bottomPanelMode: "search",
    actionPanelProps: { foo: "bar" },
    handleInputFocusChange: args.handleInputFocusChange,
  });

  expect(buildBottomPanelModel(args)).toEqual({
    shouldRender: true,
    props,
  });
};

describe("dictionary layout helpers", () => {
  describe("shouldRenderDictionaryEntry", () => {
    it("returns false when view is not dictionary", () => {
      expect(
        shouldRenderDictionaryEntry({
          viewState: { isDictionary: false },
          entry: { term: "test" },
          finalText: "final",
          loading: true,
        }),
      ).toBe(false);
    });

    it("returns false when dictionary view lacks content", () => {
      expect(
        shouldRenderDictionaryEntry({
          viewState: { isDictionary: true },
        }),
      ).toBe(false);
    });

    it("returns true when dictionary view has entry", () => {
      expect(
        shouldRenderDictionaryEntry({
          viewState: { isDictionary: true },
          entry: { term: "value" },
        }),
      ).toBe(true);
    });

    it("returns true when dictionary view is loading", () => {
      expect(
        shouldRenderDictionaryEntry({
          viewState: { isDictionary: true },
          loading: true,
        }),
      ).toBe(true);
    });
  });
});

describe("dictionary bottom panel helpers", () => {
  it("determines render visibility based on library view", () => {
    expect(shouldRenderBottomPanel(false)).toBe(true);
    expect(shouldRenderBottomPanel(true)).toBe(false);
  });

  it("assembles bottom panel props with provided values", () => {
    const stateMock = createBottomPanelStateMock();
    const handleInputFocusChange = jest.fn();
    const args = createBottomPanelArgs({
      stateMock,
      handleInputFocusChange,
    });

    expectBottomPanelAssembly(args);
  });

  it("marks bottom panel as hidden in library view", () => {
    const stateMock = createBottomPanelStateMock();
    const result = buildBottomPanelModel({
      isLibraryView: true,
      bottomPanelState: stateMock as any,
      dictionaryActionBarViewModel: undefined,
      hasDefinition: false,
      inputRef: { current: null },
      text: "",
      setText: jest.fn(),
      handleSend: jest.fn(),
      placeholder: undefined,
      dictionarySourceLanguage: undefined,
      dictionarySourceLanguageLabel: undefined,
      setDictionarySourceLanguage: jest.fn(),
      dictionaryTargetLanguage: undefined,
      dictionaryTargetLanguageLabel: undefined,
      setDictionaryTargetLanguage: jest.fn(),
      sourceLanguageOptions: [],
      targetLanguageOptions: [],
      handleSwapLanguages: jest.fn(),
      swapLabel: undefined,
      searchButtonLabel: "search",
      handleInputFocusChange: jest.fn(),
    });

    expect(result.shouldRender).toBe(false);
  });
});
