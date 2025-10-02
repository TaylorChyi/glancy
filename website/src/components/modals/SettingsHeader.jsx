/**
 * 背景：
 *  - 偏好设置模态与页面均需展示统一的头像与标题区域，但旧实现散落于页面组件内部。
 * 目的：
 *  - 抽象共享的头部结构，通过组合模式交由外层决定样式与布局。
 * 关键决策与取舍：
 *  - 不在组件内绑定样式，改为接受 classes/props，确保不同容器可复用；放弃硬编码 Avatar 尺寸以便未来适配不同密度界面。
 * 影响范围：
 *  - SettingsModal 与 Preferences 页面头部展示逻辑。
 * 演进与TODO：
 *  - TODO: 后续接入动态状态（例如团队信息）时可扩展 props 或插槽。
 */
import PropTypes from "prop-types";
import Avatar from "@/components/ui/Avatar";

const composeClassName = (...parts) => parts.filter(Boolean).join(" ");

function SettingsHeader({
  headingId,
  descriptionId,
  title,
  description,
  planLabel,
  avatarProps,
  classes,
}) {
  const { className: avatarClassName, ...avatarRest } = avatarProps ?? {};
  const containerClassName = classes?.container ?? "";
  const identityClassName = classes?.identity ?? "";
  const identityCopyClassName = classes?.identityCopy ?? "";
  const planClassName = classes?.plan ?? "";
  const titleClassName = classes?.title ?? "";
  const descriptionClassName = classes?.description ?? "";
  const avatarWrapperClassName = classes?.avatar ?? "";

  return (
    <header className={containerClassName}>
      <div className={identityClassName}>
        <Avatar
          {...avatarRest}
          className={composeClassName(avatarWrapperClassName, avatarClassName)}
        />
        <div className={identityCopyClassName}>
          {planLabel ? <p className={planClassName}>{planLabel}</p> : null}
          <h2 id={headingId} className={titleClassName}>
            {title}
          </h2>
        </div>
      </div>
      {description ? (
        <p id={descriptionId} className={descriptionClassName}>
          {description}
        </p>
      ) : null}
    </header>
  );
}

SettingsHeader.propTypes = {
  headingId: PropTypes.string.isRequired,
  descriptionId: PropTypes.string,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  planLabel: PropTypes.string,
  avatarProps: PropTypes.shape({
    className: PropTypes.string,
    width: PropTypes.number,
    height: PropTypes.number,
  }),
  classes: PropTypes.shape({
    container: PropTypes.string,
    identity: PropTypes.string,
    identityCopy: PropTypes.string,
    avatar: PropTypes.string,
    plan: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
  }),
};

SettingsHeader.defaultProps = {
  descriptionId: undefined,
  description: "",
  planLabel: "",
  avatarProps: undefined,
  classes: undefined,
};

export default SettingsHeader;

