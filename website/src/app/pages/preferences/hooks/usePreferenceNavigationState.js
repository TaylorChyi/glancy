import { useEffect, useRef, useState } from "react";
import { sanitizeActiveSectionId } from "./utils/sanitizeActiveSectionId.js";

const shouldApplyInitialSection = (
  tracker,
  initialSectionId,
  nextInitial,
) => {
  return (
    !tracker.hasAppliedInitial ||
    tracker.previousInitial !== initialSectionId ||
    tracker.previousSanitized !== nextInitial
  );
};

const useInitialSectionSync = ({
  initialSectionId,
  sections,
  setActiveSectionId,
}) => {
  const trackerRef = useRef({
    hasAppliedInitial: false,
    previousInitial: initialSectionId,
    previousSanitized: sanitizeActiveSectionId(initialSectionId, sections),
  });

  useEffect(() => {
    const tracker = trackerRef.current;
    const nextInitial = sanitizeActiveSectionId(initialSectionId, sections);

    if (!shouldApplyInitialSection(tracker, initialSectionId, nextInitial)) {
      return undefined;
    }

    tracker.hasAppliedInitial = true;
    tracker.previousInitial = initialSectionId;
    tracker.previousSanitized = nextInitial;
    setActiveSectionId((current) =>
      current === nextInitial ? current : nextInitial,
    );

    return undefined;
  }, [initialSectionId, sections, setActiveSectionId]);
};

const useActiveSectionSanitizer = ({ sections, setActiveSectionId }) => {
  useEffect(() => {
    setActiveSectionId((current) => {
      const sanitized = sanitizeActiveSectionId(current, sections);
      return sanitized === current ? current : sanitized;
    });
  }, [sections, setActiveSectionId]);
};

export const usePreferenceNavigationState = ({
  initialSectionId,
  sections,
}) => {
  const [activeSectionId, setActiveSectionId] = useState(() =>
    sanitizeActiveSectionId(initialSectionId, sections),
  );

  useActiveSectionSanitizer({ sections, setActiveSectionId });
  useInitialSectionSync({ initialSectionId, sections, setActiveSectionId });

  return { activeSectionId, setActiveSectionId };
};
