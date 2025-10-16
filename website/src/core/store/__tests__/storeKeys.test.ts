import { describe, expect, test } from "@jest/globals";
import {
  STORE_KEYS,
  STORE_DESCRIPTORS,
  findStoreDescriptorByKey,
  getStoreDescriptor,
} from "@core/store";

describe("storeKeys registry", () => {
  /**
   * 测试目标：确保注册表导出的 key 集合不存在重复，以免持久化数据互相覆盖。
   * 前置条件：使用当前 storeKeys.ts 注册表。
   * 步骤：
   *  1) 枚举 STORE_KEYS；
   *  2) 使用 Set 计算唯一数量。
   * 断言：
   *  - 唯一 key 数量等于总数，意味着未检测到重复。
   * 边界/异常：
   *  - 若未来新增 key 时意外重复，此断言应立即失败给出定位。
   */
  test("Given registry When enumerating keys Then produces unique set", () => {
    const keys = Object.values(STORE_KEYS);
    const unique = new Set(keys);
    expect(unique.size).toBe(keys.length);
  });

  /**
   * 测试目标：校验 findStoreDescriptorByKey 与 getStoreDescriptor 输出一致，保证调试接口可用。
   * 前置条件：以 USER 对应的 key 为示例。
   * 步骤：
   *  1) 通过 key 反查 descriptor；
   *  2) 通过 id 再次取回 descriptor；
   * 断言：
   *  - 反查结果不为 null 且 id 正确；
   *  - 通过 id 获取的描述与 key 匹配。
   * 边界/异常：
   *  - 若反查失败，应给出详细断言信息以提示注册表缺失。
   */
  test("Given descriptor lookup When querying by key Then returns metadata", () => {
    const descriptor = findStoreDescriptorByKey(STORE_KEYS.USER);
    expect(descriptor).not.toBeNull();
    if (!descriptor) {
      throw new Error("expected descriptor for user key to exist");
    }
    expect(descriptor.id).toBe("user");
    expect(getStoreDescriptor(descriptor.id).key).toBe(STORE_KEYS.USER);
    expect(Object.keys(STORE_DESCRIPTORS)).toContain(descriptor.id);
  });
});
