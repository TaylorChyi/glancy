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

const wordAudioCacheKey = ({ term, language }) => `${language}:${term}`;

const resolveWordDeps = (overrides = {}) => ({
  ...defaultWordDeps,
  ...overrides,
});

const ensureFlavor = (flavor) => flavor ?? WORD_FLAVOR_BILINGUAL;

const resolveWordCacheKeyFromOptions = (options = {}) =>
  wordCacheKey({
    term: options.term,
    language: options.language,
    flavor: options.flavor,
    model: options.model,
  });

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

const buildWordMetadata = (response) => ({
  ...(response?.metadata ?? {}),
  ...(response?.flavor ? { flavor: response.flavor } : {}),
});

const createWordRecordPersister = (store) => (key, response) => {
  if (!response) return undefined;
  const versions = collectResponseVersions(response);
  const metadata = buildWordMetadata(response);
  const resolvedFlavor = metadata.flavor ?? WORD_FLAVOR_BILINGUAL;
  const versionsWithFlavor = normalizeVersionFlavors(
    versions,
    resolvedFlavor,
  );
  const activeVersionId = resolveActiveVersionId(response, versions);
  store.getState().setVersions(key, versionsWithFlavor, {
    activeVersionId,
    metadata,
  });
  return store.getState().getEntry(key, activeVersionId);
};

const createWordCache = (store) => ({
  get: (key) => getCachedWord(store, key),
  persist: createWordRecordPersister(store),
});

const createCaptureHistoryResolver = (governanceStore) => () =>
  Boolean(governanceStore.getState().historyCaptureEnabled);

const resolveCaptureHistoryPreference = (captureHistory, resolver) =>
  captureHistory ?? resolver();

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

const buildWordRequestUrl = (params) => `${API_PATHS.words}?${params.toString()}`;

const shouldUseCache = (forceNew) => !forceNew;

const createWordRequestBuilder =
  (resolveCaptureHistory) =>
  (options = {}) => {
    const {
      userId,
      term,
      language,
      model = DEFAULT_MODEL,
      flavor,
      forceNew = false,
      versionId,
      captureHistory,
      token,
    } = options;

    const resolvedFlavor = ensureFlavor(flavor);
    const key = wordCacheKey({
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
      captureHistory: resolveCaptureHistoryPreference(
        captureHistory,
        resolveCaptureHistory,
      ),
    });

    return {
      key,
      url: buildWordRequestUrl(params),
      token,
      shouldUseCache: shouldUseCache(forceNew),
    };
  };

const shouldReturnCachedWord = ({ shouldUseCache, cachedWord }) =>
  shouldUseCache && Boolean(cachedWord);

const createWordRequestExecutor =
  (request) =>
  async ({ url, token }) =>
    request(url, { token });

const createWordFetcher = ({ request, store, governanceStore }) => {
  const cache = createWordCache(store);
  const buildRequest = createWordRequestBuilder(
    createCaptureHistoryResolver(governanceStore),
  );
  const execute = createWordRequestExecutor(request);

  return async (options = {}) => {
    const requestContext = buildRequest(options);
    const cachedWord = cache.get(requestContext.key);

    if (
      shouldReturnCachedWord({
        shouldUseCache: requestContext.shouldUseCache,
        cachedWord,
      })
    ) {
      return cachedWord;
    }

    const response = await execute(requestContext);
    return cache.persist(requestContext.key, response);
  };
};

const shouldBypassInFlightCache = (options = {}) => Boolean(options.forceNew);

const createWordFetchEntryPoint = (fetchWordImpl) => {
  const cachedFetcher = createCachedFetcher(
    fetchWordImpl,
    resolveWordCacheKeyFromOptions,
  );
  return (options = {}) =>
    shouldBypassInFlightCache(options)
      ? fetchWordImpl(options)
      : cachedFetcher(options);
};

const buildWordAudioParams = ({ userId, term, language }) =>
  new URLSearchParams({ userId, term, language });

const buildWordAudioUrl = (params) =>
  `${API_PATHS.words}/audio?${params.toString()}`;

const createWordAudioFetcher = (request) => async (options = {}) => {
  const params = buildWordAudioParams(options);
  const response = await request(buildWordAudioUrl(params));
  return response.blob();
};

export function createFetchWord(overrides = {}) {
  const fetchWordImpl = createWordFetcher(resolveWordDeps(overrides));
  return createWordFetchEntryPoint(fetchWordImpl);
}

export function createFetchWordAudio(overrides = {}) {
  const { request } = resolveWordDeps(overrides);
  return createCachedFetcher(createWordAudioFetcher(request), wordAudioCacheKey);
}

export const fetchWord = createFetchWord();
export const fetchWordAudio = createFetchWordAudio();

export function useWordsApi() {
  return useApi().words;
}
