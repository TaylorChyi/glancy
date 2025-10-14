/**
 * 背景：
 *  - 语音按钮此前同样依赖遮罩模板与多分支降级逻辑，导致维护成本高且难以与最新资产库同步。
 * 目的：
 *  - 直接消费 voice-button SVG 资源，提供纯展示组件以贴合最新设计。
 * 关键决策与取舍：
 *  - 放弃遮罩检测与主题分支，统一走静态资源渲染，最大化复用样式层的颜色控制。
 *  - 与 SendIcon 共用 renderStaticIcon 纯函数理念，维持实现一致性但互不依赖旧逻辑。
 * 影响范围：
 *  - ChatInput 语音态按钮图标；删除遮罩逻辑后避免额外的冷却分支干扰。
 * 演进与TODO：
 *  - 若未来语音按钮需要动效，可在组件内部扩展包裹元素而不回退到遮罩方案。
 */
import PropTypes from "prop-types";

import voiceButtonAsset from "@assets/voice-button.svg";
import voiceButtonInline from "@assets/voice-button.svg?raw";

import renderStaticIcon from "./renderStaticIcon.jsx";

const VOICE_ICON_NAME = "voice-button";

export default function VoiceIcon({ className }) {
  return renderStaticIcon({
    className,
    iconName: VOICE_ICON_NAME,
    inline: voiceButtonInline,
    src: voiceButtonAsset,
  });
}

VoiceIcon.propTypes = {
  className: PropTypes.string.isRequired,
};
