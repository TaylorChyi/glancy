/**
 * 背景：
 *  - 原始 zh 翻译文件集中维护全部界面文案，行数超限导致 ESLint 结构化规则被迫豁免。
 * 目的：
 *  - 拆分通用界面文案，便于按领域组合与渐进维护，恢复结构化校验能力。
 * 关键决策与取舍：
 *  - 采用领域分组的平铺对象，维持现有消费侧平坦键结构，避免侵入式重构；
 *  - 以具名常量导出，方便后续扩展或按需 tree-shaking。
 * 影响范围：
 *  - 依赖通用界面文案的所有组件与页面。
 * 演进与TODO：
 *  - 若后续引入多品牌主题，可在此基础上拓展命名空间化的合并策略。
 */
export const CORE_INTERFACE_TRANSLATIONS_ZH = {
  welcomeTitle: "格律词典",
  welcomeMsg: "欢迎来到格律词典，这是一个专注于词汇学习的应用。",
  userCount: "用户总数",
  userList: "用户列表",
  deleteButton: "删除",
  userDetail: "用户详情",
  updateButton: "更新",
  updateSuccess: "更新成功",
  contactTitle: "联系我们",
  loading: "加载中...",
  saving: "保存中...",
  saveButton: "保存修改",
  saveSuccess: "偏好设置已更新",
  autoDetect: "自动检测",
  back: "返回",
  name: "姓名",
  email: "邮箱",
  phone: "手机号",
  usernamePlaceholder: "请输入用户名",
  emailPlaceholder: "请输入邮箱",
  phonePlaceholder: "请输入手机号",
  message: "留言",
  submit: "提交",
  submitSuccess: "提交成功",
  submitFail: "提交失败",
  healthTitle: "服务状态",
  ok: "正常",
  fail: "异常",
  refresh: "刷新",
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
  notifications: "通知",
  markRead: "标为已读",
};
