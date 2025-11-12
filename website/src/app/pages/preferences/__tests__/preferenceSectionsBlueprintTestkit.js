import { renderHook, waitFor } from "@testing-library/react";
import { createPreferenceSectionsTestContext } from "../testing/usePreferenceSections.fixtures.js";

const findSectionById = (result, sectionId) =>
  result.current.sections.find((section) => section.id === sectionId);

export const createPreferenceSectionsBlueprintTestkit = ({
  usePreferenceSections,
  ACCOUNT_USERNAME_FIELD_TYPE,
}) => {
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

  const givenDefaultSections = () => setupContext();

  const whenDefaultSectionsAreRendered = () =>
    renderHook(() =>
      usePreferenceSections({
        initialSectionId: undefined,
      }),
    );

  const thenDefaultBlueprintSettles = async ({ context, result }) => {
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

  const runDefaultBlueprintScenario = async () => {
    const context = givenDefaultSections();
    const { result } = whenDefaultSectionsAreRendered();
    await thenDefaultBlueprintSettles({ context, result });
    return { context, result };
  };

  const defaultBlueprintExpectations = [
    {
      expectation: "general leads navigation",
      assertThen: ({ result }) => {
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
        expect(result.current.panel.focusHeadingId).toBe(
          "general-section-heading",
        );
        expect(result.current.panel.modalHeadingId).toBe(
          "settings-modal-fallback-heading",
        );
        expect(result.current.panel.modalHeadingText).toBe("General");
      },
    },
    {
      expectation: "account section renders identity and bindings",
      assertThen: ({ result, context }) => {
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
        expect(
          typeof accountSection.componentProps.identity.onSelectAvatar,
        ).toBe("function");
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
          accountSection.componentProps.bindings.items.map(
            (item) => item.name,
          ),
        ).toEqual([
          context.translations.settingsAccountBindingApple,
          context.translations.settingsAccountBindingGoogle,
          context.translations.settingsAccountBindingWeChat,
        ]);
        expect(
          accountSection.componentProps.bindings.items.every(
            (item) =>
              item.status ===
                context.translations.settingsAccountBindingStatusUnlinked &&
              item.actionLabel ===
                context.translations.settingsAccountBindingActionPlaceholder,
          ),
        ).toBe(true);
      },
    },
    {
      expectation: "subscription section exposes plans",
      assertThen: ({ result }) => {
        const subscriptionSection = findSectionById(result, "subscription");
        expect(subscriptionSection).toBeDefined();
        expect(subscriptionSection.Component).toBeDefined();
        expect(subscriptionSection.componentProps.planCards).toHaveLength(3);
        expect(
          subscriptionSection.componentProps.planCards.some(
            (card) => card.id === "PLUS" && card.state === "current",
          ),
        ).toBe(true);
      },
    },
    {
      expectation: "response style section populates copy and values",
      assertThen: ({ result, context }) => {
        const responseStyleSection = findSectionById(result, "responseStyle");
        expect(responseStyleSection.componentProps.copy.dropdownLabel).toBe(
          context.translations.responseStyleSelectLabel,
        );
        expect(responseStyleSection.componentProps.copy.options).toHaveLength(
          5,
        );
        expect(
          responseStyleSection.componentProps.copy.fields.map(
            (field) => field.id,
          ),
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
        expect(responseStyleSection.componentProps.state.values.goal).toBe(
          "B2",
        );
        expect(
          responseStyleSection.componentProps.state.values.responseStyle,
        ).toBe("default");
      },
    },
    {
      expectation: "avatar editor and feedback metadata defaults",
      assertThen: ({ result, context }) => {
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
      },
    },
  ];

  return {
    setupContext,
    teardown,
    runDefaultBlueprintScenario,
    defaultBlueprintExpectations,
    findSectionById,
  };
};
