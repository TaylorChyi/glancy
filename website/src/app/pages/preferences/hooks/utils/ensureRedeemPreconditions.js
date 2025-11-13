export const ensureRedeemPreconditions = ({
  user,
  redeemCodeRequest,
  emitFailure,
}) => {
  if (!user?.token) {
    const error = new Error("redeem-auth-missing");
    console.error("Failed to redeem subscription code", error);
    throw emitFailure(error);
  }

  if (typeof redeemCodeRequest !== "function") {
    const error = new Error("redeem-api-unavailable");
    console.error("Failed to redeem subscription code", error);
    throw emitFailure(error);
  }
};
