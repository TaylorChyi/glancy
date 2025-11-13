import { useMemo } from "react";
import { createAccountBindings } from "./accountPresentation.js";

export const useAccountBindingsModel = ({ translations, accountCopy }) =>
  useMemo(
    () => createAccountBindings({ translations, accountCopy }),
    [accountCopy, translations],
  );
