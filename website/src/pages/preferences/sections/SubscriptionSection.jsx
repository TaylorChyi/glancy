/**
 * 背景：
 *  - 订阅蓝图准备落地到设置面板，需要在现有偏好布局内呈现套餐对比、兑换入口与订阅动作。
 * 目的：
 *  - 承载套餐卡片、特性矩阵与 FAQ 文案，突出当前套餐并允许用户切换意向套餐或输入兑换码。
 * 关键决策与取舍：
 *  - 组件保持无状态数据输入 + 内部选择态：订阅卡片来源于 Hook 输出，组件仅处理选中态与表单交互；
 *  - 将布局拆为“当前订阅卡、套餐矩阵、底部操作”三段，便于未来拆分为独立页面或复用于模态。
 * 影响范围：
 *  - 偏好设置页面新增订阅分区；未来若扩展订阅详情页可重用该结构。
 * 演进与TODO：
 *  - TODO: 接入真实的管理入口与路由跳转；
 *  - TODO: 兑换成功后应触发重新获取套餐权益并刷新可见计划。
 */
import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import styles from "../Preferences.module.css";

const composeClassName = (...tokens) => tokens.filter(Boolean).join(" ");

const resolveFeatureValue = (value, translate) => {
  if (typeof value !== "string") {
    return value;
  }
  if (value.startsWith("subscription.")) {
    return translate(value) ?? value;
  }
  return value;
};

function SubscriptionSection({
  title,
  headingId,
  descriptionId,
  description,
  plans,
  featureMatrix,
  copy,
  currentPlanId,
  onRedeem,
  onSubscribe,
}) {
  const initialPlanId = useMemo(() => {
    if (plans.some((plan) => plan.id === currentPlanId)) {
      return currentPlanId;
    }
    return plans[0]?.id ?? "";
  }, [currentPlanId, plans]);

  const [selectedPlanId, setSelectedPlanId] = useState(initialPlanId);
  const [redeemCode, setRedeemCode] = useState("");

  useEffect(() => {
    if (!plans.some((plan) => plan.id === selectedPlanId)) {
      setSelectedPlanId(initialPlanId);
    }
  }, [initialPlanId, plans, selectedPlanId]);

  const redeemDisabled = redeemCode.trim().length === 0;
  const subscribeDisabled = !selectedPlanId || selectedPlanId === currentPlanId;

  const handlePlanSelect = (planId) => {
    setSelectedPlanId(planId);
  };

  const handleRedeemSubmit = (event) => {
    if (event && typeof event.preventDefault === "function") {
      event.preventDefault();
    }
    if (redeemDisabled) {
      return;
    }
    if (typeof onRedeem === "function") {
      onRedeem(redeemCode.trim());
    }
    setRedeemCode("");
  };

  const handleSubscribe = () => {
    if (subscribeDisabled) {
      return;
    }
    if (typeof onSubscribe === "function") {
      onSubscribe(selectedPlanId);
    }
  };

  const planIds = useMemo(() => plans.map((plan) => plan.id), [plans]);

  return (
    <section
      aria-labelledby={headingId}
      aria-describedby={description ? descriptionId : undefined}
      className={composeClassName(styles.section, styles["section-subscription"])}
    >
      <div className={styles["section-header"]}>
        <h3 id={headingId} className={styles["section-title"]} tabIndex={-1}>
          {title}
        </h3>
        {description ? (
          <p id={descriptionId} className={styles["section-description"]}>
            {description}
          </p>
        ) : null}
        <div className={styles["section-divider"]} aria-hidden="true" />
      </div>

      <div className={styles["subscription-current"]}>
        <div className={styles["subscription-current-copy"]}>
          <p className={styles["subscription-current-heading"]}>
            {copy.currentPlanTitle}
          </p>
          <p className={styles["subscription-current-line"]}>{copy.planLine}</p>
          <p className={styles["subscription-current-line"]}>{copy.billingLine}</p>
          <p className={styles["subscription-current-line"]}>{copy.regionLine}</p>
          {copy.statusLine ? (
            <p className={styles["subscription-current-status"]}>{copy.statusLine}</p>
          ) : null}
        </div>
        <div className={styles["subscription-current-actions"]}>
          {copy.actions.map((action) => (
            <button
              key={action.id}
              type="button"
              className={styles["subscription-action"]}
              onClick={action.onClick}
              disabled={action.disabled}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles["subscription-grid"]}>
        {plans.map((plan) => {
          const isSelected = plan.id === selectedPlanId;
          const isCurrent = plan.id === currentPlanId;
          return (
            <button
              key={plan.id}
              type="button"
              className={composeClassName(
                styles["subscription-card"],
                isSelected ? styles["subscription-card-active"] : "",
                isCurrent ? styles["subscription-card-current"] : "",
              )}
              onClick={() => handlePlanSelect(plan.id)}
              aria-pressed={isSelected}
            >
              <div className={styles["subscription-card-header"]}>
                <div className={styles["subscription-card-titles"]}>
                  <span className={styles["subscription-card-tier"]}>{plan.title}</span>
                  <span className={styles["subscription-card-price"]}>{plan.pricePrimary}</span>
                  {plan.priceSecondary ? (
                    <span className={styles["subscription-card-secondary"]}>
                      {plan.priceSecondary}
                    </span>
                  ) : null}
                </div>
                {isCurrent ? (
                  <span className={styles["subscription-badge"]}>{copy.badges.current}</span>
                ) : isSelected ? (
                  <span className={styles["subscription-badge"]}>{copy.badges.selected}</span>
                ) : null}
              </div>
              <p className={styles["subscription-card-desc"]}>{plan.description}</p>
            </button>
          );
        })}
      </div>

      <div className={styles["subscription-matrix"]}>
        <table className={styles["subscription-table"]}>
          <caption className={styles["subscription-table-caption"]}>
            {copy.matrixCaption}
          </caption>
          <thead>
            <tr>
              <th scope="col" className={styles["subscription-feature-heading"]}>
                {copy.featureHeading}
              </th>
              {plans.map((plan) => (
                <th key={plan.id} scope="col" className={styles["subscription-plan-heading"]}>
                  {plan.shortTitle}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {featureMatrix.map((feature) => (
              <tr key={feature.id}>
                <th scope="row" className={styles["subscription-feature"]}>
                  {feature.label}
                </th>
                {planIds.map((planId) => (
                  <td key={`${feature.id}-${planId}`} className={styles["subscription-value"]}>
                    {resolveFeatureValue(
                      feature.values[planId],
                      copy.translate,
                    )}
                    {feature.unitSuffixes?.[planId] ? (
                      <span className={styles["subscription-unit"]}>
                        {feature.unitSuffixes[planId]}
                      </span>
                    ) : null}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles["subscription-actions-region"]}>
        <form className={styles["subscription-redeem"]} onSubmit={handleRedeemSubmit}>
          <h4 className={styles["subscription-subheading"]}>{copy.redeem.title}</h4>
          <p className={styles["subscription-helper"]}>{copy.redeem.description}</p>
          <div className={styles["subscription-input-group"]}>
            <input
              type="text"
              value={redeemCode}
              onChange={(event) => setRedeemCode(event.target.value.toUpperCase())}
              placeholder={copy.redeem.placeholder}
              maxLength={16}
              className={styles["subscription-input"]}
            />
            <button
              type="submit"
              className={styles["subscription-primary"]}
              disabled={redeemDisabled}
            >
              {copy.redeem.button}
            </button>
          </div>
        </form>
        <div className={styles["subscription-subscribe"]}>
          <h4 className={styles["subscription-subheading"]}>{copy.subscribe.title}</h4>
          <p className={styles["subscription-helper"]}>{copy.subscribe.description}</p>
          <button
            type="button"
            className={styles["subscription-primary"]}
            onClick={handleSubscribe}
            disabled={subscribeDisabled}
          >
            {copy.subscribe.button}
          </button>
          {subscribeDisabled ? (
            <p className={styles["subscription-disabled-hint"]}>{copy.subscribe.disabledHint}</p>
          ) : null}
        </div>
      </div>

      <div className={styles["subscription-faq"]}>
        <h4 className={styles["subscription-subheading"]}>{copy.faqTitle}</h4>
        <ul className={styles["subscription-faq-list"]}>
          {copy.faqItems.map((item) => (
            <li key={item.id}>{item.text}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

SubscriptionSection.propTypes = {
  title: PropTypes.string.isRequired,
  headingId: PropTypes.string.isRequired,
  descriptionId: PropTypes.string.isRequired,
  description: PropTypes.string,
  plans: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      shortTitle: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      pricePrimary: PropTypes.string.isRequired,
      priceSecondary: PropTypes.string,
    }),
  ).isRequired,
  featureMatrix: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      values: PropTypes.objectOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number]))
        .isRequired,
      unitSuffixes: PropTypes.objectOf(PropTypes.string),
    }),
  ).isRequired,
  copy: PropTypes.shape({
    currentPlanTitle: PropTypes.string.isRequired,
    planLine: PropTypes.string.isRequired,
    billingLine: PropTypes.string.isRequired,
    regionLine: PropTypes.string.isRequired,
    statusLine: PropTypes.string,
    badges: PropTypes.shape({
      current: PropTypes.string.isRequired,
      selected: PropTypes.string.isRequired,
    }).isRequired,
    actions: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        onClick: PropTypes.func,
        disabled: PropTypes.bool,
      }),
    ).isRequired,
    matrixCaption: PropTypes.string.isRequired,
    featureHeading: PropTypes.string.isRequired,
    translate: PropTypes.func.isRequired,
    redeem: PropTypes.shape({
      title: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      placeholder: PropTypes.string.isRequired,
      button: PropTypes.string.isRequired,
    }).isRequired,
    subscribe: PropTypes.shape({
      title: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      button: PropTypes.string.isRequired,
      disabledHint: PropTypes.string.isRequired,
    }).isRequired,
    faqTitle: PropTypes.string.isRequired,
    faqItems: PropTypes.arrayOf(
      PropTypes.shape({ id: PropTypes.string.isRequired, text: PropTypes.string.isRequired }),
    ).isRequired,
  }).isRequired,
  currentPlanId: PropTypes.string,
  onRedeem: PropTypes.func,
  onSubscribe: PropTypes.func,
};

SubscriptionSection.defaultProps = {
  description: "",
  currentPlanId: "",
  onRedeem: undefined,
  onSubscribe: undefined,
};

export default SubscriptionSection;
