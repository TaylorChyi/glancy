const safeStringify = (value) => {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    const serialized = JSON.stringify(value);
    return serialized === undefined ? "" : serialized;
  } catch {
    return "";
  }
};

export const createStableKeyFactory = (prefix) => {
  const occurrences = new Map();
  return (value) => {
    const base = safeStringify(value) || prefix;
    const count = occurrences.get(base) ?? 0;
    occurrences.set(base, count + 1);
    return count ? `${base}-${count}` : base;
  };
};
