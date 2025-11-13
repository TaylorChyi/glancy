const buildHeaderViewModel = ({ hasBoundEmail, statusTone, summaryLabel, t }) => ({
  title: t.emailBindingTitle,
  subtitle: summaryLabel,
  statusLabel: hasBoundEmail ? t.emailStatusBound : t.emailStatusUnbound,
  statusTone: statusTone.text,
  statusClassName: statusTone.label,
});

export default function createHeaderViewModel({ metadata, t }) {
  return buildHeaderViewModel({
    hasBoundEmail: metadata.hasBoundEmail,
    statusTone: metadata.statusTone,
    summaryLabel: metadata.summaryLabel,
    t,
  });
}

export { createHeaderViewModel };
