import { useMemo } from "react";
import type {
  AvatarEditorProps,
  CloseAction,
  FormProps,
  ToastProps,
  ViewProps,
  ModalProps,
  ViewportProps,
} from "../settingsModalTypes";

const createViewProps = ({
  modal,
  viewport,
  form,
  avatarEditor,
  toast,
  closeAction,
}: {
  modal: ModalProps;
  viewport: ViewportProps;
  form: FormProps;
  avatarEditor?: AvatarEditorProps;
  toast?: ToastProps;
  closeAction: CloseAction;
}): ViewProps => ({
  modal,
  viewport,
  form,
  avatarEditor,
  toast,
  closeAction,
});

const useViewProps = ({
  modal,
  viewport,
  form,
  avatarEditor,
  toast,
  closeAction,
}: {
  modal: ModalProps;
  viewport: ViewportProps;
  form: FormProps;
  avatarEditor?: AvatarEditorProps;
  toast?: ToastProps;
  closeAction: CloseAction;
}): ViewProps =>
  useMemo(
    () =>
      createViewProps({
        modal,
        viewport,
        form,
        avatarEditor,
        toast,
        closeAction,
      }),
    [modal, viewport, form, avatarEditor, toast, closeAction],
  );

export default useViewProps;
