import { renderHook, waitFor } from "@testing-library/react";

import { createPreferenceSectionsTestContext } from "../testing/usePreferenceSections.fixtures.js";

export const findSectionById = (result, sectionId) =>
  result.current.sections.find((section) => section.id === sectionId);

export const createPreferenceSectionsContextManager = () => {
  let activeContext;

  const setupContext = (options) => {
    if (activeContext) {
      activeContext.restore();
    }

    activeContext = createPreferenceSectionsTestContext(options);
    return activeContext;
  };

  const teardown = () => {
    if (activeContext) {
      activeContext.restore();
      activeContext = undefined;
    }
  };

  return { setupContext, teardown };
};

export const renderDefaultPreferenceSections = ({ usePreferenceSections }) =>
  renderHook(() =>
    usePreferenceSections({
      initialSectionId: undefined,
    }),
  );

export const waitForDefaultBlueprintToSettle = async ({ context, result }) => {
  await waitFor(() => {
    expect(context.fetchProfileMock).toHaveBeenCalledWith({
      token: "token-123",
    });
  });

  await waitFor(() => {
    const responseStyleSection = findSectionById(result, "responseStyle");
    expect(responseStyleSection.componentProps.state.status).toBe("ready");
    expect(responseStyleSection.componentProps.message).toBeUndefined();
  });
};

export const runDefaultBlueprintScenario = async ({
  setupContext,
  usePreferenceSections,
}) => {
  const context = setupContext();
  const { result } = renderDefaultPreferenceSections({ usePreferenceSections });

  await waitForDefaultBlueprintToSettle({ context, result });

  return { context, result };
};

export const expectGeneralLeadsNavigation = ({ result }) => {
  expect(result.current.sections.map((section) => section.id)).toEqual([
    "general",
    "responseStyle",
    "data",
    "keyboard",
    "account",
    "subscription",
  ]);
  expect(result.current.activeSectionId).toBe("general");
  expect(result.current.panel.headingId).toBe("general-section-heading");
  expect(result.current.panel.focusHeadingId).toBe("general-section-heading");
  expect(result.current.panel.modalHeadingId).toBe(
    "settings-modal-fallback-heading",
  );
  expect(result.current.panel.modalHeadingText).toBe("General");
};

export const expectAccountSectionIdentityAndBindings = ({
  result,
  context,
  ACCOUNT_USERNAME_FIELD_TYPE,
}) => {
  const accountSection = findSectionById(result, "account");

  expect(accountSection).toBeDefined();
  expect(accountSection.Component).toBeDefined();
  expect(accountSection.componentProps.identity.displayName).toBe("amy");
  expect(accountSection.componentProps.identity.changeLabel).toBe(
    context.translations.changeAvatar,
  );
  expect(accountSection.componentProps.identity.avatarAlt).toBe(
    context.translations.prefAccountTitle,
  );
  expect(typeof accountSection.componentProps.identity.onSelectAvatar).toBe(
    "function",
  );
  expect(accountSection.componentProps.identity.isUploading).toBe(false);
  expect(accountSection.componentProps.fields[0].type).toBe(
    ACCOUNT_USERNAME_FIELD_TYPE,
  );
  expect(
    accountSection.componentProps.fields[0].usernameEditorProps,
  ).toMatchObject({
    username: "amy",
  });
  expect(accountSection.componentProps.bindings.title).toBe(
    context.translations.settingsAccountBindingTitle,
  );
  expect(accountSection.componentProps.bindings.items).toHaveLength(3);
  expect(
    accountSection.componentProps.bindings.items.map((item) => item.name),
  ).toEqual([
    context.translations.settingsAccountBindingApple,
    context.translations.settingsAccountBindingGoogle,
    context.translations.settingsAccountBindingWeChat,
  ]);
  expect(
    accountSection.componentProps.bindings.items.every(
      (item) =>
        item.status === context.translations.settingsAccountBindingStatusUnlinked &&
        item.actionLabel ===
          context.translations.settingsAccountBindingActionPlaceholder,
    ),
  ).toBe(true);
};

export const expectSubscriptionSectionExposesPlans = ({ result }) => {
  const subscriptionSection = findSectionById(result, "subscription");

  expect(subscriptionSection).toBeDefined();
  expect(subscriptionSection.Component).toBeDefined();
  expect(subscriptionSection.componentProps.planCards).toHaveLength(3);
  expect(
    subscriptionSection.componentProps.planCards.some(
      (card) => card.id === "PLUS" && card.state === "current",
    ),
  ).toBe(true);
};

export const expectResponseStyleSectionPopulatesCopyAndValues = ({
  result,
  context,
}) => {
  const responseStyleSection = findSectionById(result, "responseStyle");

  expect(responseStyleSection.componentProps.copy.dropdownLabel).toBe(
    context.translations.responseStyleSelectLabel,
  );
  expect(responseStyleSection.componentProps.copy.options).toHaveLength(5);
  expect(
    responseStyleSection.componentProps.copy.fields.map((field) => field.id),
  ).toEqual(["job", "education", "currentAbility", "goal", "interests"]);
  expect(
    responseStyleSection.componentProps.copy.fields
      .filter((field) => field.multiline)
      .map((field) => field.id),
  ).toEqual(["goal", "interests"]);
  expect(
    responseStyleSection.componentProps.copy.fields.find(
      (field) => field.id === "goal",
    ).rows,
  ).toBe(3);
  expect(responseStyleSection.componentProps.state.values.goal).toBe("B2");
  expect(responseStyleSection.componentProps.state.values.responseStyle).toBe(
    "default",
  );
};

export const expectAvatarEditorAndFeedbackDefaults = ({ result, context }) => {
  expect(result.current.avatarEditor).toBeDefined();
  expect(typeof result.current.avatarEditor.modalProps.onConfirm).toBe(
    "function",
  );
  expect(result.current.avatarEditor.modalProps.open).toBe(false);
  expect(result.current.feedback.redeemToast).toMatchObject({
    open: false,
    message: "",
    closeLabel: context.translations.toastDismissLabel,
    duration: 3000,
  });
};

export const createDefaultBlueprintExpectations = ({
  ACCOUNT_USERNAME_FIELD_TYPE,
}) => [
  {
    expectation: "general leads navigation",
    assertThen: (scenario) => expectGeneralLeadsNavigation(scenario),
  },
  {
    expectation: "account section renders identity and bindings",
    assertThen: (scenario) =>
      expectAccountSectionIdentityAndBindings({
        ...scenario,
        ACCOUNT_USERNAME_FIELD_TYPE,
      }),
  },
  {
    expectation: "subscription section exposes plans",
    assertThen: (scenario) => expectSubscriptionSectionExposesPlans(scenario),
  },
  {
    expectation: "response style section populates copy and values",
    assertThen: (scenario) =>
      expectResponseStyleSectionPopulatesCopyAndValues(scenario),
  },
  {
    expectation: "avatar editor and feedback metadata defaults",
    assertThen: (scenario) => expectAvatarEditorAndFeedbackDefaults(scenario),
  },
];

