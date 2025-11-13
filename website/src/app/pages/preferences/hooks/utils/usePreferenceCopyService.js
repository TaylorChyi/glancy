import { usePreferenceCopy } from "../usePreferenceCopy.js";

export const usePreferenceCopyService = ({ translations, user }) =>
  usePreferenceCopy({ translations, user });
