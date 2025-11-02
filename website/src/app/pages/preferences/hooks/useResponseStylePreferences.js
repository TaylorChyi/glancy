/**
 * 背景：
 *  - 响应风格分区的请求、缓存与提交逻辑原本夹杂在主 Hook 中，
 *    导致 usePreferenceSections.js 难以维护且测试困难。
 * 目的：
 *  - 抽离响应风格状态机，遵循“数据获取-表单交互-提交”完整闭环，
 *    便于复用与单元测试覆盖。
 * 关键决策与取舍：
 *  - 保留现有 reducer 模型，确保与既有测试兼容；
 *  - 引入 AbortController 守卫，避免组件卸载后的状态更新警告。
 * 影响范围：
 *  - 偏好设置页面的个性化配置分区。
 * 演进与TODO：
 *  - 后续可将请求层替换为 react-query 等数据层以获得缓存与重试能力。
 */
import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import {
  RESPONSE_STYLE_ACTIONS,
  createResponseStyleInitialState,
  hasFieldChanged,
  responseStyleReducer,
} from "../sections/responseStyleModel.js";
import {
  createEmptyProfileDetails,
  mapResponseToProfileDetails,
} from "@app/pages/profile/profileDetailsModel.js";
import {
  ensureAuthenticatedForSave,
  persistResponseStyleChanges,
  synchronizeUnchangedField,
} from "./utils/responseStylePersistence.js";

const hydrateWithEmptyProfile = (dispatch, profileDetailsRef) => {
  profileDetailsRef.current = createEmptyProfileDetails();
  dispatch({
    type: RESPONSE_STYLE_ACTIONS.hydrate,
    payload: profileDetailsRef.current,
  });
};

const createRequestResponseStyle =
  ({ dispatch, user, fetchProfile, profileDetailsRef }) =>
  async ({ signal, withLoading = true } = {}) => {
    const abortRequested = () => Boolean(signal?.aborted);
    const safeDispatch = (action) => {
      if (!abortRequested()) {
        dispatch(action);
      }
    };

    if (!user?.token || typeof fetchProfile !== "function") {
      hydrateWithEmptyProfile(safeDispatch, profileDetailsRef);
      return;
    }

    if (withLoading) {
      safeDispatch({ type: RESPONSE_STYLE_ACTIONS.loading });
    }

    try {
      const response = await fetchProfile({ token: user.token });
      if (abortRequested()) {
        return;
      }
      const details = mapResponseToProfileDetails(response);
      profileDetailsRef.current = details;
      safeDispatch({
        type: RESPONSE_STYLE_ACTIONS.hydrate,
        payload: details,
      });
    } catch (error) {
      console.error("Failed to load response style preferences", error);
      if (abortRequested()) {
        return;
      }
      safeDispatch({ type: RESPONSE_STYLE_ACTIONS.failure, error });
    }
  };

const useResponseStyleHandlers = ({
  dispatch,
  state,
  user,
  saveProfile,
  profileDetailsRef,
}) => {
  const handleFieldChange = useCallback(
    (field, value) => {
      dispatch({
        type: RESPONSE_STYLE_ACTIONS.change,
        field,
        value,
      });
      dispatch({ type: RESPONSE_STYLE_ACTIONS.clearError });
    },
    [dispatch],
  );

  const handleFieldCommit = useCallback(
    async (field) => {
      if (!hasFieldChanged(state, field)) {
        synchronizeUnchangedField({
          state,
          field,
          profileDetailsRef,
          dispatch,
        });
        return;
      }

      if (!ensureAuthenticatedForSave({ user, saveProfile, dispatch })) {
        return;
      }

      dispatch({
        type: RESPONSE_STYLE_ACTIONS.saving,
        field,
      });

      try {
        await persistResponseStyleChanges({
          state,
          user,
          saveProfile,
          profileDetailsRef,
          dispatch,
        });
      } catch (error) {
        console.error("Failed to save response style preferences", error);
        dispatch({ type: RESPONSE_STYLE_ACTIONS.failure, error });
      }
    },
    [dispatch, profileDetailsRef, saveProfile, state, user],
  );

  return { handleFieldChange, handleFieldCommit };
};

const useResponseStyleRequest = ({
  dispatch,
  user,
  fetchProfile,
  profileDetailsRef,
}) => {
  const requestResponseStyle = useMemo(
    () =>
      createRequestResponseStyle({
        dispatch,
        user,
        fetchProfile,
        profileDetailsRef,
      }),
    [dispatch, fetchProfile, profileDetailsRef, user],
  );

  useEffect(() => {
    const controller = new AbortController();
    requestResponseStyle({ signal: controller.signal });
    return () => controller.abort();
  }, [requestResponseStyle]);

  const handleRetry = useCallback(() => {
    requestResponseStyle({ withLoading: true });
  }, [requestResponseStyle]);

  return { handleRetry };
};

export const useResponseStylePreferences = ({
  user,
  fetchProfile,
  saveProfile,
}) => {
  const [state, dispatch] = useReducer(
    responseStyleReducer,
    undefined,
    createResponseStyleInitialState,
  );
  const profileDetailsRef = useRef(createEmptyProfileDetails());

  const { handleRetry } = useResponseStyleRequest({
    dispatch,
    user,
    fetchProfile,
    profileDetailsRef,
  });

  const { handleFieldChange, handleFieldCommit } = useResponseStyleHandlers({
    dispatch,
    state,
    user,
    saveProfile,
    profileDetailsRef,
  });

  return {
    state,
    handleRetry,
    handleFieldChange,
    handleFieldCommit,
  };
};
