/**
 * 背景：
 *  - Profile 页面逻辑内联导致组件体量庞大、lint 超限，且状态管理分散。
 * 目的：
 *  - 聚合页面所需的状态与副作用，向展示层输出整洁的视图模型。
 * 关键决策与取舍：
 *  - 以组合式 Hook 形式组织模块，保持层次清晰并便于单测；
 *  - 复用既有模型与 API，避免在一次重构中引入过多风险。
 * 影响范围：
 *  - Profile 页面成为薄层容器，后续扩展字段或流程时可在此集中调整。
 * 演进与TODO：
 *  - TODO: 考虑将通知机制升级为全局队列以支撑跨页面的用户提示。
 */
import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { useApi } from "@shared/hooks/useApi.js";
import { useLanguage, useUser } from "@core/context";
import {
  createEmptyProfileDetails,
  profileDetailsReducer,
} from "./profileDetailsModel.js";
import { createProfileFieldGroups } from "./profileFieldGroups.js";
import { useProfileWorkflows } from "./useProfileWorkflows.js";

function usePopupBridge() {
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupMsg, setPopupMsg] = useState("");
  const show = useCallback((message) => {
    setPopupMsg(message);
    setPopupOpen(true);
  }, []);
  const close = useCallback(() => setPopupOpen(false), []);
  return { popupOpen, popupMsg, show, close };
}

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
  const popup = usePopupBridge();
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
