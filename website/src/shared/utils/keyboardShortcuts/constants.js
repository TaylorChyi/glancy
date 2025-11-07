const MODIFIER_TOKENS = Object.freeze([
  "MOD",
  "CONTROL",
  "META",
  "ALT",
  "SHIFT",
]);

export const MODIFIER_ORDER = Object.freeze([...MODIFIER_TOKENS]);
export const MODIFIER_SET = new Set(MODIFIER_TOKENS);

const SHORTCUT_BLUEPRINT = Object.freeze([
  ["FOCUS_SEARCH", Object.freeze(["MOD", "SHIFT", "F"])],
  ["SWITCH_LANGUAGE", Object.freeze(["MOD", "SHIFT", "L"])],
  ["TOGGLE_THEME", Object.freeze(["MOD", "SHIFT", "M"])],
  ["OPEN_SHORTCUTS", Object.freeze(["MOD", "SHIFT", "K"])],
]);

export const DEFAULT_SHORTCUTS = SHORTCUT_BLUEPRINT.map(([action, keys]) => ({
  action,
  keys: [...keys],
  defaultKeys: [...keys],
}));

export const APPLE_PLATFORM_PATTERN = /Mac|iPhone|iPad|iPod/i;

export { SHORTCUT_BLUEPRINT };
