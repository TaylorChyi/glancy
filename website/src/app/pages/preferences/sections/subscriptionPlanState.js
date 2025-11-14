import {
  formatRenewalDate,
  formatWithTemplate,
} from "./subscriptionFormattingToolkit.js";

export const derivePlanState = ({ planId, currentPlanId, purchase }) => {
  const isCurrent = planId === currentPlanId;
  const isRedeemOnly = purchase === "redeem_only" && !isCurrent;
  return { isCurrent, isRedeemOnly };
};

export const resolveBadge = ({
  isCurrent,
  isRedeemOnly,
  badgeCurrent,
  badgeLocked,
  badgeSelected,
}) => {
  if (isCurrent) {
    return badgeCurrent;
  }
  if (isRedeemOnly) {
    return badgeLocked;
  }
  return badgeSelected;
};

export const resolveCtaLabel = ({
  isCurrent,
  isRedeemOnly,
  badgeCurrent,
  badgeLocked,
  cta,
}) => {
  if (isCurrent) {
    return badgeCurrent;
  }
  if (isRedeemOnly) {
    return badgeLocked;
  }
  return cta;
};

export const deriveSubscriptionExpiryLine = ({
  planId,
  isCurrent,
  nextRenewalDate,
  nextRenewalTemplate,
}) => {
  if (!isCurrent || planId === "FREE" || !nextRenewalDate) {
    return undefined;
  }
  const formattedRenewalDate = formatRenewalDate(nextRenewalDate);
  if (!formattedRenewalDate) {
    return undefined;
  }
  return formatWithTemplate(nextRenewalTemplate, formattedRenewalDate);
};
