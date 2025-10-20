/**
 * 背景：
 *  - 既有发送按钮图标依赖遮罩检测与多级降级策略，逻辑冗长且与设计稿当前的单色 SVG 方案不再匹配。
 * 目的：
 *  - 以静态资源直出方式渲染 send-button 图标，配合按钮样式直接继承主题色，减少运行时分支。
 * 关键决策与取舍：
 *  - 采用简单的静态渲染器而非模板方法，确保本次重构与旧有遮罩逻辑完全解耦。
 *  - 通过语义化常量集中定义 data 属性，避免魔法字符串散落。
 * 影响范围：
 *  - ChatInput 发送按钮的图标渲染；去除遮罩探测后减少潜在兼容分支。
 * 演进与TODO：
 *  - 如后续需要根据主题切换多份资源，可在 renderStaticIcon 中扩展 src 选择策略。
 */
import PropTypes from "prop-types";

import sendButtonAsset from "@assets/interface/controls/send-button.svg";
import sendButtonInline from "@assets/interface/controls/send-button.svg?raw";

import renderStaticIcon from "./renderStaticIcon.jsx";

const SEND_ICON_NAME = "send-button";

export default function SendIcon({ className }) {
  return renderStaticIcon({
    className,
    iconName: SEND_ICON_NAME,
    inline: sendButtonInline,
    src: sendButtonAsset,
  });
}

SendIcon.propTypes = {
  className: PropTypes.string.isRequired,
};
