import { useCallback } from "react";

import {
  MEMBERSHIP_EFFECT_TYPE,
  mergeMembershipRewardIntoUser,
} from "./membershipAdapter.js";
import { ensureRedeemPreconditions } from "./ensureRedeemPreconditions.js";

const createFailureEmitter = (onFailure) =>
  typeof onFailure === "function" ? onFailure : (error) => error;

const executeRedeemRequest = (redeemCodeRequest, token, code) =>
  redeemCodeRequest({ token, code });

const applyRedeemResponse = ({ response, user, setUser, onSuccess }) => {
  if (
    response?.effectType === MEMBERSHIP_EFFECT_TYPE &&
    response?.membership &&
    typeof setUser === "function"
  ) {
    const nextUser = mergeMembershipRewardIntoUser(user, response.membership);
    setUser(nextUser);
  }

  if (typeof onSuccess === "function") {
    onSuccess();
  }
};

const handleRedeemFailure = (error, onFailure) => {
  console.error("Failed to redeem subscription code", error);
  if (typeof onFailure === "function") {
    onFailure(error);
  }
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
        const response = await executeRedeemRequest(
          redeemCodeRequest,
          user.token,
          normalizedCode,
        );

        applyRedeemResponse({ response, user, setUser, onSuccess });
        return response;
      } catch (error) {
        handleRedeemFailure(error, onFailure);
        throw error;
      }
    },
    [onFailure, onSuccess, redeemCodeRequest, setUser, user],
  );
