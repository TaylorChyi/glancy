import { createPersistentStore } from "../createPersistentStore.js";
import { pickState } from "../persistUtils.js";
import {
  SYSTEM_LANGUAGE_AUTO,
  getSupportedLanguageCodes,
  isSupportedLanguage,
} from "@/i18n/languages.js";
import {
  WORD_LANGUAGE_AUTO,
  WORD_LANGUAGE_ENGLISH_MONO,
  normalizeWordLanguage,
  normalizeWordSourceLanguage,
  normalizeWordTargetLanguage,
  WORD_DEFAULT_TARGET_LANGUAGE,
} from "@/utils/language.js";

const LEGACY_LANGUAGE_STORAGE_KEY = "lang";
const SETTINGS_STORAGE_KEY = "settings";
const DEFAULT_LANGUAGE_FALLBACK = "zh";

type SystemLanguage = typeof SYSTEM_LANGUAGE_AUTO | string;

type DictionarySourceLanguage =
  | typeof WORD_LANGUAGE_AUTO
  | "CHINESE"
  | "ENGLISH";

type DictionaryTargetLanguage = "CHINESE" | "ENGLISH";

const MARKDOWN_RENDERING_MODE_DYNAMIC = "dynamic" as const;
const MARKDOWN_RENDERING_MODE_PLAIN = "plain" as const;

const CHAT_COMPLETION_MODE_STREAMING = "stream" as const;
const CHAT_COMPLETION_MODE_SYNC = "sync" as const;

const MARKDOWN_RENDERING_MODES = Object.freeze([
  MARKDOWN_RENDERING_MODE_DYNAMIC,
  MARKDOWN_RENDERING_MODE_PLAIN,
] as const);

const CHAT_COMPLETION_MODES = Object.freeze([
  CHAT_COMPLETION_MODE_STREAMING,
  CHAT_COMPLETION_MODE_SYNC,
] as const);

type MarkdownRenderingMode = (typeof MARKDOWN_RENDERING_MODES)[number];
type ChatCompletionMode = (typeof CHAT_COMPLETION_MODES)[number];

type SettingsState = {
  systemLanguage: SystemLanguage;
  setSystemLanguage: (language: SystemLanguage) => void;
  dictionarySourceLanguage: DictionarySourceLanguage;
  setDictionarySourceLanguage: (language: DictionarySourceLanguage) => void;
  dictionaryTargetLanguage: DictionaryTargetLanguage;
  setDictionaryTargetLanguage: (language: DictionaryTargetLanguage) => void;
  markdownRenderingMode: MarkdownRenderingMode;
  setMarkdownRenderingMode: (mode: MarkdownRenderingMode) => void;
  chatCompletionMode: ChatCompletionMode;
  setChatCompletionMode: (mode: ChatCompletionMode) => void;
  /**
   * @deprecated 请改用 setDictionarySourceLanguage / setDictionaryTargetLanguage
   */
  setDictionaryLanguage: (language: DictionaryLegacyLanguage) => void;
};

type DictionaryLegacyLanguage =
  | typeof WORD_LANGUAGE_AUTO
  | "CHINESE"
  | "ENGLISH"
  | typeof WORD_LANGUAGE_ENGLISH_MONO;

function sanitizeLanguage(candidate: SystemLanguage): SystemLanguage {
  if (candidate === SYSTEM_LANGUAGE_AUTO) {
    return SYSTEM_LANGUAGE_AUTO;
  }
  if (isSupportedLanguage(candidate)) {
    return candidate;
  }
  return DEFAULT_LANGUAGE_FALLBACK;
}

function detectInitialLanguage(): SystemLanguage {
  const persisted = localStorage.getItem(SETTINGS_STORAGE_KEY);
  if (persisted) {
    try {
      const data = JSON.parse(persisted);
      const candidate = data?.state?.systemLanguage;
      if (candidate && isSupportedLanguage(candidate)) {
        return candidate;
      }
    } catch (error) {
      console.warn("[settings] failed to parse persisted state", error);
    }
  }
  const legacy = localStorage.getItem(LEGACY_LANGUAGE_STORAGE_KEY);
  if (legacy && isSupportedLanguage(legacy)) {
    return legacy;
  }
  return SYSTEM_LANGUAGE_AUTO;
}

function persistLegacyLanguage(language: SystemLanguage) {
  if (language === SYSTEM_LANGUAGE_AUTO) {
    localStorage.removeItem(LEGACY_LANGUAGE_STORAGE_KEY);
    return;
  }
  if (isSupportedLanguage(language)) {
    localStorage.setItem(LEGACY_LANGUAGE_STORAGE_KEY, language);
  }
}

/**
 * 意图：规范化 Markdown 渲染模式，保证状态机仅暴露有限集合。
 * 输入：候选模式字符串（可能来源于持久化或外部注入）。
 * 输出：枚举内合法值，无法识别时回退到动态渲染。
 * 流程：
 *  1) 判断候选值是否为字符串。
 *  2) 匹配是否在允许集合中。
 *  3) 默认回退至 dynamic。
 * 错误处理：不抛异常，统一回退到 dynamic。
 * 复杂度：O(1)，集合长度常量级。
 */
function normalizeMarkdownRenderingMode(
  candidate: unknown,
): MarkdownRenderingMode {
  if (typeof candidate === "string") {
    const normalized = candidate.toLowerCase();
    if (MARKDOWN_RENDERING_MODES.includes(normalized as MarkdownRenderingMode)) {
      return normalized as MarkdownRenderingMode;
    }
  }
  return MARKDOWN_RENDERING_MODE_DYNAMIC;
}

/**
 * 意图：规范化聊天输出模式，确保仅暴露流式或同步两种选项。
 * 输入：候选模式字符串，可来源于持久化或外部注入。
 * 输出：合法模式值，未知输入回退到流式模式。
 * 流程：
 *  1) 判断输入是否为字符串。
 *  2) 统一转为小写并校验是否属于受支持集合。
 *  3) 失败时返回流式作为默认体验。
 * 错误处理：不抛异常，统一回退流式模式。
 * 复杂度：O(1)。
 */
function normalizeChatCompletionMode(candidate: unknown): ChatCompletionMode {
  if (typeof candidate === "string") {
    const normalized = candidate.toLowerCase();
    if (CHAT_COMPLETION_MODES.includes(normalized as ChatCompletionMode)) {
      return normalized as ChatCompletionMode;
    }
  }
  return CHAT_COMPLETION_MODE_STREAMING;
}

export const useSettingsStore = createPersistentStore<SettingsState>({
  key: SETTINGS_STORAGE_KEY,
  initializer: (set, get) => ({
    systemLanguage: detectInitialLanguage(),
    dictionarySourceLanguage: WORD_LANGUAGE_AUTO,
    dictionaryTargetLanguage: WORD_DEFAULT_TARGET_LANGUAGE,
    markdownRenderingMode: MARKDOWN_RENDERING_MODE_DYNAMIC,
    chatCompletionMode: CHAT_COMPLETION_MODE_STREAMING,
    setSystemLanguage: (language: SystemLanguage) => {
      const normalized = sanitizeLanguage(language);
      const current = get().systemLanguage;
      if (current === normalized) {
        persistLegacyLanguage(normalized);
        return;
      }
      set({ systemLanguage: normalized });
      persistLegacyLanguage(normalized);
    },
    setDictionarySourceLanguage: (language: DictionarySourceLanguage) => {
      const normalized = normalizeWordSourceLanguage(language);
      set((state) => {
        if (state.dictionarySourceLanguage === normalized) {
          return {};
        }
        return { dictionarySourceLanguage: normalized };
      });
    },
    setDictionaryTargetLanguage: (language: DictionaryTargetLanguage) => {
      const normalized = normalizeWordTargetLanguage(language);
      set((state) => {
        if (state.dictionaryTargetLanguage === normalized) {
          return {};
        }
        return { dictionaryTargetLanguage: normalized };
      });
    },
    setMarkdownRenderingMode: (mode: MarkdownRenderingMode) => {
      const normalized = normalizeMarkdownRenderingMode(mode);
      set((state) => {
        if (state.markdownRenderingMode === normalized) {
          return {};
        }
        return { markdownRenderingMode: normalized };
      });
    },
    setChatCompletionMode: (mode: ChatCompletionMode) => {
      const normalized = normalizeChatCompletionMode(mode);
      set((state) => {
        if (state.chatCompletionMode === normalized) {
          return {};
        }
        return { chatCompletionMode: normalized };
      });
    },
    setDictionaryLanguage: (language: DictionaryLegacyLanguage) => {
      const normalized = normalizeWordLanguage(language);
      set(() => {
        switch (normalized) {
          case "CHINESE":
            return {
              dictionarySourceLanguage: "CHINESE",
              dictionaryTargetLanguage: "ENGLISH",
            };
          case "ENGLISH":
            return {
              dictionarySourceLanguage: "ENGLISH",
              dictionaryTargetLanguage: WORD_DEFAULT_TARGET_LANGUAGE,
            };
          case WORD_LANGUAGE_ENGLISH_MONO:
            return {
              dictionarySourceLanguage: "ENGLISH",
              dictionaryTargetLanguage: "ENGLISH",
            };
          case WORD_LANGUAGE_AUTO:
          default:
            return {
              dictionarySourceLanguage: WORD_LANGUAGE_AUTO,
              dictionaryTargetLanguage: WORD_DEFAULT_TARGET_LANGUAGE,
            };
        }
      });
    },
  }),
  persistOptions: {
    partialize: pickState([
      "systemLanguage",
      "dictionarySourceLanguage",
      "dictionaryTargetLanguage",
      "markdownRenderingMode",
      "chatCompletionMode",
    ]),
    onRehydrateStorage: () => (state) => {
      if (state) {
        let persistedState: { state?: Record<string, unknown> } | null = null;
        try {
          const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
          persistedState = raw ? JSON.parse(raw) : null;
        } catch (error) {
          console.warn("[settings] failed to parse persisted state", error);
        }
        const hasPersistedSource = Boolean(
          persistedState?.state?.dictionarySourceLanguage,
        );
        const hasPersistedTarget = Boolean(
          persistedState?.state?.dictionaryTargetLanguage,
        );
        persistLegacyLanguage(state.systemLanguage);
        const legacyLanguage =
          "dictionaryLanguage" in state
            ? normalizeWordLanguage(
                (state as unknown as { dictionaryLanguage?: string })
                  .dictionaryLanguage,
              )
            : undefined;
        const persistedSource = normalizeWordSourceLanguage(
          (state as unknown as { dictionarySourceLanguage?: string })
            .dictionarySourceLanguage,
        );
        const persistedTarget = normalizeWordTargetLanguage(
          (state as unknown as { dictionaryTargetLanguage?: string })
            .dictionaryTargetLanguage,
        );
        state.markdownRenderingMode = normalizeMarkdownRenderingMode(
          (state as unknown as { markdownRenderingMode?: string })
            .markdownRenderingMode,
        );
        state.chatCompletionMode = normalizeChatCompletionMode(
          (state as unknown as { chatCompletionMode?: string }).chatCompletionMode,
        );

        if (legacyLanguage && !hasPersistedSource && !hasPersistedTarget) {
          switch (legacyLanguage) {
            case "CHINESE":
              state.dictionarySourceLanguage = "CHINESE";
              state.dictionaryTargetLanguage = "ENGLISH";
              break;
            case "ENGLISH":
              state.dictionarySourceLanguage = "ENGLISH";
              state.dictionaryTargetLanguage = WORD_DEFAULT_TARGET_LANGUAGE;
              break;
            case WORD_LANGUAGE_ENGLISH_MONO:
              state.dictionarySourceLanguage = "ENGLISH";
              state.dictionaryTargetLanguage = "ENGLISH";
              break;
            default:
              state.dictionarySourceLanguage = WORD_LANGUAGE_AUTO;
              state.dictionaryTargetLanguage = WORD_DEFAULT_TARGET_LANGUAGE;
              break;
          }
        } else {
          state.dictionarySourceLanguage = persistedSource;
          state.dictionaryTargetLanguage = persistedTarget;
        }
      }
    },
  },
});

export const SUPPORTED_SYSTEM_LANGUAGES = getSupportedLanguageCodes();
export {
  MARKDOWN_RENDERING_MODE_DYNAMIC,
  MARKDOWN_RENDERING_MODE_PLAIN,
  MARKDOWN_RENDERING_MODES,
  CHAT_COMPLETION_MODE_STREAMING,
  CHAT_COMPLETION_MODE_SYNC,
  CHAT_COMPLETION_MODES,
};
