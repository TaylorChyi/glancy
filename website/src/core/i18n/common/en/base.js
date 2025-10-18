/**
 * 背景：
 *  - common/en.js 曾堆叠跨场景文案，导致文件长度远超结构化 lint 限制且难以按域维护。
 * 目的：
 *  - 承载跨功能共享的基础界面文案，保持与偏好/词典/订阅等专题文案的解耦。
 * 关键决策与取舍：
 *  - 采用按域拆分 + 对象合并（组合模式），避免在调用方改动键名的情况下即可减轻行数压力；
 *  - 未引入额外运行时代码，仅通过静态对象切分保障零运行时成本。
 * 影响范围：
 *  - 所有依赖 common/en.js 的通用界面提示与表单文案。
 * 演进与TODO：
 *  - 后续新增基础文案时优先在此补充，并保持键名语义与其他域模块无冲突。
 */
const baseCopy = {
  welcomeTitle: "Glancy",
  welcomeMsg: "Welcome to Glancy, a dictionary focused on vocabulary learning.",
  userCount: "Total Users",
  userList: "User List",
  deleteButton: "Delete",
  userDetail: "User Detail",
  updateButton: "Update",
  updateSuccess: "Update success",
  loading: "Loading...",
  saving: "Saving...",
  saveButton: "Save changes",
  saveSuccess: "Preferences updated",
  autoDetect: "Auto Detect",
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
};

export default baseCopy;
