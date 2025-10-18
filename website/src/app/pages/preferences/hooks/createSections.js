/**
 * 背景：
 *  - 分区数组的构建逻辑原本嵌入在主 Hook 中，字段、组件与文案交织，
 *    使得小幅调整都需要修改大段代码。
 * 目的：
 *  - 将分区装配抽象为纯函数，根据输入元数据生成统一结构，
 *    便于未来进行懒加载或特性开关控制。
 * 关键决策与取舍：
 *  - 输出稳定的 Section Blueprint（id/label/Component/componentProps/icon），
 *    页面和模态均可直接消费；
 *  - 使用策略式的 icon registry，避免组件内硬编码 icon 名称。
 * 影响范围：
 *  - 偏好设置页面以及共享的 SettingsModal。
 * 演进与TODO：
 *  - 后续可在此根据用户权限过滤分区，或注入排序策略。
 */
import AccountSection from "../sections/AccountSection.jsx";
import DataSection from "../sections/DataSection.jsx";
import GeneralSection from "../sections/GeneralSection.jsx";
import KeyboardSection from "../sections/KeyboardSection.jsx";
import ResponseStyleSection from "../sections/ResponseStyleSection.jsx";
import SubscriptionSection from "../sections/SubscriptionSection.jsx";
import { SECTION_ICON_REGISTRY } from "./constants.js";
import { pickFirstMeaningfulString } from "./utils/displayValues.js";

const createGeneralSection = (translations) => {
  const label = translations.settingsTabGeneral ?? "General";
  return {
    id: "general",
    label,
    disabled: false,
    Component: GeneralSection,
    componentProps: { title: label },
    icon: SECTION_ICON_REGISTRY.general,
  };
};

const createResponseStyleSection = ({
  translations,
  responseStyleState,
  responseStyleCopy,
  responseStyleHandlers,
}) => {
  const label = translations.settingsTabPersonalization ?? "Response style";
  return {
    id: "responseStyle",
    label,
    disabled: false,
    Component: ResponseStyleSection,
    componentProps: {
      title: label,
      state: responseStyleState,
      copy: responseStyleCopy,
      onRetry: responseStyleHandlers.onRetry,
      onFieldChange: responseStyleHandlers.onFieldChange,
      onFieldCommit: responseStyleHandlers.onFieldCommit,
    },
    icon: SECTION_ICON_REGISTRY.responseStyle,
  };
};

const createDataSection = (translations) => {
  const label = translations.settingsTabData ?? "Data controls";
  const summary =
    translations.settingsDataDescription ??
    "Manage how Glancy stores and purges your historical traces.";
  const message = pickFirstMeaningfulString(
    [translations.settingsDataNotice, translations.settingsDataDescription],
    summary,
  );
  return {
    id: "data",
    label,
    disabled: false,
    Component: DataSection,
    componentProps: { title: label, message },
    icon: SECTION_ICON_REGISTRY.data,
  };
};

const createKeyboardSection = (translations) => {
  const label = translations.settingsTabKeyboard ?? "Keyboard shortcuts";
  return {
    id: "keyboard",
    label,
    disabled: false,
    Component: KeyboardSection,
    componentProps: { title: label },
    icon: SECTION_ICON_REGISTRY.keyboard,
  };
};

const createAccountSection = ({ translations, accountModel }) => {
  const label =
    translations.prefAccountTitle ?? translations.settingsTabAccount ?? "Account";
  return {
    id: "account",
    label,
    disabled: false,
    Component: AccountSection,
    componentProps: {
      title: label,
      fields: accountModel.fields,
      identity: accountModel.identity,
      bindings: accountModel.bindings,
    },
    icon: SECTION_ICON_REGISTRY.account,
  };
};

const createSubscriptionSection = (subscriptionSection) => ({
  id: "subscription",
  label: subscriptionSection.title,
  disabled: false,
  Component: SubscriptionSection,
  componentProps: subscriptionSection,
  icon: SECTION_ICON_REGISTRY.subscription,
});

export const createSections = ({
  translations,
  responseStyleState,
  responseStyleCopy,
  responseStyleHandlers,
  accountModel,
  subscriptionSection,
}) => [
  createGeneralSection(translations),
  createResponseStyleSection({
    translations,
    responseStyleState,
    responseStyleCopy,
    responseStyleHandlers,
  }),
  createDataSection(translations),
  createKeyboardSection(translations),
  createAccountSection({ translations, accountModel }),
  createSubscriptionSection(subscriptionSection),
];
