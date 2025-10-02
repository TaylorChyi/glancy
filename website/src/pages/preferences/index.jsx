/**
 * 背景：
 *  - 历史上 Preferences 组件承载多标签与语音预览逻辑，维护成本高且难以复用。
 * 目的：
 *  - 收敛到账户信息的极简展示面板，构建后续可扩展的账号偏好基座。
 * 关键决策与取舍：
 *  - 移除与多标签、语音预览、个性化相关的状态，仅保留读取账户与档案信息的必要逻辑。
 *  - 通过 useApi 拉取 profile 元数据，保持数据来源一致，并采用守卫避免卸载后状态更新。
 * 影响范围：
 *  - SettingsModal 调用接口收敛为 onOpenAccountManager，可在弹窗内复用该表单骨架。
 * 演进与TODO：
 *  - TODO: 当引入账户编辑功能时，在现有结构上补充输入控件与校验态。
 */
import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import styles from "./Preferences.module.css";
import { useLanguage, useUser } from "@/context";
import { useApi } from "@/hooks/useApi.js";
import Avatar from "@/components/ui/Avatar";

const EMPTY_PROFILE = Object.freeze({ age: "", gender: "" });

function Preferences({ onOpenAccountManager }) {
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
  const sectionHeadingId = "account-preferences-section-heading";
  const fallbackValue = t.settingsEmptyValue ?? "—";

  const planLabel = (() => {
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
  })();

  const mapValue = (candidate) => {
    if (candidate === null || candidate === undefined) {
      return fallbackValue;
    }
    if (typeof candidate === "string" && candidate.trim().length === 0) {
      return fallbackValue;
    }
    return String(candidate);
  };

  const accountRows = [
    {
      id: "username",
      label: t.settingsAccountUsername ?? "Username",
      value: mapValue(user?.username),
    },
    {
      id: "email",
      label: t.settingsAccountEmail ?? "Email",
      value: mapValue(user?.email),
    },
    {
      id: "phone",
      label: t.settingsAccountPhone ?? "Phone",
      value: mapValue(user?.phone),
    },
    {
      id: "age",
      label: t.settingsAccountAge ?? "Age",
      value: mapValue(profileMeta.age),
    },
    {
      id: "gender",
      label: t.settingsAccountGender ?? "Gender",
      value: mapValue(profileMeta.gender),
    },
  ];

  const handleSubmit = (event) => {
    event.preventDefault();
  };

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
        <section aria-labelledby={sectionHeadingId} className={styles.section}>
          <div className={styles["section-header"]}>
            <h3 id={sectionHeadingId} className={styles["section-title"]}>
              {t.prefAccountTitle ?? t.settingsTabAccount ?? "Account"}
            </h3>
            {t.settingsAccountDescription ? (
              <p className={styles["section-description"]}>
                {t.settingsAccountDescription}
              </p>
            ) : null}
          </div>
          <dl className={styles.details}>
            {accountRows.map((field) => (
              <div key={field.id} className={styles["detail-row"]}>
                <dt className={styles["detail-label"]}>{field.label}</dt>
                <dd className={styles["detail-value"]}>{field.value}</dd>
              </div>
            ))}
          </dl>
        </section>
        {user && typeof onOpenAccountManager === "function" ? (
          <footer className={styles.footer}>
            <button
              type="button"
              className={styles["manage-button"]}
              onClick={onOpenAccountManager}
            >
              {t.settingsManageProfile ?? "Manage profile"}
            </button>
          </footer>
        ) : null}
      </form>
    </div>
  );
}

Preferences.propTypes = {
  onOpenAccountManager: PropTypes.func,
};

Preferences.defaultProps = {
  onOpenAccountManager: undefined,
};

export default Preferences;
