import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from "@jest/globals";

const STORAGE_KEY = "dataGovernance";

type StoreModule = typeof import("@core/store/dataGovernanceStore");

let storeModule: StoreModule | null = null;

const importStoreModule = async () => {
  if (storeModule) {
    return storeModule;
  }
  storeModule = await import("@core/store/dataGovernanceStore");
  return storeModule;
};

const resetModuleState = () => {
  localStorage.clear();
  jest.resetModules();
  storeModule = null;
};

const restoreDefaultSnapshot = async () => {
  if (!storeModule) {
    return;
  }
  const { useDataGovernanceStore } = await importStoreModule();
  useDataGovernanceStore.setState({
    retentionPolicyId: "90d",
    historyCaptureEnabled: true,
  });
};

const registerStoreLifecycle = () => {
  beforeEach(resetModuleState);
  afterEach(restoreDefaultSnapshot);
};

const getStoreState = async () => {
  const { useDataGovernanceStore } = await importStoreModule();
  return useDataGovernanceStore.getState();
};

const setPersistedSnapshot = (snapshot: unknown) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
};

describe("dataGovernanceStore defaults", () => {
  registerStoreLifecycle();

  test("reads default policy and capture settings", async () => {
    const state = await getStoreState();
    expect(state.retentionPolicyId).toBe("90d");
    expect(state.historyCaptureEnabled).toBe(true);
  });
});

describe("dataGovernanceStore capture toggles", () => {
  registerStoreLifecycle();

  test("disables history capture through the store action", async () => {
    const state = await getStoreState();
    state.setHistoryCaptureEnabled(false);
    expect((await getStoreState()).historyCaptureEnabled).toBe(false);
  });
});

describe("dataGovernanceStore retention policies", () => {
  registerStoreLifecycle();

  test("guards invalid policies and keeps lookups in sync", async () => {
    const {
      useDataGovernanceStore,
      DATA_RETENTION_POLICIES,
      getRetentionPolicyById,
    } = await importStoreModule();
    const alternative = DATA_RETENTION_POLICIES.find(
      (policy) => policy.id !== "90d",
    );
    expect(alternative).toBeDefined();
    if (!alternative) {
      throw new Error("retention policy fixture missing alternative");
    }

    useDataGovernanceStore.getState().setRetentionPolicy(alternative.id);
    expect((await getStoreState()).retentionPolicyId).toBe(alternative.id);

    useDataGovernanceStore.getState().setRetentionPolicy("invalid");
    expect((await getStoreState()).retentionPolicyId).toBe("90d");
    expect(getRetentionPolicyById(alternative.id)).toEqual(alternative);
  });
});

describe("dataGovernanceStore persisted snapshots", () => {
  registerStoreLifecycle();

  test("adopts stored policy and capture preferences", async () => {
    setPersistedSnapshot({
      state: { retentionPolicyId: "30d", historyCaptureEnabled: false },
      version: 0,
    });

    const state = await getStoreState();
    expect(state.historyCaptureEnabled).toBe(false);
    expect(state.retentionPolicyId).toBe("30d");
  });
});
