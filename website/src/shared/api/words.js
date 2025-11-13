import { API_PATHS, DEFAULT_MODEL } from "@core/config";
import { apiRequest } from "./client.js";
import { useApi } from "@shared/hooks/useApi.js";
import { createCachedFetcher } from "@shared/utils";
import { WORD_FLAVOR_BILINGUAL } from "@shared/utils/language.js";
import { useWordStore } from "@core/store/wordStore.js";
// 直接引用数据治理 store，避免 utils/store 桶状导出间的循环依赖在 SSR 或打包阶段触发。
import { useDataGovernanceStore } from "@core/store/dataGovernanceStore.ts";

const defaultWordDeps = {
  request: apiRequest,
  store: useWordStore,
  governanceStore: useDataGovernanceStore,
};

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

const getCachedWord = (store, key) => store.getState().getEntry(key);

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

const buildWordRequestContext = (
  options,
  resolveCaptureHistory,
) => {
  const {
    userId,
    term,
    language,
    model = DEFAULT_MODEL,
    flavor = WORD_FLAVOR_BILINGUAL,
    forceNew = false,
    versionId,
    captureHistory,
  } = options ?? {};
  const resolvedFlavor = flavor ?? WORD_FLAVOR_BILINGUAL;
  const shouldCaptureHistory =
    captureHistory ?? resolveCaptureHistory();
  const key = resolveKey({
    term,
    language,
    flavor: resolvedFlavor,
    model,
  });
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
  return { key, params, forceNew };
};

const createWordFetcher = ({ request, store, governanceStore }) => {
  const persistWordRecord = createWordRecordPersister(store);
  const resolveCaptureHistory = createCaptureHistoryResolver(governanceStore);

  return async (options = {}) => {
    const { key, params, forceNew } = buildWordRequestContext(
      options,
      resolveCaptureHistory,
    );
    if (!forceNew) {
      const cached = getCachedWord(store, key);
      if (cached) return cached;
    }
    const result = await request(`${API_PATHS.words}?${params.toString()}`, {
      token: options.token,
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

export function createFetchWord(overrides = {}) {
  const deps = { ...defaultWordDeps, ...overrides };
  const fetchWordImpl = createWordFetcher(deps);
  const fetchWordCached = createCachedFetcher(fetchWordImpl, resolveKey);
  return (options = {}) =>
    options?.forceNew ? fetchWordImpl(options) : fetchWordCached(options);
}

export function createFetchWordAudio(overrides = {}) {
  const { request } = { ...defaultWordDeps, ...overrides };
  return createCachedFetcher(
    createWordAudioFetcher(request),
    ({ term, language }) => `${language}:${term}`,
  );
}

export const fetchWord = createFetchWord();
export const fetchWordAudio = createFetchWordAudio();

export function useWordsApi() {
  return useApi().words;
}
