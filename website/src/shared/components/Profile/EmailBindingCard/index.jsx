/**
 * 背景：
 *  - EmailBindingCard 曾同时承载状态、副作用与渲染逻辑，文件体量超限被临时加入 lint 豁免名单。
 * 目的：
 *  - 通过“控制器 Hook + 视图组件”组合拆分职责，使文件满足结构化规则并提升可测试性。
 * 关键决策与取舍：
 *  - 采用 MVVM 模式：useEmailBindingController 产出视图模型，EmailBindingCardView 专注渲染；
 *  - 保留 PropTypes 声明以兼容现有调用方，未来可迁移至 TypeScript 类型系统。
 * 影响范围：
 *  - Profile 页面邮箱绑定卡片及其单测；
 *  - ESLint 结构化规则允许列表，可移除对该文件的例外。
 * 演进与TODO：
 *  - 若后续需要引入多语言占位符或 A/B 实验，可在视图模型中追加特性开关字段。
 */
import PropTypes from "prop-types";
import useEmailBindingController from "./useEmailBindingController.js";
import EmailBindingCardView from "./EmailBindingCardView.jsx";

function EmailBindingCard(props) {
  const viewModel = useEmailBindingController(props);
  return <EmailBindingCardView {...viewModel} />;
}

EmailBindingCard.propTypes = {
  email: PropTypes.string,
  mode: PropTypes.string.isRequired,
  isSendingCode: PropTypes.bool,
  isVerifying: PropTypes.bool,
  isUnbinding: PropTypes.bool,
  isAwaitingVerification: PropTypes.bool,
  requestedEmail: PropTypes.string,
  onStart: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onRequestCode: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onUnbind: PropTypes.func.isRequired,
  t: PropTypes.shape({
    emailBindingTitle: PropTypes.string.isRequired,
    emailBoundDescription: PropTypes.string.isRequired,
    emailUnboundDescription: PropTypes.string.isRequired,
    emailStatusBound: PropTypes.string.isRequired,
    emailStatusUnbound: PropTypes.string.isRequired,
    emailInputLabel: PropTypes.string.isRequired,
    emailInputPlaceholder: PropTypes.string.isRequired,
    emailCodeLabel: PropTypes.string.isRequired,
    emailCodePlaceholder: PropTypes.string.isRequired,
    emailSendCode: PropTypes.string.isRequired,
    emailSendingCode: PropTypes.string.isRequired,
    emailVerifying: PropTypes.string.isRequired,
    emailConfirmBind: PropTypes.string.isRequired,
    emailConfirmChange: PropTypes.string.isRequired,
    emailCancel: PropTypes.string.isRequired,
    emailCurrentLabel: PropTypes.string.isRequired,
    emailEmptyValue: PropTypes.string.isRequired,
    emailChangeAction: PropTypes.string.isRequired,
    emailBindAction: PropTypes.string.isRequired,
    emailUnbindAction: PropTypes.string.isRequired,
    emailUnbinding: PropTypes.string.isRequired,
    emailVerificationIntro: PropTypes.string.isRequired,
    emailAwaitingCode: PropTypes.string.isRequired,
    emailVerificationPending: PropTypes.string.isRequired,
    emailVerificationMismatch: PropTypes.string.isRequired,
    emailStepInput: PropTypes.string.isRequired,
    emailStepVerify: PropTypes.string.isRequired,
  }).isRequired,
};

EmailBindingCard.defaultProps = {
  email: "",
  isSendingCode: false,
  isVerifying: false,
  isUnbinding: false,
  isAwaitingVerification: false,
  requestedEmail: "",
};

export default EmailBindingCard;
