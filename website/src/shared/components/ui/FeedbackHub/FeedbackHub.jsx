/**
 * 背景：
 *  - 多个页面与特性模块分别渲染 MessagePopup 与 Toast，
 *    造成反馈层结构分散且难以统一扩展。
 * 目的：
 *  - 提供可组合的反馈容器，将弹窗与轻提示的装配职责下沉到共享层，
 *    以便后续按需挂载更多反馈类型。
 * 关键决策与取舍：
 *  - 采用策略模式集中管理不同反馈类型的渲染策略，
 *    相比在调用端硬编码条件渲染，可显著降低重复代码与耦合度；
 *  - 放弃一次性实现全局总线，改以可配置策略保持组件轻量，
 *    更契合当前站点规模且便于渐进演进。
 * 影响范围：
 *  - 使用 MessagePopup/Toast 的各页面与特性模块改为经由该容器装配。
 * 演进与TODO：
 *  - TODO: 若未来需要支持进度条或全局通知，可扩展策略映射并引入优先级队列。
 */
import PropTypes from "prop-types";
import MessagePopup from "@shared/components/ui/MessagePopup";
import Toast from "@shared/components/ui/Toast";

const SURFACE_STRATEGIES = Object.freeze({
  popup: (config, key) => {
    const { actions, renderActions, onClose, message, open, ...rest } = config;
    const resolvedActions =
      typeof renderActions === "function"
        ? renderActions({ close: onClose, message })
        : (actions ?? null);

    return (
      <MessagePopup
        key={key}
        open={open}
        message={message}
        onClose={onClose}
        {...rest}
      >
        {resolvedActions}
      </MessagePopup>
    );
  },
  toast: (config, key) => {
    const { open, message, onClose, ...rest } = config;
    return (
      <Toast
        key={key}
        open={open}
        message={message}
        onClose={onClose}
        {...rest}
      />
    );
  },
});

/**
 * 意图：统一渲染跨页面复用的反馈层，降低重复 UI 代码。
 * 输入：
 *  - popup/toast：可选的反馈配置，包含各自的打开状态、文案与关闭回调。
 *  - surfaces：扩展插槽，可注入自定义策略支持的其他反馈类型。
 * 输出：
 *  - 返回组合后的反馈节点集合。
 * 流程：
 *  1) 归一化配置为策略输入列表；
 *  2) 基于策略映射逐一渲染对应反馈组件；
 *  3) 忽略未知类型，确保扩展安全。
 * 错误处理：调用方若遗漏 onClose，将沿用组件默认行为；未知类型会被静默跳过。
 * 复杂度：O(n) —— n 为反馈项数量，当前常数极小。
 */
export default function FeedbackHub({ popup, toast, surfaces }) {
  const normalizedSurfaces = [];
  if (popup) {
    normalizedSurfaces.push({ type: "popup", config: popup, key: "popup" });
  }
  if (toast) {
    normalizedSurfaces.push({ type: "toast", config: toast, key: "toast" });
  }
  if (Array.isArray(surfaces)) {
    normalizedSurfaces.push(...surfaces);
  }

  return (
    <>
      {normalizedSurfaces.map((surface, index) => {
        const { type, config, key } = surface;
        const renderSurface = SURFACE_STRATEGIES[type];
        if (typeof renderSurface !== "function") {
          return null;
        }
        const strategyKey = key ?? `${type}-${index}`;
        return renderSurface(config, strategyKey);
      })}
    </>
  );
}

const popupConfigShape = {
  open: PropTypes.bool.isRequired,
  message: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  actions: PropTypes.node,
  renderActions: PropTypes.func,
};

const toastConfigShape = {
  open: PropTypes.bool.isRequired,
  message: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  duration: PropTypes.number,
  backgroundColor: PropTypes.string,
  textColor: PropTypes.string,
  closeLabel: PropTypes.string,
};

FeedbackHub.propTypes = {
  popup: PropTypes.shape(popupConfigShape),
  toast: PropTypes.shape(toastConfigShape),
  surfaces: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.oneOf(Object.keys(SURFACE_STRATEGIES)).isRequired,
      config: PropTypes.object.isRequired,
      key: PropTypes.string,
    }),
  ),
};

FeedbackHub.defaultProps = {
  popup: undefined,
  toast: undefined,
  surfaces: undefined,
};
