/**
 * 背景：
 *  - 账户、联系与导航词条散落在大文件中，增加维护门槛。
 * 目的：
 *  - 聚合账户生命周期（资料、支持、导航）相关翻译，确保上下文一致。
 * 关键决策与取舍：
 *  - 通过语义分组让 UI 与领域词条映射更清晰；
 *  - 暂不引入命名空间前缀，避免破坏现有调用。
 * 影响范围：
 *  - 账户设置、导航抽屉、支持入口等界面。
 * 演进与TODO：
 *  - 若后续拆分移动端/桌面端专属用语，可在此模块继续细化分层。
 */
const account = {
  notifications: "Notifications",
  markRead: "Mark read",
  contactTitle: "Contact Us",
  back: "Back",
  name: "Name",
  email: "Email",
  phone: "Phone",
  usernamePlaceholder: "Enter username",
  emailPlaceholder: "Enter email",
  phonePlaceholder: "Enter phone",
  interestsLabel: "Interests",
  interestsPlaceholder: "Enter interests",
  interestsHelp: "Examples will reference your field of interest",
  goalLabel: "Goal",
  goalPlaceholder: "Enter goal",
  goalHelp: "Examples adapt to goals like exams or travel",
  editButton: "Edit",
  changeUsernameButton: "Change username",
  saveUsernameButton: "Save username",
  usernameValidationEmpty: "Username is required",
  usernameValidationTooShort: "Username must be at least {{min}} characters",
  usernameValidationTooLong: "Username must be at most {{max}} characters",
  usernameUpdateSuccess: "Username updated successfully",
  usernameUpdateFailed: "Unable to update username",
  message: "Message",
  chatPlaceholder: "Type a message...",
  sendButton: "Send",
  submit: "Submit",
  submitSuccess: "Success",
  submitFail: "Failed",
  healthTitle: "Service Status",
  ok: "OK",
  fail: "FAIL",
  refresh: "Refresh",
  changeAvatar: "Change Avatar",
  guest: "Guest",
  upgrade: "Upgrade",
  upgradeAvailable: "Upgrade to use",
  profile: "Personalization",
  settings: "Settings",
  shortcuts: "Shortcuts",
  help: "Help",
  helpCenter: "Help center",
  releaseNotes: "Release notes",
  termsPolicies: "Terms & policies",
  reportBug: "Report an issue",
  downloadApps: "Download apps",
  logout: "Log out",
  logoutConfirmTitle: "Are you sure you want to log out?",
  logoutConfirmMessage: "Log out of Glancy as {email}?",
  close: "Close",
};

export default account;
