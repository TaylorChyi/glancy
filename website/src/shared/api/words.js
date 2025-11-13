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
const resolveKey = ({
  term,
  language,
  flavor = WORD_FLAVOR_BILINGUAL,
  model = DEFAULT_MODEL,
}) => wordCacheKey({ term, language, flavor, model });

const collectResponseVersions = (response) => {
  if (Array.isArray(response?.versions)) {
    return response.versions;
  }
  if (response?.version) {
    return [response.version];
  }
  if (Array.isArray(response?.entries)) {
    return response.entries;
  }
  return [response];
};

const resolveActiveVersionId = (response, versions) =>
  response?.activeVersionId ??
  response?.version?.id ??
  response?.version?.versionId ??
  versions[versions.length - 1]?.id ??
  versions[versions.length - 1]?.versionId;

const normalizeVersionFlavors = (versions, resolvedFlavor) =>
  versions.map((version) =>
    version && typeof version === "object"
      ? { ...version, flavor: version.flavor ?? resolvedFlavor }
      : version,
  );

const createWordRecordPersister = (store) => (key, response) => {
  if (!response) return undefined;
  const versions = collectResponseVersions(response);
  const activeVersionId = resolveActiveVersionId(response, versions);
  const metadata = {
    ...(response.metadata ?? {}),
    ...(response.flavor ? { flavor: response.flavor } : {}),
  };
  const resolvedFlavor = metadata.flavor ?? WORD_FLAVOR_BILINGUAL;
  const versionsWithFlavor = normalizeVersionFlavors(
    versions,
    resolvedFlavor,
  );
  store.getState().setVersions(key, versionsWithFlavor, {
    activeVersionId,
    metadata,
  });
  return store.getState().getEntry(key, activeVersionId);
};

const createCaptureHistoryResolver = (governanceStore) => () =>
  Boolean(governanceStore.getState().historyCaptureEnabled);

const buildWordQueryParams = ({
  userId,
  term,
  language,
  flavor,
  model,
  forceNew,
  versionId,
  captureHistory,
}) => {
  const params = new URLSearchParams({ userId, term, language });
  if (flavor) params.append("flavor", flavor);
  if (model) params.append("model", model);
  if (forceNew) params.append("forceNew", "true");
  if (versionId) params.append("versionId", versionId);
  params.append("captureHistory", captureHistory ? "true" : "false");
  return params;
};

const createWordFetcher = ({ request, store, governanceStore }) => {
  const persistWordRecord = createWordRecordPersister(store);
  const resolveCaptureHistory = createCaptureHistoryResolver(governanceStore);

  return async ({
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
    const key = resolveKey({
      term,
      language,
      flavor: resolvedFlavor,
      model,
    });
    if (!forceNew) {
      const cached = store.getState().getEntry(key);
      if (cached) return cached;
    }
    const params = buildWordQueryParams({
      userId,
      term,
      language,
      flavor: resolvedFlavor,
      model,
      forceNew,
      versionId,
      captureHistory: shouldCaptureHistory,
    });
    const result = await request(`${API_PATHS.words}?${params.toString()}`, {
      token,
    });
    return persistWordRecord(key, result);
  };
};

const createWordAudioFetcher = (request) => async ({
  userId,
  term,
  language,
}) => {
  const params = new URLSearchParams({ userId, term, language });
  const resp = await request(`${API_PATHS.words}/audio?${params.toString()}`);
  return resp.blob();
};

export function createWordsApi(request = apiRequest) {
  const store = useWordStore;
  const governanceStore = useDataGovernanceStore;
  const fetchWordImpl = createWordFetcher({ request, store, governanceStore });
  const fetchWordCached = createCachedFetcher(fetchWordImpl, resolveKey);

  const fetchWord = async (options) =>
    options?.forceNew ? fetchWordImpl(options) : fetchWordCached(options);

  const fetchWordAudio = createCachedFetcher(
    createWordAudioFetcher(request),
    ({ term, language }) => `${language}:${term}`,
  );

  return { fetchWord, fetchWordAudio };
}

export const { fetchWord, fetchWordAudio } = createWordsApi();

export function useWordsApi() {
  return useApi().words;
}
