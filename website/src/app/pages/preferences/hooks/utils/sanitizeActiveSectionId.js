export const sanitizeActiveSectionId = (candidateId, sections) => {
  if (!sections || sections.length === 0) {
    return "";
  }
  const fallback = sections.find((section) => !section.disabled) ?? sections[0];
  if (!candidateId) {
    return fallback.id;
  }
  const matched = sections.find(
    (section) => section.id === candidateId && !section.disabled,
  );
  return matched ? matched.id : fallback.id;
};
