import { jest } from "@jest/globals";
import { AudioManager } from "@shared/utils/audioManager.js";

/**
 * 测试目标：当 stop 遇到 jsdom 未实现的 pause 接口时，仍需清空音源并复位当前实例。
 * 前置条件：准备一个 pause 会抛出 "Not implemented" 的模拟 audio 对象。
 * 步骤：
 *  1) 调用 play 使管理器持有该音频；
 *  2) 调用 stop 触发安全降级逻辑。
 * 断言：
 *  - stop 不抛出异常；
 *  - audio.src 被重置为空串；
 *  - 管理器 current 指针被清空。
 * 边界/异常：验证 pause 缺失实现的场景。
 */
test(
  "GivenNotImplementedPause_WhenStop_ShouldClearSourceAndReleaseCurrent",
  async () => {
    const manager = new AudioManager();
    const audio = {
      src: "blob://audio", // 模拟已有播放源
      pause: jest.fn(() => {
        throw new Error("Not implemented: HTMLMediaElement.prototype.pause");
      }),
      play: jest.fn().mockResolvedValue(undefined),
    };

    await expect(manager.play(audio)).resolves.toBeUndefined();

    expect(() => manager.stop(audio)).not.toThrow();
    expect(audio.src).toBe("");
    expect(manager.current).toBeNull();
  },
);

/**
 * 测试目标：play 在遇到未实现的 play 接口时需吞掉异常并保持引用，以便 stop 能够复位。
 * 前置条件：play 返回被拒绝的 Promise，错误信息包含 "Not implemented"。
 * 步骤：直接调用 play。
 * 断言：
 *  - Promise 被解析而非拒绝；
 *  - current 指针指向该 audio。
 * 边界/异常：覆盖 Promise 拒绝路径。
 */
test(
  "GivenNotImplementedPlay_WhenPlay_ShouldResolveAndTrackCurrent",
  async () => {
    const manager = new AudioManager();
    const audio = {
      play: jest.fn(() =>
        Promise.reject(
          new Error("Not implemented: HTMLMediaElement.prototype.play"),
        ),
      ),
    };

    await expect(manager.play(audio)).resolves.toBeUndefined();
    expect(manager.current).toBe(audio);
  },
);
