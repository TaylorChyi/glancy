/**
 * 背景：
 *  - Service Worker 注册逻辑新增依赖注入能力，需要通过单测验证默认路径与失败保护逻辑。
 * 目的：
 *  - 确保注册流程在具备 serviceWorker 能力时以正确路径执行，且在缺失能力时安全退化。
 * 关键决策与取舍：
 *  - 采用工厂函数注入测试桩对象，避免对真实浏览器环境产生副作用。
 * 影响范围：
 *  - `createQueueServiceWorkerRegistration` 工厂函数的行为契约。
 * 演进与TODO：
 *  - 如未来引入特性开关或多策略注册，需要补充更多分支覆盖。
 */

import { jest } from "@jest/globals";
import { createQueueServiceWorkerRegistration } from "../shared/utils/registerServiceWorker";

describe("createQueueServiceWorkerRegistration", () => {
  it("registers service worker with default path once after window load", async () => {
    /**
     * 测试目标：验证默认路径注册与幂等性。
     * 前置条件：注入拥有 serviceWorker 能力的 window/navigator 桩对象。
     * 步骤：
     *  1) 创建注册器并触发队列。
     *  2) 人工执行 load 事件回调。
     * 断言：
     *  - register 仅被调用一次，参数为默认路径。
     * 边界/异常：
     *  - 再次调用队列不会重复注册。
     */
    const navigatorStub = {
      serviceWorker: {
        register: jest.fn().mockResolvedValue(undefined),
      },
    };
    let loadListener;
    const windowStub = {
      addEventListener: jest.fn((event, handler) => {
        if (event === "load") {
          loadListener = handler;
        }
      }),
    };

    const queueRegistration = createQueueServiceWorkerRegistration({
      windowRef: windowStub,
      navigatorRef: navigatorStub,
    });

    queueRegistration();
    expect(windowStub.addEventListener).toHaveBeenCalledWith(
      "load",
      expect.any(Function),
    );

    await loadListener();
    expect(navigatorStub.serviceWorker.register).toHaveBeenCalledTimes(1);
    expect(navigatorStub.serviceWorker.register).toHaveBeenCalledWith(
      "/service-worker.js",
    );

    queueRegistration();
    expect(windowStub.addEventListener).toHaveBeenCalledTimes(1);
  });

  it("skips registration when service worker capability is unavailable", () => {
    /**
     * 测试目标：验证在缺失 serviceWorker 能力时不会注册。
     * 前置条件：navigator 桩对象不包含 serviceWorker。
     * 步骤：
     *  1) 创建注册器并触发队列。
     * 断言：
     *  - addEventListener 未被调用，避免无意义的事件绑定。
     * 边界/异常：
     *  - 保证函数在非浏览器环境中调用时安全返回。
     */
    const windowStub = {
      addEventListener: jest.fn(),
    };

    const queueRegistration = createQueueServiceWorkerRegistration({
      windowRef: windowStub,
      navigatorRef: {},
    });

    queueRegistration();
    expect(windowStub.addEventListener).not.toHaveBeenCalled();
  });
});
