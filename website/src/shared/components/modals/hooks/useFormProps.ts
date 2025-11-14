import { useMemo } from "react";
import type {
  ActiveSection,
  FormProps,
  ModalMetadata,
  PreferenceSectionsData,
  RegisterHeading,
} from "../settingsModalTypes";

const createFormProps = ({
  metadata,
  handleSubmit,
  registerFallbackHeading,
  activeSection,
}: {
  metadata: ModalMetadata;
  handleSubmit: PreferenceSectionsData["handleSubmit"];
  registerFallbackHeading: RegisterHeading;
  activeSection: ActiveSection;
}): FormProps => ({
  ariaHeadingId: metadata.headingId,
  ariaDescriptionId: metadata.descriptionId,
  sectionHeadingId: metadata.sectionHeadingId,
  sectionDescriptionId: metadata.sectionDescriptionId,
  onSubmit: handleSubmit,
  shouldRenderFallbackHeading: metadata.shouldRenderFallbackHeading,
  fallbackHeadingId: metadata.fallbackHeadingId,
  fallbackHeadingText: metadata.fallbackHeadingText,
  registerFallbackHeading,
  activeSection,
});

const useFormProps = ({
  metadata,
  handleSubmit,
  registerFallbackHeading,
  activeSection,
}: {
  metadata: ModalMetadata;
  handleSubmit: PreferenceSectionsData["handleSubmit"];
  registerFallbackHeading: RegisterHeading;
  activeSection: ActiveSection;
}): FormProps =>
  useMemo(
    () =>
      createFormProps({
        metadata,
        handleSubmit,
        registerFallbackHeading,
        activeSection,
      }),
    [
      metadata.headingId,
      metadata.descriptionId,
      metadata.sectionHeadingId,
      metadata.sectionDescriptionId,
      handleSubmit,
      metadata.shouldRenderFallbackHeading,
      metadata.fallbackHeadingId,
      metadata.fallbackHeadingText,
      registerFallbackHeading,
      activeSection,
    ],
  );

export default useFormProps;
