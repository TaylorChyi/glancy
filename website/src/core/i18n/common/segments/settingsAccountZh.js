/**
 * 背景：
 *  - 账户管理类文案分散在原始文件中，缺少集中治理。
 * 目的：
 *  - 将账户信息、绑定与身份相关翻译项集中，便于安全与产品团队协同。
 * 关键决策与取舍：
 *  - 沿用原键名，通过合并导出保障调用链稳定；
 *  - 将用户名编辑与绑定状态放入同一模块，方便统一审视。
 * 影响范围：
 *  - 偏好设置账户页签与个人资料编辑入口。
 * 演进与TODO：
 *  - 后续支持多身份绑定时，可扩展枚举映射维度以避免散落常量。
 */
export const SETTINGS_ACCOUNT_TRANSLATIONS_ZH = {
  settingsTabAccount: "账号",
  settingsAccountDescription: "梳理与你账户相关的基础身份信息。",
  settingsAccountAvatarLabel: "头像",
  settingsManageProfile: "更换用户名",
  settingsAccountUsername: "用户名",
  settingsAccountEmail: "邮箱",
  settingsAccountPhone: "手机号",
  settingsAccountEmailUnbindAction: "解绑邮箱",
  settingsAccountEmailUnbinding: "解绑中…",
  settingsAccountPhoneRebindAction: "换绑手机号",
  settingsEmptyValue: "未填写",
  changeAvatar: "更换头像",
  editButton: "编辑",
  changeUsernameButton: "更换用户名",
  saveUsernameButton: "保存用户名",
  usernameValidationEmpty: "用户名不能为空",
  usernameValidationTooShort: "用户名长度至少为 {{min}} 位",
  usernameValidationTooLong: "用户名长度最多为 {{max}} 位",
  usernameUpdateSuccess: "用户名更新成功",
  usernameUpdateFailed: "用户名更新失败",
  settingsAccountBindingTitle: "账号绑定",
  settingsAccountBindingApple: "Apple 账号",
  settingsAccountBindingGoogle: "Google 账号",
  settingsAccountBindingWeChat: "微信账号",
  settingsAccountBindingStatusUnlinked: "未绑定",
  settingsAccountBindingActionPlaceholder: "敬请期待",
};
