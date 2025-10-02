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
import { useApi } from "@/hooks/useApi.js";
import AccountSection from "./sections/AccountSection.jsx";
import DataSection from "./sections/DataSection.jsx";
import GeneralSection from "./sections/GeneralSection.jsx";
import KeyboardSection from "./sections/KeyboardSection.jsx";
import PersonalizationSection from "./sections/PersonalizationSection.jsx";

const EMPTY_PROFILE = Object.freeze({ age: "", gender: "" });
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
 *  - 生成偏好设置分区蓝图，统一管理激活分区、表头文案与账户数据。
 * 输入：
 *  - initialSectionId: 初始分区标识。
 *  - onOpenAccountManager: 打开账户管理模态的回调。
 * 输出：
 *  - 包含文案、分区数组、激活态控制与表单守卫的组合对象。
 * 流程：
 *  1) 拉取 profile 元数据，构造账户字段。
 *  2) 结合国际化词条组装分区蓝本。
 *  3) 管理激活分区的受控状态并暴露切换方法。
 * 错误处理：
 *  - 数据拉取失败时重置 profileMeta 并输出 console.warn，确保回退文案生效。
 * 复杂度：
 *  - 时间：O(n) 取决于分区数量；空间：O(1) 额外状态。当前瓶颈在接口请求而非本地计算。
 */
function usePreferenceSections({ initialSectionId, onOpenAccountManager }) {
  const { t } = useLanguage();
  const { user } = useUser();
  const api = useApi();
  const fetchProfile = api?.profiles?.fetchProfile;
  const [profileMeta, setProfileMeta] = useState(EMPTY_PROFILE);

  useEffect(() => {
    if (!user?.token || !fetchProfile) {
      setProfileMeta((previous) => {
        if (previous.age === "" && previous.gender === "") {
          return previous;
        }
        return EMPTY_PROFILE;
      });
      return undefined;
    }

    let mounted = true;

    fetchProfile({ token: user.token })
      .then((profile) => {
        if (!mounted) {
          return;
        }
        setProfileMeta({
          age:
            profile?.age === null ||
            profile?.age === undefined ||
            profile?.age === ""
              ? ""
              : String(profile.age),
          gender:
            profile?.gender === null ||
            profile?.gender === undefined ||
            profile?.gender === ""
              ? ""
              : String(profile.gender),
        });
      })
      .catch((error) => {
        console.warn("[preferences] Failed to load profile meta", error);
        if (!mounted) {
          return;
        }
        setProfileMeta((previous) => {
          if (previous.age === "" && previous.gender === "") {
            return previous;
          }
          return EMPTY_PROFILE;
        });
      });

    return () => {
      mounted = false;
    };
  }, [fetchProfile, user?.token]);

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

  const canManageProfile = useMemo(
    () => Boolean(user && typeof onOpenAccountManager === "function"),
    [onOpenAccountManager, user],
  );

  const manageLabel = t.settingsManageProfile ?? "Manage profile";

  const sections = useMemo(() => {
    const generalLabel = t.settingsTabGeneral ?? "General";
    const generalSummary =
      t.settingsGeneralDescription ??
      "Tune interface languages, theme, and pronunciation defaults.";
    const generalMessage = pickFirstMeaningfulString(
      [t.prefDefaultsDescription, t.prefInterfaceDescription, generalSummary],
      generalSummary,
    );

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

    const keyboardLabel =
      t.settingsTabKeyboard ?? "Keyboard shortcuts";
    const keyboardSummary =
      t.settingsKeyboardDescription ??
      "Master Glancy with a curated set of command keys.";
    const keyboardMessage = pickFirstMeaningfulString(
      [t.settingsKeyboardDescription, t.prefKeyboardTitle],
      keyboardSummary,
    );

    const accountLabel = t.prefAccountTitle ?? t.settingsTabAccount ?? "Account";
    const accountDescription = pickFirstMeaningfulString(
      [t.settingsAccountDescription],
      "Review and safeguard the basics that identify you in Glancy.",
    );
    const accountFields = [
      {
        id: "username",
        label: t.settingsAccountUsername ?? "Username",
        value: mapToDisplayValue(user?.username, fallbackValue),
      },
      {
        id: "email",
        label: t.settingsAccountEmail ?? "Email",
        value: mapToDisplayValue(user?.email, fallbackValue),
      },
      {
        id: "phone",
        label: t.settingsAccountPhone ?? "Phone",
        value: mapToDisplayValue(user?.phone, fallbackValue),
      },
      {
        id: "age",
        label: t.settingsAccountAge ?? "Age",
        value: mapToDisplayValue(profileMeta.age, fallbackValue),
      },
      {
        id: "gender",
        label: t.settingsAccountGender ?? "Gender",
        value: mapToDisplayValue(profileMeta.gender, fallbackValue),
      },
    ];

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
          message: generalMessage,
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
          message: keyboardMessage,
        },
      },
      {
        id: "account",
        label: accountLabel,
        disabled: false,
        Component: AccountSection,
        componentProps: {
          title: accountLabel,
          description: accountDescription,
          fields: accountFields,
          manageLabel,
          canManageProfile,
          onOpenAccountManager,
        },
      },
    ];
  }, [
    canManageProfile,
    fallbackValue,
    manageLabel,
    onOpenAccountManager,
    profileMeta.age,
    profileMeta.gender,
    t.prefAccountTitle,
    t.prefDefaultsDescription,
    t.prefInterfaceDescription,
    t.prefKeyboardTitle,
    t.prefPersonalizationTitle,
    t.settingsAccountAge,
    t.settingsAccountDescription,
    t.settingsAccountEmail,
    t.settingsAccountGender,
    t.settingsAccountPhone,
    t.settingsAccountUsername,
    t.settingsDataDescription,
    t.settingsDataNotice,
    t.settingsGeneralDescription,
    t.settingsKeyboardDescription,
    t.settingsPersonalizationDescription,
    t.settingsTabAccount,
    t.settingsTabData,
    t.settingsTabGeneral,
    t.settingsTabKeyboard,
    t.settingsTabPersonalization,
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
    const sanitizedChanged = previousSanitizedInitialRef.current !== nextInitial;
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
    () => sections.find((section) => section.id === activeSectionId) ?? sections[0],
    [activeSectionId, sections],
  );

  const handleSectionSelect = useCallback((section) => {
    if (!section || section.disabled) {
      return;
    }
    setActiveSectionId((current) => (current === section.id ? current : section.id));
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
  const panelDescriptionId = activeSection
    ? `${activeSection.id}-section-description`
    : "";

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

