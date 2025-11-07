const createIconConfig = (name) =>
  Object.freeze({
    name,
    roleClass: "inherit",
    decorative: true,
    width: 20,
    height: 20,
  });

export const SECTION_ICON_REGISTRY = Object.freeze({
  general: createIconConfig("cog-6-tooth"),
  responseStyle: createIconConfig("personalization"),
  data: createIconConfig("shield-check"),
  keyboard: createIconConfig("command-line"),
  account: createIconConfig("user"),
  subscription: createIconConfig("subscription"),
});

export const FALLBACK_MODAL_HEADING_ID = "settings-modal-fallback-heading";
