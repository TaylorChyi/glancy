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
import useSubscriptionPlans from "@/hooks/useSubscriptionPlans.js";

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

const normalizePlanId = (user) => {
  if (!user) {
    return "free";
  }
  if (typeof user.plan === "string" && user.plan.trim().length > 0) {
    return user.plan.trim().toLowerCase();
  }
  if (user.isPro) {
    return "plus";
  }
  return "free";
};

const formatCurrencyValue = (value, region) => {
  if (value === undefined || value === null || value === "") {
    return "";
  }
  const numeric = Number.parseFloat(String(value).replace(/,/g, ""));
  if (Number.isNaN(numeric)) {
    return String(value);
  }
  const currency = region?.currency ?? "USD";
  const hasDecimals = Math.abs(numeric % 1) > Number.EPSILON;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      currencyDisplay: "symbol",
      minimumFractionDigits: hasDecimals ? 2 : 0,
      maximumFractionDigits: 2,
    }).format(numeric);
  } catch (error) {
    const symbol = region?.currencySymbol ?? "";
    const formatted = hasDecimals ? numeric.toFixed(2) : numeric.toString();
    return `${symbol}${formatted}`;
  }
};

const formatNextRenewal = (value, fallback) => {
  if (!value) {
    return fallback;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return fallback;
  }
  return date.toLocaleDateString();
};

const noop = () => {};

/**
 * 意图：
 *  - 生成偏好设置分区蓝图，统一管理激活分区、表头文案与账户数据。
 * 输入：
 *  - initialSectionId: 初始分区标识。
 *  - onOpenAccountManager: 打开账户管理模态的回调。
 * 输出：
 *  - 包含文案、分区数组、激活态控制与表单守卫的组合对象。
 * 流程：
 *  1) 汇总用户上下文与翻译词条并构造账户字段。
 *  2) 结合国际化词条组装分区蓝本。
 *  3) 管理激活分区的受控状态并暴露切换方法。
 * 错误处理：
 *  - 当前仅依赖本地状态，若上下文缺失则自动回退至占位文案。
 * 复杂度：
 *  - 时间：O(n) 取决于分区数量；空间：O(1) 额外状态。
 */
function usePreferenceSections({ initialSectionId, onOpenAccountManager }) {
  const { t } = useLanguage();
  const { user } = useUser();

  const currentPlanId = useMemo(() => normalizePlanId(user), [user]);
  const subscriptionRegionCode = useMemo(() => {
    if (user?.subscription && typeof user.subscription.regionCode === "string") {
      return user.subscription.regionCode;
    }
    if (typeof user?.regionCode === "string") {
      return user.regionCode;
    }
    return undefined;
  }, [user?.regionCode, user?.subscription]);

  const subscriptionBlueprint = useSubscriptionPlans({
    regionCode: subscriptionRegionCode,
    currentPlanId,
  });

  const translate = useCallback(
    (key) => {
      if (!key) {
        return "";
      }
      return t[key] ?? key;
    },
    [t],
  );

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

  const subscriptionPlans = useMemo(() => {
    return subscriptionBlueprint.plans.map((plan) => {
      const title = translate(plan.labelKey);
      const descriptionCopy = translate(plan.descriptionKey);
      let pricePrimary = "";
      let priceSecondary = "";

      if (plan.purchaseType === "free") {
        pricePrimary = translate("subscription.price.free");
      } else if (plan.purchaseType === "redeem_only") {
        pricePrimary = translate("subscription.price.redeemOnly");
        if (plan.id === "premium" && user?.subscription?.expiresAt) {
          const expiry = formatNextRenewal(
            user.subscription.expiresAt,
            translate("subscription.premium.perpetual"),
          );
          priceSecondary = translate("subscription.price.premiumExpiry").replace(
            "{date}",
            expiry,
          );
        }
      } else {
        const monthlyFormatted = formatCurrencyValue(
          plan.monthly,
          subscriptionBlueprint.region,
        );
        const yearlyFormatted = formatCurrencyValue(
          plan.yearly,
          subscriptionBlueprint.region,
        );
        const yearlyEquivalentFormatted = formatCurrencyValue(
          plan.yearlyEquivalent,
          subscriptionBlueprint.region,
        );

        if (monthlyFormatted) {
          pricePrimary = (translate("subscription.price.perMonth") ?? "{value}").replace(
            "{value}",
            monthlyFormatted,
          );
        }
        if (yearlyFormatted) {
          const yearlyCopy = (translate("subscription.price.perYear") ?? "{value}").replace(
            "{value}",
            yearlyFormatted,
          );
          if (yearlyEquivalentFormatted) {
            const equivalentCopy = (
              translate("subscription.price.perYearEquivalent") ?? "{value}"
            ).replace("{value}", yearlyEquivalentFormatted);
            priceSecondary = `${yearlyCopy} ${equivalentCopy}`.trim();
          } else {
            priceSecondary = yearlyCopy;
          }
        }
      }

      if (!pricePrimary && priceSecondary) {
        pricePrimary = priceSecondary;
        priceSecondary = "";
      }

      if (!pricePrimary) {
        pricePrimary = translate("subscription.price.pending");
      }

      return {
        id: plan.id,
        title,
        shortTitle: title,
        description: descriptionCopy,
        pricePrimary,
        priceSecondary,
      };
    });
  }, [
    subscriptionBlueprint.plans,
    subscriptionBlueprint.region,
    translate,
    user?.subscription?.expiresAt,
  ]);

  const subscriptionFeatures = useMemo(() => {
    const planIds = subscriptionPlans.map((plan) => plan.id);
    return subscriptionBlueprint.featureMatrix.map((feature) => {
      const label = translate(feature.labelKey);
      const values = {};
      const unitSuffixes = {};

      planIds.forEach((planId) => {
        const rawValue = feature.values[planId];
        if (rawValue === undefined) {
          return;
        }
        values[planId] = rawValue;
        if (
          feature.unitKey &&
          typeof rawValue === "string" &&
          rawValue.trim() !== "" &&
          rawValue.trim() !== "—" &&
          !rawValue.startsWith("subscription.")
        ) {
          const unitLabel = translate(feature.unitKey);
          if (unitLabel && unitLabel !== feature.unitKey) {
            unitSuffixes[planId] = unitLabel;
          }
        }
      });

      return {
        id: feature.id,
        label,
        values,
        unitSuffixes: Object.keys(unitSuffixes).length > 0 ? unitSuffixes : undefined,
      };
    });
  }, [subscriptionBlueprint.featureMatrix, subscriptionPlans, translate]);

  const subscriptionCopy = useMemo(() => {
    const planName =
      subscriptionPlans.find((plan) => plan.id === currentPlanId)?.title ??
      translate("plan.free.title");
    const billingCycleKey = user?.subscription?.billingCycle
      ? `subscription.billingCycle.${user.subscription.billingCycle}`
      : "subscription.billingCycle.none";
    const billingCycleLabel = translate(billingCycleKey);
    const nextRenewal = formatNextRenewal(
      user?.subscription?.nextRenewalDate,
      translate("subscription.current.renewalUnknown"),
    );
    const planLine = (translate("subscription.current.planLine") ?? "{plan}")
      .replace("{plan}", planName)
      .replace("{cycle}", billingCycleLabel);
    const billingLine = (translate("subscription.current.nextRenewal") ?? "{date}")
      .replace("{date}", nextRenewal);
    const regionLabel =
      subscriptionBlueprint.region.regionLabel ||
      translate("subscription.current.regionUnknown");
    const currencyLabel =
      subscriptionBlueprint.region.currency ||
      translate("subscription.current.currencyUnknown");
    const regionLine = (
      translate("subscription.current.regionCurrency") ?? "{region}"
    )
      .replace("{region}", regionLabel)
      .replace("{currency}", currencyLabel);

    let statusLine = "";
    if (currentPlanId === "premium") {
      const expiry = formatNextRenewal(
        user?.subscription?.expiresAt,
        translate("subscription.premium.perpetual"),
      );
      statusLine = (
        translate("subscription.premium.status") ?? "{date}"
      ).replace("{date}", expiry);
    }

    const actions = [
      { id: "manage", label: translate("subscription.action.manage"), onClick: noop },
      { id: "change-plan", label: translate("subscription.action.changePlan"), onClick: noop },
      {
        id: "change-region",
        label: translate("subscription.action.changeRegion"),
        onClick: noop,
      },
    ];

    if (currentPlanId !== "premium") {
      actions.push({
        id: "redeem",
        label: translate("subscription.action.redeem"),
        onClick: noop,
      });
    }

    const faqItems = [
      {
        id: "pricing",
        text: translate(subscriptionBlueprint.policyCopy.pricingNoteKey),
      },
      {
        id: "tax",
        text: translate(
          subscriptionBlueprint.region.taxIncluded
            ? subscriptionBlueprint.policyCopy.taxIncludedKey
            : subscriptionBlueprint.policyCopy.taxExcludedKey,
        ),
      },
      { id: "auto-renew", text: translate(subscriptionBlueprint.policyCopy.autoRenewKey) },
      { id: "invoice", text: translate(subscriptionBlueprint.policyCopy.invoiceKey) },
      {
        id: "refund",
        text: (translate(subscriptionBlueprint.policyCopy.refundKey) ?? "{days}").replace(
          "{days}",
          String(subscriptionBlueprint.region.policies?.refundWindowDays ?? "—"),
        ),
      },
      { id: "support", text: translate(subscriptionBlueprint.policyCopy.supportKey) },
    ].filter((item) => typeof item.text === "string" && item.text.trim().length > 0);

    return {
      currentPlanTitle: translate("subscription.current.title"),
      planLine,
      billingLine,
      regionLine,
      statusLine,
      badges: {
        current: translate("subscription.badge.current"),
        selected: translate("subscription.badge.selected"),
      },
      actions,
      matrixCaption: translate("subscription.matrix.caption"),
      featureHeading: translate("subscription.matrix.feature"),
      translate,
      redeem: {
        title: translate("subscription.redeem.title"),
        description: translate("subscription.redeem.description"),
        placeholder: translate("subscription.redeem.placeholder"),
        button: translate("subscription.redeem.button"),
      },
      subscribe: {
        title: translate("subscription.subscribe.title"),
        description: translate("subscription.subscribe.description"),
        button: translate("subscription.subscribe.button"),
        disabledHint: translate("subscription.subscribe.disabled"),
      },
      faqTitle: translate("subscription.faq.title"),
      faqItems,
    };
  }, [
    currentPlanId,
    subscriptionBlueprint.policyCopy,
    subscriptionBlueprint.region,
    subscriptionPlans,
    translate,
    user?.subscription,
  ]);

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
    const keyboardSummary =
      t.settingsKeyboardDescription ??
      "Master Glancy with a curated set of command keys.";
    const keyboardMessage = pickFirstMeaningfulString(
      [t.settingsKeyboardDescription, t.prefKeyboardTitle],
      keyboardSummary,
    );

    const subscriptionLabel =
      t.settingsTabSubscription ?? translate("subscription.section.title");
    const subscriptionDescription = pickFirstMeaningfulString(
      [translate("subscription.section.description")],
      translate("subscription.section.description"),
    );

    const accountLabel =
      t.prefAccountTitle ?? t.settingsTabAccount ?? "Account";
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
        id: "subscription",
        label: subscriptionLabel,
        disabled: false,
        Component: SubscriptionSection,
        componentProps: {
          title: subscriptionLabel,
          description: subscriptionDescription,
          plans: subscriptionPlans,
          featureMatrix: subscriptionFeatures,
          copy: subscriptionCopy,
          currentPlanId,
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
    subscriptionCopy,
    subscriptionFeatures,
    subscriptionPlans,
    translate,
    currentPlanId,
    t.prefAccountTitle,
    t.prefKeyboardTitle,
    t.prefPersonalizationTitle,
    t.settingsAccountDescription,
    t.settingsAccountEmail,
    t.settingsAccountPhone,
    t.settingsAccountUsername,
    t.settingsDataDescription,
    t.settingsDataNotice,
    t.settingsKeyboardDescription,
    t.settingsPersonalizationDescription,
    t.settingsTabAccount,
    t.settingsTabData,
    t.settingsTabGeneral,
    t.settingsTabKeyboard,
    t.settingsTabPersonalization,
    t.settingsTabSubscription,
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
