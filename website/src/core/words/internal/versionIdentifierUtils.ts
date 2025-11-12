import type {
  WordIdentifier,
  WordVersion,
} from "../wordVersionRegistry.types.js";

export const normalizeIdentifier = (
  value?: string | number | null,
): WordIdentifier | null => {
  if (value == null) {
    return null;
  }
  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : null;
};

export const parseTimestamp = (
  value: string | Date | null | undefined,
): number | null => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    const time = value.getTime();
    return Number.isNaN(time) ? null : time;
  }

  const date = new Date(value);
  const time = date.getTime();
  return Number.isNaN(time) ? null : time;
};

export const findMatchingId = (
  versions: WordVersion[],
  candidate: WordIdentifier | null,
) => {
  if (!candidate) {
    return null;
  }
  return versions.some((version) => version.id === candidate)
    ? candidate
    : null;
};
