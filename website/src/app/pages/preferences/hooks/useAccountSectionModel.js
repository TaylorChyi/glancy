import { useMemo } from "react";
import {
  buildAccountSnapshot,
  useEmailUnbindCommand,
} from "./accountSnapshot.js";
import { useAccountFieldsModel } from "./useAccountFieldsModel.js";
import { useAccountIdentityModel } from "./useAccountIdentityModel.js";
import { useAccountBindingsModel } from "./useAccountBindingsModel.js";

export const useAccountSectionModel = ({
  translations,
  fallbackValue,
  accountCopy,
  emailBinding,
  onAvatarSelection,
  isAvatarUploading,
  updateUsernameRequest,
  setUser,
  user,
}) => {
  const accountSnapshot = useMemo(
    () =>
      buildAccountSnapshot({
        user,
        fallbackValue,
        defaultPhoneCode: accountCopy.defaultPhoneCode,
      }),
    [accountCopy.defaultPhoneCode, fallbackValue, user],
  );

  const { handleEmailUnbind, isEmailUnbinding } = useEmailUnbindCommand({
    accountSnapshot,
    emailBinding,
  });

  const fields = useAccountFieldsModel({
    translations,
    accountSnapshot,
    fallbackValue,
    handleEmailUnbind,
    isEmailUnbinding,
    updateUsernameRequest,
    setUser,
    user,
  });

  const identity = useAccountIdentityModel({
    translations,
    accountSnapshot,
    accountCopy,
    onAvatarSelection,
    isAvatarUploading,
  });

  const bindings = useAccountBindingsModel({ translations, accountCopy });

  return { fields, identity, bindings };
};
