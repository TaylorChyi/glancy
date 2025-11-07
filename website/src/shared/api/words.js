import { API_PATHS, DEFAULT_MODEL } from "@core/config";
import { apiRequest } from "./client.js";
import { useApi } from "@shared/hooks/useApi.js";
import { createCachedFetcher } from "@shared/utils";
import { WORD_FLAVOR_BILINGUAL } from "@shared/utils/language.js";
import { useWordStore } from "@core/store/wordStore.js";
// 直接引用数据治理 store，避免 utils/store 桶状导出间的循环依赖在 SSR 或打包阶段触发。
import { useDataGovernanceStore } from "@core/store/dataGovernanceStore.ts";

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
   * 意图：统一读取历史采集偏好，确保所有词典请求遵循相同的治理策略。\
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
    forceNew = false,
    versionId,
    captureHistory,
  }) => {
    const resolvedFlavor = flavor ?? WORD_FLAVOR_BILINGUAL;
    const shouldCaptureHistory =
      captureHistory ?? resolveCaptureHistory();
    const key = resolveKey({ term, language, flavor: resolvedFlavor, model });
    if (!forceNew) {
      const cached = store.getState().getEntry(key);
      if (cached) return cached;
    }
    const params = new URLSearchParams({ userId, term, language });
    if (resolvedFlavor) params.append("flavor", resolvedFlavor);
    if (model) params.append("model", model);
    if (forceNew) params.append("forceNew", "true");
    if (versionId) params.append("versionId", versionId);
    params.append("captureHistory", shouldCaptureHistory ? "true" : "false");
    const result = await request(`${API_PATHS.words}?${params.toString()}`, {
      token,
    });
    return persistWordRecord(key, result);
  };

  const fetchWordCached = createCachedFetcher(fetchWordImpl, resolveKey);

  const fetchWord = async (options) => {
    if (options?.forceNew) {
      return fetchWordImpl(options);
    }
    return fetchWordCached(options);
  };

  const fetchWordAudioImpl = async ({ userId, term, language }) => {
    const params = new URLSearchParams({ userId, term, language });
    const resp = await request(`${API_PATHS.words}/audio?${params.toString()}`);
    return resp.blob();
  };

  const fetchWordAudio = createCachedFetcher(
    fetchWordAudioImpl,
    ({ term, language }) => `${language}:${term}`,
  );

  return { fetchWord, fetchWordAudio };
}

export const { fetchWord, fetchWordAudio } = createWordsApi();

export function useWordsApi() {
  return useApi().words;
}
