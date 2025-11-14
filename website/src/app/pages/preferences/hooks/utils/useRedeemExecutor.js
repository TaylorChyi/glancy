import { useCallback } from "react";

import {
  MEMBERSHIP_EFFECT_TYPE,
  mergeMembershipRewardIntoUser,
} from "./membershipAdapter.js";
import { ensureRedeemPreconditions } from "./ensureRedeemPreconditions.js";

const createFailureEmitter = (onFailure) =>
  typeof onFailure === "function" ? onFailure : (error) => error;

const redeemSubscriptionCode = ({ redeemCodeRequest, token, code }) =>
  redeemCodeRequest({ token, code });

const applyMembershipUpdates = ({ response, user, setUser }) => {
  if (
    response?.effectType === MEMBERSHIP_EFFECT_TYPE &&
    response?.membership &&
    typeof setUser === "function"
  ) {
    const nextUser = mergeMembershipRewardIntoUser(user, response.membership);
    setUser(nextUser);
  }
};

const notifyRedeemSuccess = (onSuccess) => {
  if (typeof onSuccess === "function") {
    onSuccess();
  }
};

const applyRedeemResponse = ({ response, user, setUser, onSuccess }) => {
  applyMembershipUpdates({ response, user, setUser });
  notifyRedeemSuccess(onSuccess);
};

const emitRedeemFailure = (error, emitFailure) => {
  console.error("Failed to redeem subscription code", error);
  emitFailure(error);
};

export const useRedeemExecutor = ({
  user,
  setUser,
  redeemCodeRequest,
  onSuccess,
  onFailure,
}) =>
  useCallback(
    async (normalizedCode) => {
      const emitFailure = createFailureEmitter(onFailure);

      ensureRedeemPreconditions({
        user,
        redeemCodeRequest,
        emitFailure,
      });

      try {
        const response = await redeemSubscriptionCode({
          redeemCodeRequest,
          token: user.token,
          code: normalizedCode,
        });

        applyRedeemResponse({ response, user, setUser, onSuccess });
        return response;
      } catch (error) {
        emitRedeemFailure(error, emitFailure);
        throw error;
      }
    },
    [onFailure, onSuccess, redeemCodeRequest, setUser, user],
  );
