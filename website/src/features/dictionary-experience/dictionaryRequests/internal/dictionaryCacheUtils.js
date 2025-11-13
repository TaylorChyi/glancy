import { wordCacheKey } from "@shared/api/words.js";

export const buildCacheKey = ({ term, language, flavor }) =>
  wordCacheKey({ term, language, flavor });
