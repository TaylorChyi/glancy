import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { jest } from "@jest/globals";
import { createDictionaryExperienceState } from "../../../../../tests/setup/dictionary/experienceState.js";

const clickButtonByLabel = (user, label) =>
  user.click(screen.getByRole("button", { name: label }));

const focusTextarea = async (user, textarea) => {
  await user.click(textarea);
  expect(textarea).toHaveFocus();
};

const createBuildExperienceState = ({
  focusInputMock,
  handleReoutputMock,
  inputRef,
}) =>
  (overrides = {}) => {
    const { dictionaryActionBarProps, ...rest } = overrides;
    return createDictionaryExperienceState({
      inputRef,
      focusInput: focusInputMock,
      dictionaryActionBarProps: {
        onReoutput: handleReoutputMock,
        ...(dictionaryActionBarProps ?? {}),
      },
      ...rest,
    });
  };

const createExperienceMocker = (
  useDictionaryExperience,
  buildExperienceState,
) =>
  (overrides) => {
    useDictionaryExperience.mockImplementation(() =>
      buildExperienceState(overrides),
    );
  };

const createRenderer = (
  DictionaryExperience,
  mockExperienceState,
  focusInputMock,
) =>
  (overrides) => {
    mockExperienceState(overrides);

    const user = userEvent.setup();
    render(<DictionaryExperience />);

    return {
      user,
      initialFocusCalls: focusInputMock.mock.calls.length,
    };
  };

const createFocusAssertion = (focusInputMock) => async (initialFocusCalls) => {
  await waitFor(() => {
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(focusInputMock).toHaveBeenCalledTimes(initialFocusCalls + 1);
  });
};

const createRetryAssertion = (handleReoutputMock) => async () => {
  await waitFor(() => {
    expect(handleReoutputMock).toHaveBeenCalledTimes(1);
  });
};

const createRetryPerformer = (renderExperience) => async () => {
  const context = renderExperience();
  await clickButtonByLabel(context.user, "重试释义");
  return context;
};

const createSearchSwitcher = () => async (user) => {
  await clickButtonByLabel(user, "返回搜索");
  return screen.findByRole("textbox");
};

const createReset = ({
  focusInputMock,
  handleReoutputMock,
  inputRef,
  mockExperienceState,
}) => () => {
  focusInputMock.mockClear();
  handleReoutputMock.mockClear();
  inputRef.current = null;
  mockExperienceState();
};

export function createFocusTestHarness({
  DictionaryExperience,
  useDictionaryExperience,
}) {
  const focusInputMock = jest.fn();
  const handleReoutputMock = jest.fn();
  const inputRef = { current: null };

  const buildExperienceState = createBuildExperienceState({
    focusInputMock,
    handleReoutputMock,
    inputRef,
  });
  const mockExperienceState = createExperienceMocker(
    useDictionaryExperience,
    buildExperienceState,
  );
  const renderExperience = createRenderer(
    DictionaryExperience,
    mockExperienceState,
    focusInputMock,
  );

  return {
    renderExperience,
    clickButtonByLabel,
    expectSearchModeWithFocus: createFocusAssertion(focusInputMock),
    performRetryFromActionsPanel: createRetryPerformer(renderExperience),
    switchToSearchMode: createSearchSwitcher(),
    focusTextarea,
    expectRetryHandlerCalled: createRetryAssertion(handleReoutputMock),
    reset: createReset({
      focusInputMock,
      handleReoutputMock,
      inputRef,
      mockExperienceState,
    }),
    buildExperienceState,
  };
}
