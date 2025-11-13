import { useMemo } from "react";
import {
  buildAccountSnapshot,
  useEmailUnbindCommand,
} from "./accountSnapshot.js";
import { useAccountFieldsModel } from "./useAccountFieldsModel.js";
import { useAccountIdentityModel } from "./useAccountIdentityModel.js";
import { useAccountBindingsModel } from "./useAccountBindingsModel.js";

const useAccountSnapshotModel = ({ user, fallbackValue, accountCopy }) =>
  useMemo(
    () =>
      buildAccountSnapshot({
        user,
        fallbackValue,
        defaultPhoneCode: accountCopy.defaultPhoneCode,
      }),
    [accountCopy.defaultPhoneCode, fallbackValue, user],
  );

const useEmailUnbindState = ({ accountSnapshot, emailBinding }) =>
  useEmailUnbindCommand({ accountSnapshot, emailBinding });

const createFieldsProps = (
  props,
  accountSnapshot,
  { handleEmailUnbind, isEmailUnbinding },
) => ({
  translations: props.translations,
  accountSnapshot,
  fallbackValue: props.fallbackValue,
  handleEmailUnbind,
  isEmailUnbinding,
  updateUsernameRequest: props.updateUsernameRequest,
  setUser: props.setUser,
  user: props.user,
});

const createIdentityProps = (props, accountSnapshot) => ({
  translations: props.translations,
  accountSnapshot,
  accountCopy: props.accountCopy,
  onAvatarSelection: props.onAvatarSelection,
  isAvatarUploading: props.isAvatarUploading,
});

const createBindingsProps = (props) => ({
  translations: props.translations,
  accountCopy: props.accountCopy,
});

const useAccountSectionComponents = (
  props,
  accountSnapshot,
  emailUnbindState,
) => {
  const fields = useAccountFieldsModel(
    createFieldsProps(props, accountSnapshot, emailUnbindState),
  );

  const identity = useAccountIdentityModel(
    createIdentityProps(props, accountSnapshot),
  );

  const bindings = useAccountBindingsModel(createBindingsProps(props));

  return { fields, identity, bindings };
};

export const useAccountSectionModel = (props) => {
  const accountSnapshot = useAccountSnapshotModel(props);

  const emailUnbindState = useEmailUnbindState({
    accountSnapshot,
    emailBinding: props.emailBinding,
  });

  return useAccountSectionComponents(props, accountSnapshot, emailUnbindState);
};
