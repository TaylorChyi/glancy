/**
 * Derive a client identifier from a model string.
 * For example: "OPENAI_GPT3" -> "openai".
 * @param {string} model
 * @returns {string}
 */
export function clientNameFromModel(model = '') {
  return model.toLowerCase().split('_')[0]
}

