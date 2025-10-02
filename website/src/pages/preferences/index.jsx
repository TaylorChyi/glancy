/**
 * 背景：
 *  - 偏好设置面板从单页表单演进到多标签导航，旧实现耦合度高且难以扩展。
 * 目的：
 *  - 通过标签策略化管理不同偏好模块，将展示与数据逻辑拆分，奠定后续扩展基础。
 * 关键决策与取舍：
 *  - 采用“策略模式”维护标签定义：每个标签以组件作为渲染策略，便于未来按需增减模块；相比条件分支，可避免父组件膨胀。
 *  - 保留账户信息拉取逻辑于父组件，向子策略下发纯数据，使请求复用并便于缓存。
 * 影响范围：
 *  - Preferences 页面整体布局、样式与单测结构均更新为多标签形态。
 * 演进与TODO：
 *  - TODO: 当接入更多偏好模块时，仅需扩充 TAB_BLUEPRINTS 并提供对应策略组件。
 */
import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import styles from "./Preferences.module.css";
import { useLanguage, useUser } from "@/context";
import { useApi } from "@/hooks/useApi.js";
import Avatar from "@/components/ui/Avatar";
import AccountPreferencesTab from "./parts/AccountPreferencesTab.jsx";
import PlaceholderTab from "./parts/PlaceholderTab.jsx";

const EMPTY_PROFILE = Object.freeze({ age: "", gender: "" });

const sanitizeActiveTabId = (candidateId, tabs) => {
  if (!tabs || tabs.length === 0) {
    return "";
  }
  const fallbackTab = tabs.find((tab) => !tab.disabled) ?? tabs[0];
  if (!candidateId) {
    return fallbackTab.id;
  }
  const matched = tabs.find((tab) => tab.id === candidateId && !tab.disabled);
  return matched ? matched.id : fallbackTab.id;
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

function Preferences({
  onOpenAccountManager,
  initialTabId,
  renderCloseAction,
}) {
  const { t } = useLanguage();
  const { user } = useUser();
  const api = useApi();
  const fetchProfileApi = api?.profiles?.fetchProfile;
  const [profileMeta, setProfileMeta] = useState(EMPTY_PROFILE);

  useEffect(() => {
    if (!user?.token || !fetchProfileApi) {
      setProfileMeta((previous) => {
        if (previous.age === "" && previous.gender === "") {
          return previous;
        }
        return { age: "", gender: "" };
      });
      return undefined;
    }

    let mounted = true;

    /**
     * 背景：
     *  - Profile 拉取在旧版多标签流程中属于副作用，此处仅保留读取逻辑。
     * 关键取舍：
     *  - 采用布尔标记避免组件卸载后继续 setState，待未来接入 AbortController 时可进一步抽象。
     */
    fetchProfileApi({ token: user.token })
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
          return { age: "", gender: "" };
        });
      });

    return () => {
      mounted = false;
    };
  }, [fetchProfileApi, user?.token]);

  const headingId = "settings-heading";
  const hasDescription = Boolean(t.prefDescription && t.prefDescription.trim());
  const descriptionId = hasDescription ? "settings-description" : undefined;
  const fallbackValue = t.settingsEmptyValue ?? "—";
  const tablistLabel = t.prefTablistLabel ?? "Preference sections";

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

  const closeAction = useMemo(() => {
    if (typeof renderCloseAction !== "function") {
      return null;
    }
    /**
     * 背景：
     *  - Modal 关闭操作需要在标签区域中保持固定位置。
     * 关键取舍：
     *  - 通过渲染钩子注入布局层的 className，以组合 SettingsModal 的视觉风格与页面布局，
     *    比直接引用按钮节点更利于未来扩展可访问属性或动画能力。
     */
    return renderCloseAction({ className: styles["close-button"] });
  }, [renderCloseAction]);

  const tabBlueprints = useMemo(() => {
    const accountLabel = t.prefAccountTitle ?? t.settingsTabAccount ?? "Account";
    const accountDescription = t.settingsAccountDescription ?? "";
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

    return [
      {
        id: "account",
        label: accountLabel,
        summary:
          accountDescription ||
          "Details that travel with your workspace.",
        disabled: false,
        Component: AccountPreferencesTab,
        componentProps: {
          title: accountLabel,
          description: accountDescription,
          fields: accountFields,
          manageLabel,
          canManageProfile,
          onOpenAccountManager,
        },
      },
      {
        id: "privacy",
        label: t.prefPrivacyTitle ?? "Privacy",
        summary:
          t.prefPrivacyDescription ??
          "Control how your presence and data are shared across Glancy.",
        disabled: false,
        Component: PlaceholderTab,
        componentProps: {
          title: t.prefPrivacyTitle ?? "Privacy",
          message:
            t.prefPrivacyPlaceholder ??
            "Privacy controls are being handcrafted and will arrive soon.",
        },
      },
      {
        id: "notifications",
        label: t.prefNotificationsTitle ?? "Notifications",
        summary:
          t.prefNotificationsDescription ??
          "Tune alerts to match your creative rhythm.",
        disabled: true,
        Component: PlaceholderTab,
        componentProps: {
          title: t.prefNotificationsTitle ?? "Notifications",
          message:
            t.prefNotificationsDisabledMessage ??
            "Notification preferences are managed in the mobile app for now.",
        },
      },
    ];
  }, [
    fallbackValue,
    manageLabel,
    canManageProfile,
    onOpenAccountManager,
    profileMeta.age,
    profileMeta.gender,
    t.prefAccountTitle,
    t.prefPrivacyDescription,
    t.prefPrivacyPlaceholder,
    t.prefPrivacyTitle,
    t.prefNotificationsDescription,
    t.prefNotificationsDisabledMessage,
    t.prefNotificationsTitle,
    t.settingsAccountAge,
    t.settingsAccountDescription,
    t.settingsAccountEmail,
    t.settingsAccountGender,
    t.settingsAccountPhone,
    t.settingsAccountUsername,
    t.settingsTabAccount,
    user?.email,
    user?.phone,
    user?.username,
  ]);

  const [activeTabId, setActiveTabId] = useState(() =>
    sanitizeActiveTabId(initialTabId, tabBlueprints),
  );

  useEffect(() => {
    setActiveTabId((current) => {
      const sanitized = sanitizeActiveTabId(current, tabBlueprints);
      return sanitized === current ? current : sanitized;
    });
  }, [tabBlueprints]);

  useEffect(() => {
    setActiveTabId((current) => {
      const sanitized = sanitizeActiveTabId(initialTabId, tabBlueprints);
      return sanitized === current ? current : sanitized;
    });
  }, [initialTabId, tabBlueprints]);

  const handleTabSelect = (tab) => {
    if (!tab || tab.disabled) {
      return;
    }
    setActiveTabId((current) => (current === tab.id ? current : tab.id));
  };

  const activeTab = useMemo(
    () => tabBlueprints.find((tab) => tab.id === activeTabId) ?? tabBlueprints[0],
    [activeTabId, tabBlueprints],
  );

  const handleSubmit = (event) => {
    event.preventDefault();
  };

  const panelId = activeTab ? `${activeTab.id}-panel` : "";
  const tabId = activeTab ? `${activeTab.id}-tab` : "";
  const panelHeadingId = activeTab ? `${activeTab.id}-section-heading` : "";
  const panelDescriptionId = activeTab
    ? `${activeTab.id}-section-description`
    : "";
  const PanelComponent = activeTab?.Component ?? null;

  return (
    <div className={styles.content}>
      <form
        aria-labelledby={headingId}
        aria-describedby={descriptionId}
        className={styles.form}
        onSubmit={handleSubmit}
      >
        <header className={styles.header}>
          <div className={styles.identity}>
            <Avatar width={56} height={56} className={styles.avatar} />
            <div className={styles["identity-copy"]}>
              {planLabel ? <p className={styles.plan}>{planLabel}</p> : null}
              <h2 id={headingId} className={styles.title}>
                {t.prefTitle ?? "Preferences"}
              </h2>
            </div>
          </div>
          {hasDescription ? (
            <p id={descriptionId} className={styles.description}>
              {t.prefDescription}
            </p>
          ) : null}
        </header>
        <div className={styles.body}>
          <div className={styles["tabs-region"]}>
            {closeAction ? (
              <div className={styles["close-action"]}>{closeAction}</div>
            ) : null}
            <nav
              aria-label={tablistLabel}
              aria-orientation="vertical"
              className={styles.tabs}
              role="tablist"
            >
              {tabBlueprints.map((tab) => {
                const currentTabId = `${tab.id}-tab`;
                const currentPanelId = `${tab.id}-panel`;
                const isActive = tab.id === activeTabId;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    id={currentTabId}
                    aria-controls={currentPanelId}
                    aria-selected={isActive}
                    tabIndex={isActive ? 0 : -1}
                    disabled={tab.disabled}
                    className={styles.tab}
                    data-state={isActive ? "active" : "inactive"}
                    onClick={() => handleTabSelect(tab)}
                  >
                    <span className={styles["tab-label"]}>{tab.label}</span>
                    {tab.summary ? (
                      <span className={styles["tab-summary"]}>{tab.summary}</span>
                    ) : null}
                  </button>
                );
              })}
            </nav>
          </div>
          <div
            role="tabpanel"
            id={panelId}
            aria-labelledby={tabId}
            className={styles.panel}
          >
            {PanelComponent ? (
              <PanelComponent
                headingId={panelHeadingId}
                descriptionId={panelDescriptionId}
                {...activeTab.componentProps}
              />
            ) : null}
          </div>
        </div>
      </form>
    </div>
  );
}

Preferences.propTypes = {
  onOpenAccountManager: PropTypes.func,
  initialTabId: PropTypes.string,
  renderCloseAction: PropTypes.func,
};

Preferences.defaultProps = {
  onOpenAccountManager: undefined,
  initialTabId: undefined,
  renderCloseAction: undefined,
};

export default Preferences;
