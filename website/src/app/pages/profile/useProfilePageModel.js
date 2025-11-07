import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { useApi } from "@shared/hooks/useApi.js";
import { useMessagePopup } from "@shared/hooks/useMessagePopup.js";
import { useLanguage, useUser } from "@core/context";
import {
  createEmptyProfileDetails,
  profileDetailsReducer,
} from "./profileDetailsModel.js";
import { createProfileFieldGroups } from "./profileFieldGroups.js";
import { useProfileWorkflows } from "./useProfileWorkflows.js";

function useProfileDetailsState(t) {
  const [details, dispatchDetails] = useReducer(
    profileDetailsReducer,
    undefined,
    createEmptyProfileDetails,
  );
  const handleFieldChange = useCallback(
    (field) => (event) => {
      dispatchDetails({
        type: "updateField",
        field,
        value: event.target.value,
      });
    },
    [],
  );
  const handleCustomSectionsChange = useCallback((sections) => {
    dispatchDetails({ type: "setCustomSections", sections });
  }, []);
  const fieldGroups = useMemo(() => createProfileFieldGroups(t), [t]);
  return {
    details,
    dispatchDetails,
    handleFieldChange,
    handleCustomSectionsChange,
    fieldGroups,
  };
}

function usePhoneState(initialPhone = "") {
  const [phone, setPhone] = useState(initialPhone);
  const syncPhone = useCallback((nextPhone) => {
    setPhone(nextPhone ?? "");
  }, []);
  return { phone, syncPhone, setPhone };
}

function usePersistedMetaState() {
  const [persistedMeta, setPersistedMeta] = useState({
    dailyWordTarget: null,
    futurePlan: null,
  });
  return { persistedMeta, setPersistedMeta };
}

function useProfileServices() {
  const { t } = useLanguage();
  const api = useApi();
  const { user: currentUser, setUser } = useUser();
  return { t, api, currentUser, setUser };
}

function useSynchronizedPhoneState(currentUser) {
  const phoneState = usePhoneState(currentUser?.phone || "");
  const syncPhone = phoneState.syncPhone;
  const userPhone = currentUser?.phone || "";
  useEffect(() => {
    syncPhone(userPhone);
  }, [syncPhone, userPhone]);
  return phoneState;
}

export function useProfilePageModel() {
  const { t, api, currentUser, setUser } = useProfileServices();
  const popup = useMessagePopup();
  const detailsState = useProfileDetailsState(t);
  const phoneState = useSynchronizedPhoneState(currentUser);
  const { persistedMeta, setPersistedMeta } = usePersistedMetaState();
  const workflows = useProfileWorkflows({
    api,
    currentUser,
    setUser,
    popup,
    t,
    detailsState,
    phoneState,
    persistedMeta,
    setPersistedMeta,
  });
  return {
    t,
    currentUser,
    popup,
    detailsState,
    phoneState,
    ...workflows,
  };
}
