/**
 * 背景：
 *  - usePreferenceSections 既要汇聚状态也要整形视图数据，导致关注点分散。
 * 目的：
 *  - 通过 Builder 风格的纯函数，将领域数据组装成页面消费的 ViewModel。
 * 关键决策与取舍：
 *  - 保持输入为显式字段，便于后续在页面或模态中扩展额外能力。
 * 影响范围：
 *  - 偏好设置页面、SettingsModal 等复用 ViewModel 的入口。
 * 演进与TODO：
 *  - 后续可在此扩展特性开关，动态隐藏尚未开放的分区。
 */
export const createPreferenceViewModel = ({
  preferenceCopy,
  sections,
  navigation,
  panel,
  avatarEditorModalProps,
  redeemToast,
}) => ({
  copy: preferenceCopy.copy,
  header: preferenceCopy.header,
  sections,
  activeSection: navigation.activeSection,
  activeSectionId: navigation.activeSectionId,
  handleSectionSelect: navigation.handleSectionSelect,
  handleSubmit: navigation.handleSubmit,
  panel,
  avatarEditor: { modalProps: avatarEditorModalProps },
  feedback: { redeemToast },
});
