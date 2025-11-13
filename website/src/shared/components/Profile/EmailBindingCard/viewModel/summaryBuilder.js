const buildSummaryViewModel = ({
  hasBoundEmail,
  email,
  t,
  primaryActionLabel,
  onStart,
  isUnbinding,
  onUnbind,
  mode,
}) => ({
  isVisible: mode !== "editing",
  label: t.emailCurrentLabel,
  currentEmail: hasBoundEmail ? email : t.emailEmptyValue,
  primaryActionLabel,
  onStart,
  secondaryActionLabel: isUnbinding ? t.emailUnbinding : t.emailUnbindAction,
  onUnbind,
  isSecondaryDisabled: !hasBoundEmail || isUnbinding,
});

export default function createSummaryViewModel({
  metadata,
  email,
  t,
  onStart,
  isUnbinding,
  onUnbind,
  mode,
}) {
  return buildSummaryViewModel({
    hasBoundEmail: metadata.hasBoundEmail,
    email,
    t,
    primaryActionLabel: metadata.primaryActionLabel,
    onStart,
    isUnbinding,
    onUnbind,
    mode,
  });
}

export { createSummaryViewModel };
