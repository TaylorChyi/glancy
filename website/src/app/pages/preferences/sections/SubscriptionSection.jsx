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
 *  - TODO: 接入真实兑换 API 时补充加载/错误态，并与遥测打通。
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import SettingsSection from "@shared/components/settings/SettingsSection";
import styles from "../Preferences.module.css";

const REDEEM_CODE_GROUP_SIZE = 4;
const REDEEM_CODE_MAX_LENGTH = 16;

/**
 * 意图：保持输入与展示解耦，确保兑换码内部存储为纯净值，展示时再进行分组。
 * 输入：原始用户输入（可能包含空格、短横线或其他分隔符）。
 * 输出：去除分隔符后的纯兑换码，长度受限于 REDEEM_CODE_MAX_LENGTH。
 * 流程：
 *  1) 移除除字母数字外的字符。
 *  2) 截断至最大长度，避免溢出后续 API 限制。
 * 关键决策与取舍：基于受控组件 + 纯函数完成格式化，比引入输入掩码库（例如 cleave.js）更轻量，也避免未来在多端维护额外依赖。
 * 错误处理：若输入为空则返回空字符串，便于受控组件回退。
 * 复杂度：O(n)，n 为输入长度，兑换码长度受限因此成本可控。
 */
function normalizeRedeemCodeInput(rawValue) {
  if (!rawValue) {
    return "";
  }
  return rawValue.replace(/[^0-9a-zA-Z]/g, "").slice(0, REDEEM_CODE_MAX_LENGTH);
}

/**
 * 意图：为兑换码提供视觉分组，提升可读性且不影响实际提交数据。
 * 输入：normalize 后的纯兑换码。
 * 输出：每四位插入短横线的字符串，仅用于 UI 展示。
 * 流程：遍历字符串并按固定分组注入分隔符。
 * 关键决策与取舍：采用静态分组逻辑以符合当前 16 位兑换码约束；若后续改为配置化长度，可通过注入分组策略函数扩展，无需更改调用方。
 * 错误处理：空字符串时直接返回空，避免渲染 "undefined"。
 * 复杂度：O(n)，n 为兑换码长度。
 */
function formatRedeemCodeForDisplay(code) {
  if (!code) {
    return "";
  }
  const groups = [];
  for (let index = 0; index < code.length; index += REDEEM_CODE_GROUP_SIZE) {
    groups.push(code.slice(index, index + REDEEM_CODE_GROUP_SIZE));
  }
  return groups.join("-");
}

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
  defaultSelectedPlanId,
  onRedeem,
  featureColumnLabel,
}) {
  const [selectedPlanId, setSelectedPlanId] = useState(defaultSelectedPlanId);
  const [redeemCode, setRedeemCode] = useState("");
  const redeemInputRef = useRef(null);
  const planCarouselRef = useRef(null);
  const [isPlanRailAtStart, setIsPlanRailAtStart] = useState(true);
  const [isPlanRailAtEnd, setIsPlanRailAtEnd] = useState(false);

  const formattedRedeemCode = useMemo(
    () => formatRedeemCodeForDisplay(redeemCode),
    [redeemCode],
  );

  const handlePlanSelect = useCallback((planId, disabled) => {
    if (disabled) {
      return;
    }
    setSelectedPlanId(planId);
  }, []);

  const handleRedeemAction = useCallback(() => {
    if (onRedeem) {
      onRedeem(redeemCode);
    }
  }, [onRedeem, redeemCode]);

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
  /**
   * 以导航显隐取代禁用态，避免读屏软件聚焦到无效按钮，并减少视觉噪点。
   * 如后续需要保留占位，可改为渲染按钮容器并在样式层做透明处理。
   */
  const shouldShowPlanRailPreviousNav =
    shouldRenderPlanRailNav && !isPlanRailAtStart;
  const shouldShowPlanRailNextNav = shouldRenderPlanRailNav && !isPlanRailAtEnd;

  return (
    <SettingsSection
      headingId={headingId}
      title={title}
      describedBy={descriptionId}
      classes={{
        section: `${styles.section} ${styles["section-plain"]} ${styles["subscription-section"]}`,
        header: styles["section-header"],
        title: styles["section-title"],
        divider: styles["section-divider"],
      }}
    >
      <div className={styles["subscription-matrix"]}>
        <div className={styles["subscription-plan-carousel"]}>
          {shouldShowPlanRailPreviousNav ? (
            <button
              type="button"
              className={`${styles["subscription-plan-nav"]} ${styles["subscription-plan-nav-previous"]}`}
              onClick={() => handlePlanRailNav(-1)}
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
                const priceLineEntries = Array.isArray(plan.priceLines)
                  ? plan.priceLines
                  : [];
                const linesToRender =
                  isSelected && plan.subscriptionExpiryLine
                    ? [...priceLineEntries, plan.subscriptionExpiryLine]
                    : priceLineEntries;
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
                        {linesToRender.map((line, index) => (
                          <li key={`${plan.id}-line-${index}`}>{line}</li>
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
          {shouldShowPlanRailNextNav ? (
            <button
              type="button"
              className={`${styles["subscription-plan-nav"]} ${styles["subscription-plan-nav-next"]}`}
              onClick={() => handlePlanRailNav(1)}
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
              value={formattedRedeemCode}
              onChange={(event) =>
                setRedeemCode(normalizeRedeemCodeInput(event.target.value))
              }
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
      </div>
    </SettingsSection>
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
      subscriptionExpiryLine: PropTypes.string,
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
  defaultSelectedPlanId: PropTypes.string.isRequired,
  onRedeem: PropTypes.func,
  featureColumnLabel: PropTypes.string.isRequired,
};

SubscriptionSection.defaultProps = {
  descriptionId: undefined,
  onRedeem: undefined,
};

export default SubscriptionSection;
