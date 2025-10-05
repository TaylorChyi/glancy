/**
 * 背景：
 *  - Preferences 先前将数据获取、标签编排与展示布局耦合在单一组件中，导致模态与页面难以复用。
 * 目的：
 *  - 抽离复合逻辑为可复用的 hook，集中维护分区元数据、状态与副作用，便于 SettingsModal 与页面共享。
 * 关键决策与取舍：
 *  - 采用组合 + 策略模式：hook 返回 Section 组件与其属性，调用方按需决定排布；拒绝简单对象返回，确保后续扩展编辑态或异步加载时具备足够语义空间。
 * 影响范围：
 *  - 偏好设置模态与页面的导航、状态切换、文案均改由本 hook 驱动。
 * 演进与TODO：
 *  - TODO: 当新增分区或引入懒加载时，可在此处扩展蓝图数组或接入数据缓存策略。
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLanguage, useUser } from "@/context";
import AccountSection from "./sections/AccountSection.jsx";
import DataSection from "./sections/DataSection.jsx";
import GeneralSection from "./sections/GeneralSection.jsx";
import KeyboardSection from "./sections/KeyboardSection.jsx";
import PersonalizationSection from "./sections/PersonalizationSection.jsx";
import SubscriptionSection from "./sections/SubscriptionSection.jsx";
import { buildSubscriptionSectionProps } from "./sections/subscriptionBlueprint.js";
import useAvatarUploader from "@/hooks/useAvatarUploader.js";

const FALLBACK_MODAL_HEADING_ID = "settings-modal-fallback-heading";

const sanitizeActiveSectionId = (candidateId, sections) => {
  if (!sections || sections.length === 0) {
    return "";
  }
  const fallback = sections.find((section) => !section.disabled) ?? sections[0];
  if (!candidateId) {
    return fallback.id;
  }
  const matched = sections.find(
    (section) => section.id === candidateId && !section.disabled,
  );
  return matched ? matched.id : fallback.id;
};

const mapToDisplayValue = (candidate, fallbackValue) => {
  if (candidate === null || candidate === undefined) {
    return fallbackValue;
  }
  if (typeof candidate === "string" && candidate.trim().length === 0) {
    return fallbackValue;
  }
  return String(candidate);
};

const pickFirstMeaningfulString = (candidates, fallbackValue = "") => {
  for (const candidate of candidates) {
    if (typeof candidate !== "string") {
      continue;
    }
    const trimmed = candidate.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }
  return typeof fallbackValue === "string" ? fallbackValue.trim() : "";
};

/**
 * 意图：
 *  - 统一手机号的国际区号展示策略，保证偏好设置与后续账户模块风格一致。
 * 输入：
 *  - rawPhone: 原始手机号字符串，可能包含空格或分隔符；
 *  - fallbackValue: 当手机号缺失时展示的占位文案；
 *  - defaultCode: 缺失国际区号时自动补全的默认区号。
 * 输出：
 *  - 形如“+86 13800000000”的字符串或占位文案。
 * 流程：
 *  1) 若缺失手机号直接返回占位；
 *  2) 若存在国际区号，提取首段 `+` 开头的数字；
 *  3) 去除区号后的分隔符，仅保留数字并保留一个空格分隔。
 * 错误处理：
 *  - 输入非字符串或无法解析时回退到占位或原值。
 */
const formatPhoneDisplay = (
  rawPhone,
  { fallbackValue, defaultCode = "+86" } = {},
) => {
  const normalized = mapToDisplayValue(rawPhone, fallbackValue);
  if (normalized === fallbackValue) {
    return fallbackValue;
  }

  if (typeof normalized !== "string") {
    return normalized;
  }

  const trimmed = normalized.trim();
  if (trimmed.length === 0) {
    return fallbackValue;
  }

  const withCode = trimmed.startsWith("+")
    ? trimmed
    : `${defaultCode} ${trimmed.replace(/\s+/g, " ").trim()}`;

  const match = withCode.match(/^(\+\d{1,4})([\s-]?)(.*)$/);
  if (!match) {
    return withCode;
  }

  const [, code, , numberPart] = match;
  const digits = numberPart.replace(/[^0-9]/g, "");
  if (!digits) {
    return code;
  }
  return `${code} ${digits}`;
};

/**
 * 意图：
 *  - 生成偏好设置分区蓝图，统一管理激活分区、表头文案与账户数据。
 * 输入：
 *  - initialSectionId: 初始分区标识。
 * 输出：
 *  - 包含文案、分区数组、激活态控制与表单守卫的组合对象。
 * 流程：
 *  1) 汇总用户上下文与翻译词条并构造账户字段、头像与绑定占位信息。
 *  2) 结合国际化词条组装分区蓝本。
 *  3) 管理激活分区的受控状态并暴露切换方法。
 * 错误处理：
 *  - 当前仅依赖本地状态，若上下文缺失则自动回退至占位文案。
 * 复杂度：
 *  - 时间：O(n) 取决于分区数量；空间：O(1) 额外状态。
 */
function usePreferenceSections({ initialSectionId }) {
  const { t } = useLanguage();
  const userStore = useUser();
  const { user } = userStore ?? {};
  const { onSelectAvatar, isUploading: isAvatarUploading } =
    useAvatarUploader();

  const headingId = "settings-heading";
  const description = t.prefDescription ?? "";
  const hasDescription = Boolean(description && description.trim());
  const descriptionId = hasDescription ? "settings-description" : undefined;
  const fallbackValue = t.settingsEmptyValue ?? "—";
  const tablistLabel = t.prefTablistLabel ?? "Preference sections";
  const closeLabel = t.close ?? "Close";
  const modalTitle = t.prefTitle ?? "Preferences";

  const planLabel = useMemo(() => {
    if (!user) {
      return "";
    }
    const candidate =
      (typeof user.plan === "string" && user.plan.trim()) ||
      (user.isPro ? "plus" : "");
    if (!candidate) {
      return "";
    }
    const normalized = candidate.trim();
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }, [user]);

  const changeAvatarLabel = t.changeAvatar ?? "Change avatar";
  const accountBindingsTitle =
    t.settingsAccountBindingTitle ?? "Connected accounts";
  const accountBindingStatus =
    t.settingsAccountBindingStatusUnlinked ?? "Not linked";
  const accountBindingActionLabel =
    t.settingsAccountBindingActionPlaceholder ?? "Coming soon";

  const subscriptionSection = useMemo(
    () =>
      buildSubscriptionSectionProps({
        translations: t,
        user,
      }),
    [t, user],
  );

  const sections = useMemo(() => {
    const generalLabel = t.settingsTabGeneral ?? "General";

    const personalizationLabel =
      t.settingsTabPersonalization ?? "Personalization";
    const personalizationSummary =
      t.settingsPersonalizationDescription ??
      "Describe your background so answers feel bespoke.";
    const personalizationMessage = pickFirstMeaningfulString(
      [t.settingsPersonalizationDescription, t.prefPersonalizationTitle],
      personalizationSummary,
    );

    const dataLabel = t.settingsTabData ?? "Data controls";
    const dataSummary =
      t.settingsDataDescription ??
      "Manage how Glancy stores and purges your historical traces.";
    const dataMessage = pickFirstMeaningfulString(
      [t.settingsDataNotice, t.settingsDataDescription],
      dataSummary,
    );

    const keyboardLabel = t.settingsTabKeyboard ?? "Keyboard shortcuts";
    // 键盘分区根据最新交互规范仅暴露标题，摘要信息交由上下文提示（hint）呈现。

    const accountLabel =
      t.prefAccountTitle ?? t.settingsTabAccount ?? "Account";
    const manageProfileAction = {
      id: "manage-profile",
      label: t.settingsManageProfile ?? "Manage profile",
      disabled: true,
    };
    const emailUnbindAction = {
      id: "unbind-email",
      label:
        t.settingsAccountEmailUnbindAction ??
        t.settingsAccountEmailUnbind ??
        "Unbind email",
      disabled: true,
    };
    const phoneRebindAction = {
      id: "rebind-phone",
      label: t.settingsAccountPhoneRebindAction ?? "Change phone",
      disabled: true,
    };

    const usernameValue = mapToDisplayValue(user?.username, fallbackValue);
    const emailValue = mapToDisplayValue(user?.email, fallbackValue);
    const phoneValue = formatPhoneDisplay(user?.phone, {
      fallbackValue,
      defaultCode: t.settingsAccountDefaultPhoneCode ?? "+86",
    });

    const accountFields = [
      {
        id: "username",
        label: t.settingsAccountUsername ?? "Username",
        value: usernameValue,
        action: manageProfileAction,
      },
      {
        id: "email",
        label: t.settingsAccountEmail ?? "Email",
        value: emailValue,
        action: emailUnbindAction,
      },
      {
        id: "phone",
        label: t.settingsAccountPhone ?? "Phone",
        value: phoneValue,
        action: phoneRebindAction,
      },
    ];

    const accountIdentity = {
      label: t.settingsAccountAvatarLabel ?? "Avatar",
      displayName: usernameValue,
      changeLabel: changeAvatarLabel,
      avatarAlt: accountLabel,
      onSelectAvatar,
      isUploading: isAvatarUploading,
    };

    const accountBindings = {
      title: accountBindingsTitle,
      items: [
        {
          id: "apple",
          name: t.settingsAccountBindingApple ?? "Apple",
          status: accountBindingStatus,
          actionLabel: accountBindingActionLabel,
        },
        {
          id: "google",
          name: t.settingsAccountBindingGoogle ?? "Google",
          status: accountBindingStatus,
          actionLabel: accountBindingActionLabel,
        },
        {
          id: "wechat",
          name: t.settingsAccountBindingWeChat ?? "WeChat",
          status: accountBindingStatus,
          actionLabel: accountBindingActionLabel,
        },
      ],
    };

    //
    // 导航标签仅展示主标题，摘要内容由具体面板负责渲染，避免屏幕阅读器重复朗读。
    return [
      {
        id: "general",
        label: generalLabel,
        disabled: false,
        Component: GeneralSection,
        componentProps: {
          title: generalLabel,
        },
      },
      {
        id: "personalization",
        label: personalizationLabel,
        disabled: false,
        Component: PersonalizationSection,
        componentProps: {
          title: personalizationLabel,
          message: personalizationMessage,
        },
      },
      {
        id: "data",
        label: dataLabel,
        disabled: false,
        Component: DataSection,
        componentProps: {
          title: dataLabel,
          message: dataMessage,
        },
      },
      {
        id: "keyboard",
        label: keyboardLabel,
        disabled: false,
        Component: KeyboardSection,
        componentProps: {
          title: keyboardLabel,
        },
      },
      {
        id: "account",
        label: accountLabel,
        disabled: false,
        Component: AccountSection,
        componentProps: {
          title: accountLabel,
          fields: accountFields,
          identity: accountIdentity,
          bindings: accountBindings,
        },
      },
      {
        id: "subscription",
        label: subscriptionSection.title,
        disabled: false,
        Component: SubscriptionSection,
        componentProps: subscriptionSection,
      },
    ];
  }, [
    accountBindingActionLabel,
    accountBindingStatus,
    accountBindingsTitle,
    t.settingsAccountAvatarLabel,
    t.settingsAccountDefaultPhoneCode,
    t.settingsAccountEmailUnbind,
    t.settingsAccountEmailUnbindAction,
    t.settingsAccountPhoneRebindAction,
    t.settingsManageProfile,
    changeAvatarLabel,
    fallbackValue,
    t.prefAccountTitle,
    t.prefPersonalizationTitle,
    t.settingsAccountBindingApple,
    t.settingsAccountBindingGoogle,
    t.settingsAccountBindingWeChat,
    t.settingsAccountEmail,
    t.settingsAccountPhone,
    t.settingsAccountUsername,
    t.settingsDataDescription,
    t.settingsDataNotice,
    t.settingsPersonalizationDescription,
    t.settingsTabAccount,
    t.settingsTabData,
    t.settingsTabGeneral,
    t.settingsTabKeyboard,
    t.settingsTabPersonalization,
    subscriptionSection,
    onSelectAvatar,
    isAvatarUploading,
    user?.email,
    user?.phone,
    user?.username,
  ]);

  const [activeSectionId, setActiveSectionId] = useState(() =>
    sanitizeActiveSectionId(initialSectionId, sections),
  );
  const hasAppliedInitialRef = useRef(false);
  const previousInitialRef = useRef(initialSectionId);
  const previousSanitizedInitialRef = useRef(
    sanitizeActiveSectionId(initialSectionId, sections),
  );

  useEffect(() => {
    setActiveSectionId((current) => {
      const sanitized = sanitizeActiveSectionId(current, sections);
      return sanitized === current ? current : sanitized;
    });
  }, [sections]);

  useEffect(() => {
    const nextInitial = sanitizeActiveSectionId(initialSectionId, sections);
    const initialChanged = previousInitialRef.current !== initialSectionId;
    const sanitizedChanged =
      previousSanitizedInitialRef.current !== nextInitial;
    const shouldSync =
      !hasAppliedInitialRef.current || initialChanged || sanitizedChanged;

    if (!shouldSync) {
      return undefined;
    }

    hasAppliedInitialRef.current = true;
    previousInitialRef.current = initialSectionId;
    previousSanitizedInitialRef.current = nextInitial;

    setActiveSectionId((current) =>
      current === nextInitial ? current : nextInitial,
    );

    return undefined;
  }, [initialSectionId, sections]);

  const activeSection = useMemo(
    () =>
      sections.find((section) => section.id === activeSectionId) ?? sections[0],
    [activeSectionId, sections],
  );

  const handleSectionSelect = useCallback((section) => {
    if (!section || section.disabled) {
      return;
    }
    setActiveSectionId((current) =>
      current === section.id ? current : section.id,
    );
  }, []);

  const handleSubmit = useCallback((event) => {
    if (event && typeof event.preventDefault === "function") {
      event.preventDefault();
    }
  }, []);

  const panelId = activeSection ? `${activeSection.id}-panel` : "";
  const tabId = activeSection ? `${activeSection.id}-tab` : "";
  const panelHeadingId = activeSection
    ? `${activeSection.id}-section-heading`
    : "";
  const shouldExposePanelDescription = Boolean(
    activeSection &&
      typeof activeSection.componentProps?.message === "string" &&
      activeSection.componentProps.message.trim().length > 0,
  );
  const panelDescriptionId = shouldExposePanelDescription
    ? `${activeSection.id}-section-description`
    : undefined;

  const resolvedModalHeadingText = pickFirstMeaningfulString(
    [activeSection?.componentProps?.title, activeSection?.label],
    modalTitle,
  );
  const focusHeadingId = panelHeadingId || FALLBACK_MODAL_HEADING_ID;

  return {
    copy: {
      title: modalTitle,
      description,
      tablistLabel,
      closeLabel,
    },
    header: {
      headingId,
      descriptionId,
      planLabel,
    },
    sections,
    activeSection,
    activeSectionId,
    handleSectionSelect,
    handleSubmit,
    panel: {
      panelId,
      tabId,
      headingId: panelHeadingId,
      descriptionId: panelDescriptionId,
      focusHeadingId,
      modalHeadingId: FALLBACK_MODAL_HEADING_ID,
      modalHeadingText: resolvedModalHeadingText,
    },
  };
}

export default usePreferenceSections;
