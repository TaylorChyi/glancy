/**
 * 背景：
 *  - 页面组件曾集成状态、网络与渲染逻辑，体量超限且难以维护。
 * 目的：
 *  - 将页面职责收敛为装配视图模型与展示组件，便于结构化演进。
 * 关键决策与取舍：
 *  - 借助 useProfilePageModel 聚合状态，Profile 仅负责装配；
 *  - 渲染交由 ProfileLayout 承担，确保结构化 lint 可达标。
 * 影响范围：
 *  - Profile 页面变为薄容器，有利于后续扩展字段或交互流程。
 * 演进与TODO：
 *  - TODO: 当视图模型扩展至多终端时，可考虑拆分模型以支持按需加载。
 */
import ProfileLayout from "./ProfileLayout.jsx";
import { useProfilePageModel } from "./useProfilePageModel.js";

function Profile({ onCancel }) {
  const {
    t,
    currentUser,
    popup,
    detailsState,
    phoneState,
    avatarController,
    emailBinding,
    emailWorkflow,
    isSaving,
    handleSave,
    usernameHandlers,
  } = useProfilePageModel();

  return (
    <ProfileLayout
      t={t}
      currentUser={currentUser}
      popup={popup}
      detailsState={detailsState}
      phoneState={phoneState}
      avatarController={avatarController}
      emailBinding={emailBinding}
      emailWorkflow={emailWorkflow}
      isSaving={isSaving}
      handleSave={handleSave}
      onCancel={onCancel}
      usernameHandlers={usernameHandlers}
    />
  );
}

export default Profile;
