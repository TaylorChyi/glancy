import { useMemo } from "react";
import { useResponseStylePreferences } from "../useResponseStylePreferences.js";
import { createResponseStyleCopy } from "../createResponseStyleCopy.js";

export const useResponseStyleResources = ({
  translations,
  user,
  fetchProfile,
  saveProfile,
}) => {
  const responseStyleCopy = useMemo(
    () => createResponseStyleCopy(translations),
    [translations],
  );

  const responseStylePreferences = useResponseStylePreferences({
    user,
    fetchProfile,
    saveProfile,
  });

  return { responseStyleCopy, responseStylePreferences };
};
