/**
 * 背景：
 *  - 订阅分区需在设置页呈现当前订阅、套餐对比与兑换入口，原有结构缺失这一职责。
 * 目的：
 *  - 以组合方式渲染订阅视图模型，支持计划选择、兑换与跳转操作。
 * 关键决策与取舍：
 *  - 组件保持纯展示 + 轻量交互，将数据准备交给 createSubscriptionViewModel；
 *  - 通过栅格与语义化 aria 属性构建 radiogroup 交互，兼顾可访问性与未来扩展。
 * 影响范围：
 *  - 偏好设置订阅分区；后续若在模态中复用亦可复用本组件。
 * 演进与TODO：
 *  - TODO: 对接真实兑换与订阅跳转 API，追加加载与错误状态；
 *  - TODO: 当权限矩阵字段扩展时考虑虚拟化与折叠策略。
 */
import PropTypes from "prop-types";
import { useMemo, useState } from "react";
import styles from "../Preferences.module.css";

function SubscriptionSection({
  headingId,
  descriptionId,
  viewModel,
  onManageSubscription,
  onChangeRegion,
  onRedeem,
  onOpenSubscription,
}) {
  const [redeemCode, setRedeemCode] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState(viewModel.defaultSelection);

  const isCurrentPlanSelected = selectedPlanId === viewModel.defaultSelection;

  const planLookup = useMemo(() => {
    const entries = new Map();
    viewModel.plans.forEach((plan) => {
      entries.set(plan.id, plan);
    });
    return entries;
  }, [viewModel.plans]);

  const selectedPlan = planLookup.get(selectedPlanId);

  const handlePlanSelect = (planId) => {
    if (!planLookup.has(planId)) {
      return;
    }
    setSelectedPlanId((current) => (current === planId ? current : planId));
  };

  const handleRedeem = (event) => {
    event.preventDefault();
    if (typeof onRedeem === "function") {
      onRedeem(redeemCode.trim());
    }
  };

  const handleSubscribe = () => {
    if (typeof onOpenSubscription === "function") {
      onOpenSubscription(selectedPlanId, selectedPlan);
    }
  };

  return (
    <section
      aria-labelledby={headingId}
      aria-describedby={viewModel.description ? descriptionId : undefined}
      className={styles.section}
    >
      <div className={styles["section-header"]}>
        <h3 id={headingId} className={styles["section-title"]} tabIndex={-1}>
          {viewModel.title}
        </h3>
        {viewModel.description ? (
          <p id={descriptionId} className={styles["section-description"]}>
            {viewModel.description}
          </p>
        ) : null}
      </div>

      <article className={styles["subscription-current"]}>
        <header className={styles["subscription-current-header"]}>
          <div className={styles["subscription-current-meta"]}>
            <p className={styles["subscription-current-title"]}>{viewModel.current.title}</p>
            <p className={styles["subscription-current-headline"]}>
              {viewModel.current.headline}
            </p>
          </div>
          <div className={styles["subscription-current-actions"]}>
            {viewModel.current.manageLabel &&
            typeof onManageSubscription === "function" ? (
              <button
                type="button"
                className={styles["subscription-action"]}
                onClick={onManageSubscription}
              >
                {viewModel.current.manageLabel}
              </button>
            ) : null}
            {viewModel.current.changeRegionLabel &&
            typeof onChangeRegion === "function" ? (
              <button
                type="button"
                className={styles["subscription-action"]}
                onClick={onChangeRegion}
              >
                {viewModel.current.changeRegionLabel}
              </button>
            ) : null}
            {viewModel.current.showRedeem &&
            viewModel.current.redeemLabel &&
            typeof onRedeem === "function" ? (
              <button
                type="button"
                className={styles["subscription-action"]}
                onClick={() => {
                  if (typeof onRedeem === "function") {
                    onRedeem(redeemCode.trim());
                  }
                }}
              >
                {viewModel.current.redeemLabel}
              </button>
            ) : null}
          </div>
        </header>
        <dl className={styles["subscription-current-details"]}>
          <div>
            <dt className={styles["subscription-detail-label"]}>
              {viewModel.labels.billingCycleLabel}
            </dt>
            <dd className={styles["subscription-detail-value"]}>
              {viewModel.current.cycle}
            </dd>
          </div>
          <div>
            <dt className={styles["subscription-detail-label"]}>
              {viewModel.labels.nextRenewalLabel}
            </dt>
            <dd className={styles["subscription-detail-value"]}>
              {viewModel.current.nextRenewal}
            </dd>
          </div>
          {viewModel.current.region ? (
            <div>
              <dt className={styles["subscription-detail-label"]}>
                {viewModel.labels.regionLabel}
              </dt>
              <dd className={styles["subscription-detail-value"]}>
                {viewModel.current.region}
              </dd>
            </div>
          ) : null}
          {viewModel.current.currency ? (
            <div>
              <dt className={styles["subscription-detail-label"]}>
                {viewModel.labels.currencyLabel}
              </dt>
              <dd className={styles["subscription-detail-value"]}>
                {viewModel.current.currency}
              </dd>
            </div>
          ) : null}
          {viewModel.current.validity ? (
            <div>
              <dt className={styles["subscription-detail-label"]}>
                {viewModel.labels.validityLabel}
              </dt>
              <dd className={styles["subscription-detail-value"]}>
                {viewModel.current.validity}
              </dd>
            </div>
          ) : null}
        </dl>
        {viewModel.current.highlight ? (
          <p className={styles["subscription-highlight"]}>
            {viewModel.current.highlight}
          </p>
        ) : null}
      </article>

      <section aria-label={viewModel.labels.planMatrixTitle} className={styles["subscription-matrix"]}>
        <div className={styles["subscription-plan-grid"]} role="radiogroup">
          {viewModel.plans.map((plan) => (
            <button
              type="button"
              key={plan.id}
              className={[
                styles["subscription-plan"],
                plan.isCurrent ? styles["subscription-plan-current"] : "",
                selectedPlanId === plan.id ? styles["subscription-plan-active"] : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-pressed={selectedPlanId === plan.id}
              onClick={() => handlePlanSelect(plan.id)}
              disabled={plan.isRedeemOnly}
            >
              {plan.badgeLabel ? (
                <span className={styles["subscription-plan-badge"]}>
                  {plan.badgeLabel}
                </span>
              ) : null}
              <span className={styles["subscription-plan-title"]}>{plan.title}</span>
              {plan.monthlyLabel ? (
                <span className={styles["subscription-plan-price"]}>
                  {plan.monthlyLabel}
                </span>
              ) : null}
              {plan.yearlyLabel ? (
                <span className={styles["subscription-plan-secondary"]}>
                  {plan.yearlyLabel}
                </span>
              ) : null}
              {plan.yearlyEquivalent ? (
                <span className={styles["subscription-plan-tertiary"]}>
                  {plan.yearlyEquivalent}
                </span>
              ) : null}
              {plan.summary ? (
                <p className={styles["subscription-plan-summary"]}>{plan.summary}</p>
              ) : null}
              <span className={styles["subscription-plan-cta"]}>{plan.buttonLabel}</span>
            </button>
          ))}
        </div>
        <table className={styles["subscription-table"]}>
          <caption className={styles["subscription-table-caption"]}>
            {viewModel.labels.planMatrixTitle}
          </caption>
          <thead>
            <tr>
              <th scope="col" className={styles["subscription-table-head"]}>
                {viewModel.labels.featureLabel}
              </th>
              {viewModel.planIds.map((planId) => (
                <th key={planId} scope="col" className={styles["subscription-table-head"]}>
                  {planLookup.get(planId)?.title ?? planId}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {viewModel.features.map((feature) => (
              <tr key={feature.id}>
                <th scope="row" className={styles["subscription-feature-label"]}>
                  {feature.label}
                </th>
                {viewModel.planIds.map((planId) => (
                  <td key={`${feature.id}-${planId}`} className={styles["subscription-feature-value"]}>
                    {feature.values[planId]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className={styles["subscription-actions"]}>
        <form className={styles["subscription-redeem"]} onSubmit={handleRedeem}>
          <h4 className={styles["subscription-subtitle"]}>{viewModel.labels.redeemTitle}</h4>
          <input
            type="text"
            className={styles["subscription-input"]}
            placeholder={viewModel.labels.redeemPlaceholder}
            value={redeemCode}
            onChange={(event) => setRedeemCode(event.target.value)}
            aria-label={viewModel.labels.redeemPlaceholder}
          />
          <button type="submit" className={styles["subscription-action-primary"]}>
            {viewModel.labels.redeemSubmit}
          </button>
        </form>
        <div className={styles["subscription-subscribe"]}>
          <h4 className={styles["subscription-subtitle"]}>{viewModel.labels.subscribeTitle}</h4>
          <button
            type="button"
            className={styles["subscription-action-primary"]}
            onClick={handleSubscribe}
            disabled={isCurrentPlanSelected}
            aria-disabled={isCurrentPlanSelected}
          >
            {isCurrentPlanSelected
              ? viewModel.labels.subscribeDisabled
              : viewModel.labels.subscribeCta}
          </button>
          {isCurrentPlanSelected ? (
            <p className={styles["subscription-hint"]}>{viewModel.labels.subscribeDisabled}</p>
          ) : null}
        </div>
      </div>

      <section aria-label={viewModel.labels.faqTitle} className={styles["subscription-faq"]}>
        <h4 className={styles["subscription-subtitle"]}>{viewModel.labels.faqTitle}</h4>
        <ul className={styles["subscription-faq-list"]}>
          {viewModel.faqEntries.map((entry, index) => (
            <li key={`faq-${index}`} className={styles["subscription-faq-item"]}>
              {entry}
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}

SubscriptionSection.propTypes = {
  headingId: PropTypes.string.isRequired,
  descriptionId: PropTypes.string,
  viewModel: PropTypes.shape({
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    plans: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        summary: PropTypes.string,
        monthlyLabel: PropTypes.string,
        yearlyLabel: PropTypes.string,
        yearlyEquivalent: PropTypes.string,
        buttonLabel: PropTypes.string.isRequired,
        isCurrent: PropTypes.bool,
        badgeLabel: PropTypes.string,
        isRedeemOnly: PropTypes.bool,
      }),
    ).isRequired,
    planIds: PropTypes.arrayOf(PropTypes.string).isRequired,
    features: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        values: PropTypes.objectOf(PropTypes.string).isRequired,
      }),
    ).isRequired,
    faqEntries: PropTypes.arrayOf(PropTypes.string).isRequired,
    current: PropTypes.shape({
      title: PropTypes.string.isRequired,
      headline: PropTypes.string,
      nextRenewal: PropTypes.string,
      region: PropTypes.string,
      currency: PropTypes.string,
      validity: PropTypes.string,
      highlight: PropTypes.string,
      manageLabel: PropTypes.string,
      changeRegionLabel: PropTypes.string,
      redeemLabel: PropTypes.string,
      showRedeem: PropTypes.bool,
    }).isRequired,
    defaultSelection: PropTypes.string.isRequired,
    labels: PropTypes.shape({
      planMatrixTitle: PropTypes.string.isRequired,
      featureLabel: PropTypes.string.isRequired,
      redeemTitle: PropTypes.string.isRequired,
      redeemPlaceholder: PropTypes.string.isRequired,
      redeemSubmit: PropTypes.string.isRequired,
      subscribeTitle: PropTypes.string.isRequired,
      subscribeCta: PropTypes.string.isRequired,
      subscribeDisabled: PropTypes.string.isRequired,
      faqTitle: PropTypes.string.isRequired,
      billingCycleLabel: PropTypes.string.isRequired,
      nextRenewalLabel: PropTypes.string.isRequired,
      regionLabel: PropTypes.string.isRequired,
      currencyLabel: PropTypes.string.isRequired,
      validityLabel: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
  onManageSubscription: PropTypes.func,
  onChangeRegion: PropTypes.func,
  onRedeem: PropTypes.func,
  onOpenSubscription: PropTypes.func,
};

SubscriptionSection.defaultProps = {
  descriptionId: undefined,
  onManageSubscription: undefined,
  onChangeRegion: undefined,
  onRedeem: undefined,
  onOpenSubscription: undefined,
};

export default SubscriptionSection;
