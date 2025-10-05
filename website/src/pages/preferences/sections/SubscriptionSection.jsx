/**
 * 背景：
 *  - SubscriptionSection 需在设置页与模态中重复使用，且要承载多层结构（当前套餐、套餐矩阵、兑换与订阅动作）。
 * 目的：
 *  - 构建纯展示组件，通过组合 props 渲染订阅信息，同时维持可访问性与未来扩展空间。
 * 关键决策与取舍：
 *  - 组件内部仅管理轻量交互状态（选中套餐与兑换码输入），其余动作通过回调上抛，保持端口-适配器模式。
 * 影响范围：
 *  - 偏好设置页面与 SettingsModal 的订阅分区展示。
 * 演进与TODO：
 *  - TODO: 接入真实兑换与订阅 API 时补充加载/错误态，并与遥测打通。
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import styles from "../Preferences.module.css";

function SubscriptionSection({
  title,
  headingId,
  descriptionId,
  planCards,
  featureMatrix,
  visiblePlanIds,
  planLabels,
  pricingNote,
  taxNote,
  redeemCopy,
  subscribeCopy,
  defaultSelectedPlanId,
  onRedeem,
  onSubscribe,
  featureColumnLabel,
}) {
  const [selectedPlanId, setSelectedPlanId] = useState(defaultSelectedPlanId);
  const [redeemCode, setRedeemCode] = useState("");
  const redeemInputRef = useRef(null);
  const planCarouselRef = useRef(null);
  const navigate = useNavigate();
  const [isPlanRailAtStart, setIsPlanRailAtStart] = useState(true);
  const [isPlanRailAtEnd, setIsPlanRailAtEnd] = useState(false);

  const handlePlanSelect = useCallback((planId, disabled) => {
    if (disabled) {
      return;
    }
    setSelectedPlanId(planId);
  }, []);

  const handleRedeemAction = useCallback(() => {
    if (onRedeem) {
      onRedeem(redeemCode.trim());
    }
  }, [onRedeem, redeemCode]);

  const subscribeDisabled = selectedPlanId === defaultSelectedPlanId;

  const subscribeLabel = useMemo(() => {
    if (subscribeDisabled) {
      return subscribeCopy.disabledLabel;
    }
    const selectedPlanLabel = planLabels[selectedPlanId] ?? selectedPlanId;
    return subscribeCopy.template.replace("{plan}", selectedPlanLabel);
  }, [
    subscribeDisabled,
    subscribeCopy.disabledLabel,
    subscribeCopy.template,
    planLabels,
    selectedPlanId,
  ]);

  const handleSubscribe = useCallback(() => {
    if (subscribeDisabled) {
      return;
    }
    if (onSubscribe) {
      onSubscribe(selectedPlanId);
      return;
    }
    navigate("/subscription", { state: { plan: selectedPlanId } });
  }, [navigate, onSubscribe, selectedPlanId, subscribeDisabled]);

  /**
   * 意图：复用单一的滚动同步逻辑，让横向滑动的套餐列表在不同视口下保持导航按钮状态正确。
   * 取舍：相比为每个按钮单独计算可见性，集中在 scroll 事件中维护状态能避免重复布局查询；
   *      考量到监听频率较低且节点数量有限，scroll 事件 + requestAnimationFrame 的额外优化暂不需要。
   */
  const syncPlanRailPosition = useCallback(() => {
    const node = planCarouselRef.current;
    if (!node) {
      setIsPlanRailAtStart(true);
      setIsPlanRailAtEnd(true);
      return;
    }
    const { scrollLeft, clientWidth, scrollWidth } = node;
    setIsPlanRailAtStart(scrollLeft <= 1);
    setIsPlanRailAtEnd(scrollLeft + clientWidth >= scrollWidth - 1);
  }, []);

  useEffect(() => {
    const node = planCarouselRef.current;
    if (!node) {
      return undefined;
    }
    const handleScroll = () => {
      syncPlanRailPosition();
    };
    handleScroll();
    node.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      node.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [syncPlanRailPosition]);

  useEffect(() => {
    syncPlanRailPosition();
  }, [planCards.length, syncPlanRailPosition]);

  const handlePlanRailNav = useCallback((direction) => {
    const node = planCarouselRef.current;
    if (!node) {
      return;
    }
    const scrollAmount = node.clientWidth * 0.85;
    node.scrollBy({ left: direction * scrollAmount, behavior: "smooth" });
  }, []);

  const shouldRenderPlanRailNav = planCards.length > 1;

  return (
    <section
      aria-labelledby={headingId}
      aria-describedby={descriptionId}
      className={`${styles.section} ${styles["section-plain"]} ${styles["subscription-section"]}`}
    >
      <div className={styles["section-header"]}>
        <h3 id={headingId} className={styles["section-title"]} tabIndex={-1}>
          {title}
        </h3>
        <div className={styles["section-divider"]} aria-hidden="true" />
      </div>
      <div className={styles["subscription-matrix"]}>
        <div className={styles["subscription-plan-carousel"]}>
          {shouldRenderPlanRailNav ? (
            <button
              type="button"
              className={`${styles["subscription-plan-nav"]} ${styles["subscription-plan-nav-previous"]}`}
              onClick={() => handlePlanRailNav(-1)}
              disabled={isPlanRailAtStart}
              aria-label="查看前一个订阅方案"
            >
              <span aria-hidden="true">‹</span>
            </button>
          ) : null}
          <div
            className={styles["subscription-plan-viewport"]}
            data-scroll-at-start={isPlanRailAtStart}
            data-scroll-at-end={isPlanRailAtEnd}
          >
            <div
              ref={planCarouselRef}
              className={styles["subscription-plan-grid"]}
              role="list"
            >
              {planCards.map((plan) => {
                const isSelected = plan.id === selectedPlanId;
                return (
                  <article
                    key={plan.id}
                    className={styles["subscription-plan"]}
                    data-state={plan.state}
                    data-selected={isSelected}
                    role="listitem"
                  >
                    <div className={styles["subscription-plan-body"]}>
                      <span className={styles["subscription-plan-badge"]}>
                        {plan.badge}
                      </span>
                      <h4 className={styles["subscription-plan-title"]}>
                        {plan.title}
                      </h4>
                      <p className={styles["subscription-plan-summary"]}>
                        {plan.summary}
                      </p>
                      <ul className={styles["subscription-plan-pricing"]}>
                        {plan.priceLines.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    </div>
                    <button
                      type="button"
                      className={styles["subscription-plan-cta"]}
                      onClick={() => handlePlanSelect(plan.id, plan.disabled)}
                      disabled={plan.disabled}
                      aria-pressed={isSelected}
                    >
                      {plan.ctaLabel}
                    </button>
                  </article>
                );
              })}
            </div>
          </div>
          {shouldRenderPlanRailNav ? (
            <button
              type="button"
              className={`${styles["subscription-plan-nav"]} ${styles["subscription-plan-nav-next"]}`}
              onClick={() => handlePlanRailNav(1)}
              disabled={isPlanRailAtEnd}
              aria-label="查看后一个订阅方案"
            >
              <span aria-hidden="true">›</span>
            </button>
          ) : null}
        </div>
        <div className={styles["subscription-table-wrapper"]}>
          <table className={styles["subscription-table"]}>
            <thead>
              <tr>
                <th scope="col">{featureColumnLabel}</th>
                {visiblePlanIds.map((planId) => (
                  <th key={planId} scope="col">
                    {planLabels[planId] ?? planId}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {featureMatrix.map((feature) => (
                <tr key={feature.id}>
                  <th scope="row">{feature.label}</th>
                  {visiblePlanIds.map((planId) => (
                    <td
                      key={planId}
                      data-plan-state={
                        planId === defaultSelectedPlanId ? "current" : undefined
                      }
                    >
                      {feature.values[planId] ?? ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className={styles["subscription-footnotes"]}>
        <p>{pricingNote}</p>
        <p>{taxNote}</p>
      </div>
      <div className={styles["subscription-actions"]}>
        <div className={styles["subscription-redeem"]}>
          <h4 className={styles["subscription-redeem-title"]}>
            {redeemCopy.title}
          </h4>
          <div className={styles["subscription-redeem-form"]}>
            <input
              ref={redeemInputRef}
              type="text"
              className={styles["subscription-redeem-input"]}
              placeholder={redeemCopy.placeholder}
              value={redeemCode}
              onChange={(event) => setRedeemCode(event.target.value)}
            />
            <button
              type="button"
              className={styles["subscription-redeem-button"]}
              onClick={handleRedeemAction}
            >
              {redeemCopy.buttonLabel}
            </button>
          </div>
        </div>
        <div className={styles["subscription-cta"]}>
          <button
            type="button"
            className={styles["subscription-cta-button"]}
            onClick={handleSubscribe}
            disabled={subscribeDisabled}
          >
            {subscribeLabel}
          </button>
        </div>
      </div>
    </section>
  );
}

SubscriptionSection.propTypes = {
  title: PropTypes.string.isRequired,
  headingId: PropTypes.string.isRequired,
  descriptionId: PropTypes.string,
  planCards: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      summary: PropTypes.string.isRequired,
      priceLines: PropTypes.arrayOf(PropTypes.string).isRequired,
      state: PropTypes.oneOf(["current", "available", "locked"]).isRequired,
      badge: PropTypes.string.isRequired,
      ctaLabel: PropTypes.string.isRequired,
      disabled: PropTypes.bool.isRequired,
    }),
  ).isRequired,
  featureMatrix: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      values: PropTypes.objectOf(PropTypes.string).isRequired,
    }),
  ).isRequired,
  visiblePlanIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  planLabels: PropTypes.objectOf(PropTypes.string).isRequired,
  pricingNote: PropTypes.string.isRequired,
  taxNote: PropTypes.string.isRequired,
  redeemCopy: PropTypes.shape({
    title: PropTypes.string.isRequired,
    placeholder: PropTypes.string.isRequired,
    buttonLabel: PropTypes.string.isRequired,
  }).isRequired,
  subscribeCopy: PropTypes.shape({
    template: PropTypes.string.isRequired,
    disabledLabel: PropTypes.string.isRequired,
  }).isRequired,
  defaultSelectedPlanId: PropTypes.string.isRequired,
  onRedeem: PropTypes.func,
  onSubscribe: PropTypes.func,
  featureColumnLabel: PropTypes.string.isRequired,
};

SubscriptionSection.defaultProps = {
  descriptionId: undefined,
  onRedeem: undefined,
  onSubscribe: undefined,
};

export default SubscriptionSection;
