import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import styles from "./Preferences.module.css";
import { useLanguage, useUser } from "@/context";
import { useApi } from "@/hooks/useApi.js";
import Avatar from "@/components/ui/Avatar";

/**
 * 背景：
 *  - 多标签与语音预览功能已迁出，此页面仅承担账户信息的呈现职责。
 * 目的：
 *  - 以极简布局展示账户关键字段，并为未来扩展（如安全设置）保留结构化入口。
 * 关键决策与取舍：
 *  - 采用“蓝图 + 映射”模板方法定义字段，便于后续通过配置扩展字段集合。
 *  - 异步资料加载维持最小状态集，避免引入全局 store 依赖。
 * 影响范围：
 *  - 仅偏好设置页面的账户模块；其余功能保持不变。
 * 演进与TODO：
 *  - 后续如需引入多分组信息，可在 `ACCOUNT_FIELD_BLUEPRINTS` 中扩展分段标识。
 */

const ACCOUNT_FIELD_BLUEPRINTS = Object.freeze([
  {
    id: "username",
    labelKey: "settingsAccountUsername",
    accessor: (user) => user?.username,
  },
  {
    id: "email",
    labelKey: "settingsAccountEmail",
    accessor: (user) => user?.email,
  },
  {
    id: "phone",
    labelKey: "settingsAccountPhone",
    accessor: (user) => user?.phone,
  },
  {
    id: "age",
    labelKey: "settingsAccountAge",
    accessor: (_, profileMeta) => profileMeta.age,
  },
  {
    id: "gender",
    labelKey: "settingsAccountGender",
    accessor: (_, profileMeta) => profileMeta.gender,
  },
]);

/**
 * 意图：将账户字段蓝图转换为具备文案和值的可渲染实体。
 * 输入：翻译对象 `t`、当前 `user`、`profileMeta` 状态、空值占位文案。
 * 输出：带 id/label/value 的数组，供渲染使用。
 * 流程：
 *  1) 遍历蓝图并读取国际化 label。
 *  2) 计算字段值，遇到缺失或空白时使用占位文案。
 * 错误处理：统一输出占位文案，避免界面出现 `undefined`。
 * 复杂度：O(n)，n 为字段数量。
 */
function buildAccountFields(t, user, profileMeta, fallbackValue) {
  return ACCOUNT_FIELD_BLUEPRINTS.map(({ id, labelKey, accessor }) => {
    const label = t[labelKey] || labelKey;
    const rawValue = accessor(user, profileMeta);
    const hasValue =
      rawValue !== undefined && rawValue !== null && rawValue !== "";
    return {
      id,
      label,
      value: hasValue ? String(rawValue) : fallbackValue,
    };
  });
}

function Preferences({ onOpenAccountManager }) {
  const { t } = useLanguage();
  const { user } = useUser();
  const api = useApi();
  const [profileMeta, setProfileMeta] = useState({ age: "", gender: "" });

  useEffect(() => {
    if (!user || !api?.profiles?.fetchProfile) {
      setProfileMeta({ age: "", gender: "" });
      return;
    }
    let mounted = true;
    api.profiles
      .fetchProfile({ token: user.token })
      .then((profile) => {
        if (!mounted) {
          return;
        }
        setProfileMeta({
          age: profile?.age ?? "",
          gender: profile?.gender ?? "",
        });
      })
      .catch((error) => {
        console.error("[preferences] fetchProfile failed", error);
      });
    return () => {
      mounted = false;
    };
  }, [api, user]);

  const fallbackValue = useMemo(
    () => t.settingsEmptyValue || "—",
    [t.settingsEmptyValue],
  );
  const accountFields = useMemo(
    () => buildAccountFields(t, user, profileMeta, fallbackValue),
    [fallbackValue, profileMeta, t, user],
  );

  const planName = user?.plan || (user?.isPro ? "plus" : "free");
  const planLabel = planName
    ? planName.charAt(0).toUpperCase() + planName.slice(1)
    : fallbackValue;
  const preferencesTitle = t.prefTitle || t.prefAccountTitle || "Preferences";
  const accountTitle = t.prefAccountTitle || preferencesTitle;
  const accountDescription = t.settingsAccountDescription || "";
  const manageProfileLabel = t.settingsManageProfile || "Manage profile";

  return (
    <div className={styles.content}>
      <form
        className={styles.form}
        aria-labelledby="preferences-heading"
        aria-describedby="preferences-description"
        onSubmit={(event) => event.preventDefault()}
      >
        <header className={styles.header}>
          <div className={styles.identity}>
            <Avatar
              width={72}
              height={72}
              className={styles.avatar}
              alt={user?.username || accountTitle}
            />
            <div className={styles["identity-meta"]}>
              <span className={styles.eyebrow}>{preferencesTitle}</span>
              <h1 id="preferences-heading" className={styles.title}>
                {accountTitle}
              </h1>
              <p id="preferences-description" className={styles.description}>
                {accountDescription}
              </p>
              <span className={styles["plan-badge"]}>{planLabel}</span>
            </div>
          </div>
          {typeof onOpenAccountManager === "function" ? (
            <button
              type="button"
              className={styles["manage-button"]}
              onClick={onOpenAccountManager}
            >
              {manageProfileLabel}
            </button>
          ) : null}
        </header>
        <section className={styles.section} aria-label={accountTitle}>
          <dl className={styles["detail-grid"]}>
            {accountFields.map((field) => (
              <div key={field.id} className={styles["detail-item"]}>
                <dt className={styles["detail-label"]}>{field.label}</dt>
                <dd className={styles["detail-value"]}>{field.value}</dd>
              </div>
            ))}
          </dl>
        </section>
        <footer className={styles.footer}>
          <span className={styles["footer-note"]}>{accountDescription}</span>
        </footer>
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
