/**
 * 背景：
 *  - 账号页面的用户名输入仅依赖通用 EditableField，无法区分查看/编辑/保存状态，导致交互缺乏即时校验反馈。
 * 目的：
 *  - 通过显式的状态机管理用户名编辑流程，并提供语义化的错误提示与样式钩子。
 * 关键决策与取舍：
 *  - 采用控制器 Hook 承载状态与副作用，组件聚焦渲染逻辑，满足 lint 迁移后的结构化约束；
 *  - 拒绝直接复用 EditableField，以免污染其它字段逻辑，后续如需扩展可通过策略模式注入更多校验规则。
 * 影响范围：
 *  - Profile 页面用户名编辑交互；
 *  - 用户上下文在用户名更新后同步刷新。
 * 演进与TODO：
 *  - TODO: 后续若引入服务端节流或自动保存，可在状态机中增加 debouncing/remote-validating 分支。
 */
import PropTypes from "prop-types";
import useUsernameEditorController from "./useUsernameEditorController.js";

function UsernameEditor(props) {
  const {
    layout,
    inputProps,
    buttonProps,
    buttonLabel,
    shouldRenderButton,
    errorProps,
  } = useUsernameEditorController(props);

  return (
    <div className={layout.container}>
      <div className={layout.controls}>
        <input {...inputProps} />
        {shouldRenderButton ? (
          <button {...buttonProps}>{buttonLabel}</button>
        ) : null}
      </div>
      {errorProps ? (
        <p className={errorProps.className} id={errorProps.id} role={errorProps.role}>
          {errorProps.message}
        </p>
      ) : null}
    </div>
  );
}

UsernameEditor.propTypes = {
  username: PropTypes.string,
  emptyDisplayValue: PropTypes.string,
  className: PropTypes.string,
  inputClassName: PropTypes.string,
  buttonClassName: PropTypes.string,
  onSubmit: PropTypes.func,
  onSuccess: PropTypes.func,
  onFailure: PropTypes.func,
  renderInlineAction: PropTypes.bool,
  onResolveAction: PropTypes.func,
  t: PropTypes.shape({
    usernamePlaceholder: PropTypes.string.isRequired,
    changeUsernameButton: PropTypes.string.isRequired,
    saveUsernameButton: PropTypes.string.isRequired,
    saving: PropTypes.string.isRequired,
    usernameValidationEmpty: PropTypes.string.isRequired,
    usernameValidationTooShort: PropTypes.string.isRequired,
    usernameValidationTooLong: PropTypes.string.isRequired,
    usernameUpdateFailed: PropTypes.string.isRequired,
  }).isRequired,
};

UsernameEditor.defaultProps = {
  renderInlineAction: true,
  onResolveAction: undefined,
};

export default UsernameEditor;
