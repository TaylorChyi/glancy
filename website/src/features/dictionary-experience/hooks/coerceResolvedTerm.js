export function coerceResolvedTerm(candidate, fallback) {
  if (typeof candidate !== "string") return fallback;
  const trimmed = candidate.trim();
  return trimmed || fallback;
}
