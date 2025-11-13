import { useWordStore } from "@core/store/wordStore.js";

const captureWordStoreSnapshot = () => {
  const state = useWordStore.getState();
  return {
    ...state,
    entries: { ...state.entries },
  };
};

export const installWordStoreFixture = ({
  termKey,
  versions,
  options,
  clearBeforeSeed = true,
} = {}) => {
  const snapshot = captureWordStoreSnapshot();
  const store = useWordStore.getState();

  if (clearBeforeSeed) {
    store.clear();
  }

  if (termKey && versions) {
    store.setVersions(termKey, versions, options);
  }

  return {
    restore: () => useWordStore.setState(snapshot, true),
    setVersions: (key, nextVersions, nextOptions) => {
      useWordStore.getState().setVersions(key, nextVersions, nextOptions);
    },
    clear: () => {
      useWordStore.getState().clear();
    },
  };
};
