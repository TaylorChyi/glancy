/**
 * 背景：
 *  - 原有 en.js 将后台管理与偏好设置等词条混杂，导致文件超过结构化 lint 限制且难以扩展。
 * 目的：
 *  - 聚合与用户管理相关的词条，便于后续按模块演进并保持翻译语义集中。
 * 关键决策与取舍：
 *  - 采用模块化拆分（composition over inheritance），让主入口通过对象合成整合多子域词条；
 *  - 暂不引入动态加载，避免在词条层面增加运行时复杂度。
 * 影响范围：
 *  - 仅影响 i18n 词条的组织结构；调用方通过默认导出获取全集保持不变。
 * 演进与TODO：
 *  - 若后续新增后台视图，可在本模块继续补充或按子域拆分更细粒度文件。
 */
const administration = {
  welcomeTitle: "Glancy",
  welcomeMsg: "Welcome to Glancy, a dictionary focused on vocabulary learning.",
  userCount: "Total Users",
  userList: "User List",
  deleteButton: "Delete",
  userDetail: "User Detail",
  updateButton: "Update",
  updateSuccess: "Update success",
};

export default administration;
