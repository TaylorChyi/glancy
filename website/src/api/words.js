import { API_PATHS, DEFAULT_MODEL } from "@/config";
import { apiRequest } from "./client.js";
import { useApi } from "@/hooks/useApi.js";
import { createCachedFetcher, parseSse } from "@/utils";
import { extractTextFromDelta } from "./streamingContent.js";
import { WORD_FLAVOR_BILINGUAL } from "@/utils/language.js";
import { useWordStore } from "@/store/wordStore.js";
// 直接引用数据治理 store，避免 utils/store 桶状导出间的循环依赖在 SSR 或打包阶段触发。
import { useDataGovernanceStore } from "@/store/dataGovernanceStore.ts";

export const WORD_CACHE_VERSION = "md1";

export const wordCacheKey = ({
  term,
  language,
  flavor = WORD_FLAVOR_BILINGUAL,
  model = DEFAULT_MODEL,
}) => `${language}:${flavor}:${term}:${model ?? ""}:${WORD_CACHE_VERSION}`;

/**
 * Query a word definition
 * @param {Object} opts
 * @param {string} opts.userId user identifier
 * @param {string} opts.term word to search
 * @param {string} opts.language CHINESE or ENGLISH
 * @param {string} [opts.flavor] dictionary flavor variant
 * @param {string} [opts.token] user token for auth header
 */
export function createWordsApi(request = apiRequest) {
  const store = useWordStore;
  const governanceStore = useDataGovernanceStore;

  /**
   * 意图：统一读取历史采集偏好，确保同步/流式接口共享同一策略。\
   * 输出：布尔值，指示是否允许记录查询历史。\
   * 复杂度：O(1)，直接访问 Zustand store。\
   */
  const resolveCaptureHistory = () =>
    Boolean(governanceStore.getState().historyCaptureEnabled);

  const resolveKey = ({
    term,
    language,
    flavor = WORD_FLAVOR_BILINGUAL,
    model = DEFAULT_MODEL,
  }) => wordCacheKey({ term, language, flavor, model });

  const persistWordRecord = (key, response) => {
    if (!response) return undefined;
    const versions = Array.isArray(response.versions)
      ? response.versions
      : response.version
        ? [response.version]
        : Array.isArray(response.entries)
          ? response.entries
          : [response];
    const activeVersionId =
      response.activeVersionId ??
      response.version?.id ??
      response.version?.versionId ??
      versions[versions.length - 1]?.id ??
      versions[versions.length - 1]?.versionId;
    const metadata = {
      ...(response.metadata ?? {}),
      ...(response.flavor ? { flavor: response.flavor } : {}),
    };
    const resolvedFlavor = metadata.flavor ?? WORD_FLAVOR_BILINGUAL;
    const versionsWithFlavor = versions.map((version) =>
      version && typeof version === "object"
        ? { ...version, flavor: version.flavor ?? resolvedFlavor }
        : version,
    );
    store.getState().setVersions(key, versionsWithFlavor, {
      activeVersionId,
      metadata,
    });
    return store.getState().getEntry(key, activeVersionId);
  };

  const fetchWordImpl = async ({
    userId,
    term,
    language,
    model = DEFAULT_MODEL,
    flavor = WORD_FLAVOR_BILINGUAL,
    token,
  }) => {
    const resolvedFlavor = flavor ?? WORD_FLAVOR_BILINGUAL;
    const captureHistory = resolveCaptureHistory();
    const key = resolveKey({ term, language, flavor: resolvedFlavor, model });
    const cached = store.getState().getEntry(key);
    if (cached) return cached;
    const params = new URLSearchParams({ userId, term, language });
    if (resolvedFlavor) params.append("flavor", resolvedFlavor);
    if (model) params.append("model", model);
    params.append("captureHistory", captureHistory ? "true" : "false");
    const result = await request(`${API_PATHS.words}?${params.toString()}`, {
      token,
    });
    return persistWordRecord(key, result);
  };

  const fetchWord = createCachedFetcher(fetchWordImpl, resolveKey);

  const fetchWordAudioImpl = async ({ userId, term, language }) => {
    const params = new URLSearchParams({ userId, term, language });
    const resp = await request(`${API_PATHS.words}/audio?${params.toString()}`);
    return resp.blob();
  };

  const fetchWordAudio = createCachedFetcher(
    fetchWordAudioImpl,
    ({ term, language }) => `${language}:${term}`,
  );

  /**
   * 意图：按照 Doubao 输出结构提取增量文本，保持前端流式渲染与后端数据透传一致。
   * 输入：模型返回的原始 data 字段，可为字符串或其他类型。
   * 输出：字符串形式的文本片段；解析失败时回退原始字符串。
   * 复杂度：O(n)，n 为字段总长度。
   */
  const extractDoubaoChunk = (payload) => {
    if (typeof payload !== "string" || payload.length === 0) {
      return typeof payload === "string" ? payload : "";
    }

    // 说明：当返回体不符合 JSON 结构时，保持与历史实现一致直接透传，
    // 例如缓存命中场景下直接返回的词条 JSON 文本。
    if (payload.trimStart()[0] !== "{") {
      return payload;
    }

    let parsed;
    try {
      parsed = JSON.parse(payload);
    } catch {
      // 解析失败保留原始串，交由上层以 Markdown 回退方案渲染，避免误删信息。
      return payload;
    }

    const choices = Array.isArray(parsed?.choices) ? parsed.choices : [];
    if (choices.length === 0) {
      return payload;
    }

    let aggregated = "";
    for (const choice of choices) {
      if (!choice || typeof choice !== "object") continue;
      const deltaText = extractTextFromDelta(choice.delta ?? {});
      if (deltaText) {
        aggregated += deltaText;
      }
    }

    // 若增量内容为空，则跳过该片段，以免把协议载荷渲染到前端。
    return aggregated;
  };

  /**
   * 流式获取词汇释义并输出统一格式日志。
   * 日志格式:
   *   console.info("[streamWord] <阶段>", { userId, term, chunk?, error? })
   */
  async function* streamWord({
    userId,
    term,
    language,
    model = DEFAULT_MODEL,
    flavor = WORD_FLAVOR_BILINGUAL,
    token,
    signal,
    onChunk,
    forceNew = false,
    versionId,
    captureHistory,
  }) {
    const resolvedFlavor = flavor ?? WORD_FLAVOR_BILINGUAL;
    const shouldCaptureHistory = captureHistory ?? resolveCaptureHistory();
    const params = new URLSearchParams({ userId, term, language });
    if (resolvedFlavor) params.append("flavor", resolvedFlavor);
    if (model) params.append("model", model);
    if (forceNew) params.append("forceNew", "true");
    if (versionId) params.append("versionId", versionId);
    params.append("captureHistory", shouldCaptureHistory ? "true" : "false");
    const url = `${API_PATHS.words}/stream?${params.toString()}`;
    const headers = {
      Accept: "text/event-stream",
      ...(token ? { "X-USER-TOKEN": token } : {}),
    };
    const logCtx = { userId, term };
    let response;
    try {
      response = await fetch(url, {
        headers,
        cache: "no-store",
        signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
    } catch (err) {
      console.info("[streamWord] error", { ...logCtx, error: err });
      throw err;
    }
    console.info("[streamWord] start", logCtx);
    try {
      for await (const { event, data } of parseSse(response.body)) {
        if (event === "error") {
          console.info("[streamWord] error", { ...logCtx, error: data });
          throw new Error(data);
        }
        if (data === "[DONE]") break;
        if (event === "metadata") {
          console.info("[streamWord] metadata", { ...logCtx, data });
          yield { type: "metadata", data };
          continue;
        }
        if (event === "end") {
          continue;
        }
        if (data) {
          const chunk = extractDoubaoChunk(data);
          if (chunk === "") continue;
          console.info("[streamWord] chunk", { ...logCtx, chunk });
          if (onChunk) onChunk(chunk);
          yield { type: "chunk", data: chunk };
        }
      }
      console.info("[streamWord] end", logCtx);
    } catch (err) {
      console.info("[streamWord] error", { ...logCtx, error: err });
      throw err;
    }
  }

  return { fetchWord, fetchWordAudio, streamWord };
}

export const { fetchWord, fetchWordAudio, streamWord } = createWordsApi();

export function useWordsApi() {
  return useApi().words;
}
