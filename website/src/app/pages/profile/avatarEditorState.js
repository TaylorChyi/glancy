export const avatarEditorInitialState = Object.freeze({
  phase: "idle",
  source: "",
  fileName: "avatar.png",
  fileType: "image/png",
});

const ACTION_HANDLERS = {
  open: (_state, action) => ({
    phase: "preview",
    source: action.payload?.source ?? "",
    fileName: action.payload?.fileName || "avatar.png",
    fileType: action.payload?.fileType || "image/png",
  }),
  startUpload: (state) => ({ ...state, phase: "uploading" }),
  fail: (state) => ({ ...state, phase: "preview" }),
  complete: () => createAvatarEditorInitialState(),
  close: () => createAvatarEditorInitialState(),
};

export function createAvatarEditorInitialState() {
  return { ...avatarEditorInitialState };
}

export function avatarEditorReducer(state = avatarEditorInitialState, action) {
  const handler = ACTION_HANDLERS[action.type];
  if (!handler) {
    return state;
  }
  return handler(state, action);
}
