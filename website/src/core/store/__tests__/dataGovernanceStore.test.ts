import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from "@jest/globals";
import { STORE_KEYS } from "@core/store";

type StoreModule = typeof import("@core/store/dataGovernanceStore");

let storeModule: StoreModule | null = null;

const importStoreModule = async () => {
  if (storeModule) {
    return storeModule;
  }
  storeModule = await import("@core/store/dataGovernanceStore");
  return storeModule;
};

describe("dataGovernanceStore", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.resetModules();
    storeModule = null;
  });

  afterEach(async () => {
    if (!storeModule) {
      return;
    }
    const { useDataGovernanceStore } = await importStoreModule();
    useDataGovernanceStore.setState({
      retentionPolicyId: "90d",
      historyCaptureEnabled: true,
    });
  });

  /**
   * 测试目标：验证 Store 初始值与默认策略一致。
   * 前置条件：无持久化数据。
   * 步骤：
   *  1) 读取当前状态；
   * 断言：
   *  - retentionPolicyId 默认 90d；
   *  - historyCaptureEnabled 默认为 true。
   * 边界/异常：
   *  - 若默认值发生变化需同步更新测试预期。
   */
  test("Given fresh store When reading defaults Then policy and capture initialized", async () => {
    const { useDataGovernanceStore } = await importStoreModule();
    const state = useDataGovernanceStore.getState();
    expect(state.retentionPolicyId).toBe("90d");
    expect(state.historyCaptureEnabled).toBe(true);
  });

  /**
   * 测试目标：切换历史采集开关能够更新持久化状态。
   * 前置条件：默认开启。
   * 步骤：
   *  1) 调用 setHistoryCaptureEnabled(false)；
   * 断言：
   *  - historyCaptureEnabled 更新为 false。
   * 边界/异常：
   *  - 重复设置相同值不应引发副作用。
   */
  test("Given toggle request When disabling capture Then store reflects change", async () => {
    const { useDataGovernanceStore } = await importStoreModule();
    useDataGovernanceStore.getState().setHistoryCaptureEnabled(false);
    expect(useDataGovernanceStore.getState().historyCaptureEnabled).toBe(false);
  });

  /**
   * 测试目标：设置保留策略时仅接受受支持策略。
   * 前置条件：默认策略 90d。
   * 步骤：
   *  1) 选择列表中的其他策略；
   *  2) 尝试设置未知策略。
   * 断言：
   *  - 策略更新为列表项；
   *  - 对未知策略会回退到默认值。
   * 边界/异常：
   *  - DATA_RETENTION_POLICIES 需包含至少一项可选策略。
   */
  test("Given retention selection When applying policy Then store guards invalid ids", async () => {
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
    expect(useDataGovernanceStore.getState().retentionPolicyId).toBe(
      alternative.id,
    );

    useDataGovernanceStore.getState().setRetentionPolicy("invalid");
    expect(useDataGovernanceStore.getState().retentionPolicyId).toBe("90d");
    expect(getRetentionPolicyById(alternative.id)).toEqual(alternative);
  });

  /**
   * 测试目标：
   *  - 若持久化中保存了关闭历史采集的偏好，Store 初始化应立即采纳，避免窗口期写入。
   * 前置条件：
   *  - localStorage 预置 historyCaptureEnabled=false 且策略为 30d。
   * 步骤：
   *  1) 在导入 Store 模块前写入持久化快照；
   *  2) 初始化 Store 并读取状态。
   * 断言：
   *  - historyCaptureEnabled 为 false；
   *  - retentionPolicyId 为 30d。
   * 边界/异常：
   *  - 若解析失败需回退到默认值，本测试亦可捕捉异常行为。
   */
  test("Given persisted disabled capture When initializing store Then adopt snapshot", async () => {
    localStorage.setItem(
      STORE_KEYS.DATA_GOVERNANCE,
      JSON.stringify({
        state: { retentionPolicyId: "30d", historyCaptureEnabled: false },
        version: 0,
      }),
    );

    const { useDataGovernanceStore } = await importStoreModule();
    const state = useDataGovernanceStore.getState();

    expect(state.historyCaptureEnabled).toBe(false);
    expect(state.retentionPolicyId).toBe("30d");
  });
});
