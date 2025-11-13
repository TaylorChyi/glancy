import { useMemo } from "react";
import { createAccountIdentity } from "./accountPresentation.js";

export const useAccountIdentityModel = ({
  translations,
  accountSnapshot,
  accountCopy,
  onAvatarSelection,
  isAvatarUploading,
}) =>
  useMemo(
    () =>
      createAccountIdentity({
        translations,
        accountSnapshot,
        accountCopy,
        onAvatarSelection,
        isAvatarUploading,
      }),
    [
      accountCopy,
      accountSnapshot,
      isAvatarUploading,
      onAvatarSelection,
      translations,
    ],
  );
