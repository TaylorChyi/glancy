export const normalizeResponseStyleState = (state, fallbackLabel = "") => {
  if (!state) {
    return state;
  }

  const { error } = state;

  if (error == null) {
    return state;
  }

  if (typeof error === "string") {
    return state;
  }

  if (typeof error === "number" || typeof error === "boolean") {
    return { ...state, error: String(error) };
  }

  const fallback = typeof fallbackLabel === "string" ? fallbackLabel : "";

  return { ...state, error: fallback };
};

export default normalizeResponseStyleState;
