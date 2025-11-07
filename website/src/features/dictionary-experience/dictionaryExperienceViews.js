export const DICTIONARY_EXPERIENCE_VIEWS = Object.freeze({
  DICTIONARY: "dictionary",
  HISTORY: "history",
  LIBRARY: "library",
});

export const isDictionaryView = (view) =>
  view === DICTIONARY_EXPERIENCE_VIEWS.DICTIONARY;

export const isHistoryView = (view) =>
  view === DICTIONARY_EXPERIENCE_VIEWS.HISTORY;

export const isLibraryView = (view) =>
  view === DICTIONARY_EXPERIENCE_VIEWS.LIBRARY;
