/**
 * Detect the language of a text based on presence of Chinese characters.
 * @param {string} text
 * @returns {'CHINESE' | 'ENGLISH'}
 */
export function detectWordLanguage(text = '') {
  return /[\u4e00-\u9fff]/u.test(text) ? 'CHINESE' : 'ENGLISH'
}

