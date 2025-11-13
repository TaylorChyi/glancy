import { coerceResolvedTerm } from "../../hooks/coerceResolvedTerm.js";

export { sanitizeTerm } from "./termSanitizer.js";
export { resolveHistorySelection } from "./historySelectionResolver.js";
export { prepareLookup } from "./lookupPreparation.js";

export const resolveResolvedTerm = (hydrated, normalized) =>
  coerceResolvedTerm(hydrated?.term, normalized);

