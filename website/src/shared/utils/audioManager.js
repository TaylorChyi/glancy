/**
 * 背景：
 *  - 过往实现直接调用 HTMLMediaElement 的原生方法，在 JSDOM 等测试环境会因 "Not implemented"
 *    异常导致用例失败，且播放状态无法正确复位。
 * 目的：
 *  - 通过集中化的音频管理器串行化播放，同时为缺失多媒体实现的环境提供安全降级。
 * 关键决策与取舍：
 *  - 采用适配器式的封装：所有媒体调用都经由 safe 操作过滤 “Not implemented” 异常，避免在各处
 *    测试用例手动桩函数；
 *  - 保持同步 API 语义不变（play 仍返回 Promise），确保现有调用方无需调整。
 * 影响范围：
 *  - useTtsPlayer 与其他依赖 audioManager 的 Hook/组件；相关测试将不再因 jsdom 限制抛错。
 * 演进与TODO：
 *  - 后续可在此扩展淡入淡出或全局音量策略，或引入多实例支持以适配并发播放场景。
 */

const NOT_IMPLEMENTED_TOKEN = "Not implemented";
const IMPL_SYMBOL_DESCRIPTION = "Symbol(impl)";

const isMediaNotImplementedError = (error) =>
  Boolean(
    error &&
      typeof error.message === "string" &&
      error.message.includes(NOT_IMPLEMENTED_TOKEN),
  );

const buildNotImplementedSourceToken = (method) =>
  `notImplemented("HTMLMediaElement.prototype.${method}`;

const getMediaImplementation = (audio) => {
  if (!audio || typeof Object.getOwnPropertySymbols !== "function") {
    return null;
  }
  const implSymbol = Object.getOwnPropertySymbols(audio).find(
    (symbol) => symbol.toString() === IMPL_SYMBOL_DESCRIPTION,
  );
  if (!implSymbol) {
    return null;
  }
  return audio[implSymbol] ?? null;
};

const shouldSkipMediaMethod = (audio, method) => {
  const implementation = getMediaImplementation(audio);
  if (!implementation || typeof implementation[method] !== "function") {
    return false;
  }
  try {
    const source = Function.prototype.toString.call(
      implementation[method],
    );
    return source.includes(buildNotImplementedSourceToken(method));
  } catch (error) {
    console.debug?.(
      "[audioManager] failed to introspect media implementation",
      error,
    );
    return false;
  }
};

function safelyPauseMedia(audio) {
  if (!audio || typeof audio.pause !== "function") {
    return;
  }
  if (shouldSkipMediaMethod(audio, "pause")) {
    return;
  }
  try {
    audio.pause();
  } catch (error) {
    if (!isMediaNotImplementedError(error)) {
      throw error;
    }
  }
}

function safelyPlayMedia(audio) {
  if (!audio || typeof audio.play !== "function") {
    return Promise.resolve(undefined);
  }
  if (shouldSkipMediaMethod(audio, "play")) {
    return Promise.resolve(undefined);
  }
  try {
    const result = audio.play();
    if (result && typeof result.then === "function") {
      return result.catch((error) => {
        if (isMediaNotImplementedError(error)) {
          return undefined;
        }
        throw error;
      });
    }
    return Promise.resolve(result);
  } catch (error) {
    if (isMediaNotImplementedError(error)) {
      return Promise.resolve(undefined);
    }
    return Promise.reject(error);
  }
}

/**
 * 意图：保证同一时刻仅有一个 <audio> 元素播放，同时在测试环境优雅处理未实现的媒体接口。
 * 输入：HTMLAudioElement 或具备兼容接口的对象。
 * 输出：提供 play/stop 两个原子操作。
 */
export class AudioManager {
  constructor() {
    this.current = null;
  }

  async play(audio) {
    if (this.current && this.current !== audio) {
      safelyPauseMedia(this.current);
    }
    this.current = audio;
    return safelyPlayMedia(audio);
  }

  stop(audio) {
    if (!audio) {
      return;
    }
    safelyPauseMedia(audio);
    if (typeof audio.src === "string") {
      audio.src = "";
    }
    if (this.current === audio) {
      this.current = null;
    }
  }
}

export const audioManager = new AudioManager();
