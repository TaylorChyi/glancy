export type ShouldRenderDictionaryEntryArgs = {
  viewState: { isDictionary: boolean };
  entry?: { term?: string } | null;
  finalText?: string | null;
  loading?: boolean;
};

export const shouldRenderDictionaryEntry = ({
  viewState,
  entry,
  finalText,
  loading,
}: ShouldRenderDictionaryEntryArgs): boolean => {
  if (!viewState?.isDictionary) {
    return false;
  }

  return Boolean(entry || finalText || loading);
};
