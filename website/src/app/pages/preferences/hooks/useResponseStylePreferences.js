import { useRef } from "react";
import { createEmptyProfileDetails } from "@app/pages/profile/profileDetailsModel.js";
import { useResponseStyleReducer } from "./useResponseStyleReducer.js";
import { useResponseStyleHandlers } from "./useResponseStyleHandlers.js";
import { useResponseStyleRequestLifecycle } from "./useResponseStyleRequestLifecycle.js";

const useProfileDetailsRef = () => useRef(createEmptyProfileDetails());

export const useResponseStylePreferences = ({
  user,
  fetchProfile,
  saveProfile,
}) => {
  const profileDetailsRef = useProfileDetailsRef();
  const [state, dispatch] = useResponseStyleReducer();
  const requestParams = { dispatch, user, fetchProfile, profileDetailsRef };
  const { handleRetry } = useResponseStyleRequestLifecycle(requestParams);
  const { handleFieldChange, handleFieldCommit } = useResponseStyleHandlers({
    ...requestParams,
    state,
    saveProfile,
  });

  return { state, handleRetry, handleFieldChange, handleFieldCommit };
};

