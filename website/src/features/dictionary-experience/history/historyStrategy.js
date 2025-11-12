const DEFAULT_PAGE_SIZE = 20;

const dedupeHistoryItems = (items = []) => {
  const seen = new Set();
  return items.filter((item) => {
    if (!item || typeof item !== "object") return false;
    const key = item.termKey ?? item.term ?? "";
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const mergeHistoryPage = (current = [], incoming = []) => {
  const combined = [...incoming, ...current];
  return dedupeHistoryItems(combined);
};

const paginateHistory = (items = [], pageSize = DEFAULT_PAGE_SIZE) => {
  if (pageSize <= 0) return [];
  const pages = [];
  for (let index = 0; index < items.length; index += pageSize) {
    pages.push(items.slice(index, index + pageSize));
  }
  return pages;
};

const resolveHistoryCandidate = (items, identifier) => {
  if (!identifier) return null;
  if (typeof identifier === "object") {
    return identifier;
  }
  return items.find(
    (item) => item.term === identifier || item.termKey === identifier,
  );
};

export const createHistoryStrategy = (items = []) => {
  const cache = dedupeHistoryItems(items);
  return {
    items: cache,
    merge: (incoming) => mergeHistoryPage(cache, incoming),
    paginate: (pageSize) => paginateHistory(cache, pageSize),
    find: (identifier) => resolveHistoryCandidate(cache, identifier),
  };
};
