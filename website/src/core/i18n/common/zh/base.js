/**
 * 背景：
 *  - common/zh.js 文案曾集中于单文件，基础与业务文案混杂导致维护与 lint 均受阻。
 * 目的：
 *  - 承载跨页面共享的基础界面文案，并与偏好、词典、订阅等域文案解耦。
 * 关键决策与取舍：
 *  - 复用英文拆分策略，以组合模式维持键名不变且零运行时成本；
 *  - 保持与英文模块键集一致，确保多语言加载逻辑结构统一。
 * 影响范围：
 *  - 所有依赖 common/zh.js 的基础提示、表单与全局操作文案。
 * 演进与TODO：
 *  - 后续新增基础文案时优先在此补充，并关注与其他域键名的冲突风险。
 */
const baseCopy = {
  welcomeTitle: "格律词典",
  welcomeMsg: "欢迎来到格律词典，这是一个专注于词汇学习的应用。",
  userCount: "用户总数",
  userList: "用户列表",
  deleteButton: "删除",
  userDetail: "用户详情",
  updateButton: "更新",
  updateSuccess: "更新成功",
  loading: "加载中...",
  saving: "保存中...",
  saveButton: "保存修改",
  saveSuccess: "偏好设置已更新",
  autoDetect: "自动检测",
  notifications: "通知",
  markRead: "标为已读",
  contactTitle: "联系我们",
  back: "返回",
  name: "姓名",
  email: "邮箱",
  phone: "手机号",
  usernamePlaceholder: "请输入用户名",
  emailPlaceholder: "请输入邮箱",
  phonePlaceholder: "请输入手机号",
  interestsLabel: "日常兴趣",
  interestsPlaceholder: "请输入日常兴趣",
  interestsHelp: "根据您的日常兴趣和知识背景提供相关示例",
  goalLabel: "目标",
  goalPlaceholder: "请输入目标",
  goalHelp: "按照考试、旅游或商务等目标调整例句",
  editButton: "编辑",
  changeUsernameButton: "更换用户名",
  saveUsernameButton: "保存用户名",
  usernameValidationEmpty: "用户名不能为空",
  usernameValidationTooShort: "用户名长度至少为 {{min}} 位",
  usernameValidationTooLong: "用户名长度最多为 {{max}} 位",
  usernameUpdateSuccess: "用户名更新成功",
  usernameUpdateFailed: "用户名更新失败",
  message: "留言",
  chatPlaceholder: "输入消息...",
  sendButton: "发送",
  submit: "提交",
  submitSuccess: "提交成功",
  submitFail: "提交失败",
  healthTitle: "服务状态",
  ok: "正常",
  fail: "异常",
  refresh: "刷新",
  changeAvatar: "更换头像",
  guest: "游客",
  upgrade: "升级",
  upgradeAvailable: "升级可用",
  profile: "个性化",
  settings: "系统设置",
  shortcuts: "快捷键",
  help: "帮助",
  helpCenter: "帮助中心",
  releaseNotes: "版本说明",
  termsPolicies: "条款与政策",
  reportBug: "问题反馈",
  downloadApps: "下载应用",
  logout: "退出登录",
  logoutConfirmTitle: "确定要退出登录吗？",
  logoutConfirmMessage: "以 {email} 身份退出格律词典？",
};

export default baseCopy;
