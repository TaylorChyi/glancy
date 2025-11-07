import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { cacheBust } from "@shared/utils";
import { normalizeAvatarFileName } from "@shared/utils/avatarFile.js";

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

const createLabels = (t) => ({
  title: t.avatarEditorTitle,
  description: t.avatarEditorDescription,
  zoomIn: t.avatarZoomIn,
  zoomOut: t.avatarZoomOut,
  cancel: t.avatarCancel,
  confirm: t.avatarConfirm,
});

const handleFileInput = (event, { currentUser, dispatch }) => {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file || !currentUser) {
    return;
  }
  const source = URL.createObjectURL(file);
  dispatch({
    type: "open",
    payload: { source, fileName: file.name, fileType: file.type },
  });
};

const confirmAvatarUpload = async (
  { blob, previewUrl },
  {
    api,
    currentUser,
    editorState,
    currentAvatar,
    setAvatar,
    setUser,
    dispatch,
    previousAvatarRef,
    notifyFailure,
  },
) => {
  if (!currentUser) {
    URL.revokeObjectURL(previewUrl);
    dispatch({ type: "close" });
    return;
  }
  dispatch({ type: "startUpload" });
  previousAvatarRef.current = currentAvatar();
  setAvatar(previewUrl);
  try {
    const state = editorState();
    const preferredType = blob.type || state.fileType || "image/png";
    const normalizedName = normalizeAvatarFileName(
      state.fileName,
      preferredType,
    );
    const file = new File([blob], normalizedName, { type: preferredType });
    const data = await api.users.uploadAvatar({
      userId: currentUser.id,
      file,
      token: currentUser.token,
    });
    const url = cacheBust(data.avatar);
    setAvatar(url);
    setUser({ ...currentUser, avatar: url });
    dispatch({ type: "complete" });
  } catch (error) {
    console.error(error);
    notifyFailure();
    setAvatar(previousAvatarRef.current);
    dispatch({ type: "fail" });
  } finally {
    previousAvatarRef.current = "";
    URL.revokeObjectURL(previewUrl);
  }
};

function useSyncedRef(value) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}

function useAvatarPreviewCleanup(source) {
  useEffect(() => {
    if (!source) {
      return undefined;
    }
    return () => {
      URL.revokeObjectURL(source);
    };
  }, [source]);
}

function useAvatarChangeHandler({ currentUser, dispatchEditor }) {
  return useCallback(
    (event) =>
      handleFileInput(event, { currentUser, dispatch: dispatchEditor }),
    [currentUser, dispatchEditor],
  );
}

function useAvatarModalCloseHandler({ dispatchEditor, previousAvatarRef }) {
  return useCallback(() => {
    previousAvatarRef.current = "";
    dispatchEditor({ type: "close" });
  }, [dispatchEditor, previousAvatarRef]);
}

function useAvatarConfirmHandler({
  api,
  currentUser,
  dispatchEditor,
  editorStateRef,
  avatarRef,
  setAvatar,
  setUser,
  previousAvatarRef,
  notifyFailure,
}) {
  return useCallback(
    (payload) =>
      confirmAvatarUpload(payload, {
        api,
        currentUser,
        editorState: () => editorStateRef.current,
        currentAvatar: () => avatarRef.current,
        setAvatar,
        setUser,
        dispatch: dispatchEditor,
        previousAvatarRef,
        notifyFailure,
      }),
    [
      api,
      avatarRef,
      currentUser,
      dispatchEditor,
      editorStateRef,
      notifyFailure,
      previousAvatarRef,
      setAvatar,
      setUser,
    ],
  );
}

function useApplyServerAvatar(setAvatar) {
  return useCallback(
    (nextAvatar) => {
      if (!nextAvatar) {
        setAvatar("");
        return;
      }
      setAvatar(cacheBust(nextAvatar));
    },
    [setAvatar],
  );
}

function useAvatarHandlers(params) {
  return {
    handleAvatarChange: useAvatarChangeHandler(params),
    handleAvatarModalClose: useAvatarModalCloseHandler(params),
    handleAvatarConfirm: useAvatarConfirmHandler(params),
    applyServerAvatar: useApplyServerAvatar(params.setAvatar),
  };
}

export function useAvatarEditorController({
  api,
  currentUser,
  setUser,
  t,
  notifyFailure,
}) {
  const [avatar, setAvatar] = useState("");
  const previousAvatarRef = useRef("");
  const [editor, dispatchEditor] = useReducer(
    avatarEditorReducer,
    undefined,
    createAvatarEditorInitialState,
  );
  const editorStateRef = useSyncedRef(editor);
  const avatarRef = useSyncedRef(avatar);

  useAvatarPreviewCleanup(editor.source);

  const labels = useMemo(() => createLabels(t), [t]);

  const handlers = useAvatarHandlers({
    api,
    currentUser,
    setUser,
    setAvatar,
    dispatchEditor,
    editorStateRef,
    avatarRef,
    previousAvatarRef,
    notifyFailure,
  });

  return {
    avatar,
    editor,
    labels,
    ...handlers,
  };
}
