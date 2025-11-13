export const REDEEM_CODE_GROUP_SIZE = 4;
export const REDEEM_CODE_MAX_LENGTH = 16;

export const normalizeRedeemCodeInput = (rawValue) => {
  if (!rawValue) {
    return "";
  }

  return rawValue.replace(/[^0-9a-zA-Z]/g, "").slice(0, REDEEM_CODE_MAX_LENGTH);
};

export const formatRedeemCodeForDisplay = (code) => {
  if (!code) {
    return "";
  }

  const groups = [];
  for (let index = 0; index < code.length; index += REDEEM_CODE_GROUP_SIZE) {
    groups.push(code.slice(index, index + REDEEM_CODE_GROUP_SIZE));
  }
  return groups.join("-");
};
