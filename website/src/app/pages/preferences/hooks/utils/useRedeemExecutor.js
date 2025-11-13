import { useCallback } from "react";

import {
  MEMBERSHIP_EFFECT_TYPE,
  mergeMembershipRewardIntoUser,
} from "./membershipAdapter.js";
import { ensureRedeemPreconditions } from "./ensureRedeemPreconditions.js";

export const useRedeemExecutor = ({
  user,
  setUser,
  redeemCodeRequest,
  onSuccess,
  onFailure,
}) =>
  useCallback(
    async (normalizedCode) => {
      const emitFailure = typeof onFailure === "function" ? onFailure : (error) => error;

      ensureRedeemPreconditions({
        user,
        redeemCodeRequest,
        emitFailure,
      });

      try {
        const response = await redeemCodeRequest({
          token: user.token,
          code: normalizedCode,
        });

        if (
          response?.effectType === MEMBERSHIP_EFFECT_TYPE &&
          response?.membership &&
          typeof setUser === "function"
        ) {
          const nextUser = mergeMembershipRewardIntoUser(
            user,
            response.membership,
          );
          setUser(nextUser);
        }

        if (typeof onSuccess === "function") {
          onSuccess();
        }

        return response;
      } catch (error) {
        console.error("Failed to redeem subscription code", error);
        if (typeof onFailure === "function") {
          onFailure(error);
        }
        throw error;
      }
    },
    [onFailure, onSuccess, redeemCodeRequest, setUser, user],
  );
