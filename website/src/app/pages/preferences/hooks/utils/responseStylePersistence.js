import {
  RESPONSE_STYLE_ACTIONS,
  buildRequestPayload,
} from "../../sections/responseStyleModel.js";
import {
  mapProfileDetailsToRequest,
  mapResponseToProfileDetails,
} from "@app/pages/profile/profileDetailsModel.js";

export const synchronizeUnchangedField = ({
  state,
  field,
  profileDetailsRef,
  dispatch,
}) => {
  const normalized = (state.values[field] ?? "").trim();
  profileDetailsRef.current = {
    ...profileDetailsRef.current,
    [field]: normalized,
  };
  dispatch({
    type: RESPONSE_STYLE_ACTIONS.synchronize,
    field,
    value: normalized,
  });
};

export const ensureAuthenticatedForSave = ({ user, saveProfile, dispatch }) => {
  if (!user?.token || typeof saveProfile !== "function") {
    dispatch({
      type: RESPONSE_STYLE_ACTIONS.failure,
      error: new Error("response-style-save-auth-missing"),
    });
    return false;
  }
  return true;
};

/**
 * 意图：集中完成响应风格字段的持久化提交。
 * 输入：当前 reducer 状态、用户信息、持久化函数与缓存引用。
 * 输出：更新后的 profileDetailsRef 与成功动作派发。
 * 流程：
 *  1) 合并草稿与已持久化数据，生成请求负载；
 *  2) 执行保存并读取最新响应；
 *  3) 以响应内容刷新本地缓存并通知 reducer。
 * 错误处理：由调用方捕获异常并发出 failure 动作。
 * 复杂度：O(n) 与字段数量线性相关。
 */
export const persistResponseStyleChanges = async ({
  state,
  user,
  saveProfile,
  profileDetailsRef,
  dispatch,
}) => {
  const mergedDetails = buildRequestPayload(state, profileDetailsRef.current);
  profileDetailsRef.current = mergedDetails;
  const payload = mapProfileDetailsToRequest(mergedDetails);
  const response = await saveProfile({
    token: user.token,
    profile: payload,
  });
  const nextDetails = mapResponseToProfileDetails(response);
  profileDetailsRef.current = nextDetails;
  dispatch({
    type: RESPONSE_STYLE_ACTIONS.success,
    payload: nextDetails,
  });
};
