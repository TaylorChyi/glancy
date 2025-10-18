/**
 * 背景：
 *  - Canvas 渲染各阶段共享字体、间距等排版常量，过去散落在单一文件难以复用与统一调整。
 * 目的：
 *  - 提供集中管理的设计令牌，确保布局、页脚与文本换行共享一致参数。
 * 关键决策与取舍：
 *  - 常量命名与 UI 语义对齐，便于未来接入主题配置或特性开关；
 *  - 暂不抽象为类，仅导出纯数据对象，保持轻量易用。
 * 影响范围：
 *  - 词典分享图渲染模块的排版计算与绘制。
 * 演进与TODO：
 *  - 日后可扩展主题枚举，通过策略模式加载不同的主题常量。
 */

export const FONT_STACK = `'Pretendard', 'Noto Sans SC', 'PingFang SC', 'Helvetica Neue', Arial, sans-serif`;
export const TITLE_FONT = `600 48px ${FONT_STACK}`;
export const SECTION_FONT = `600 28px ${FONT_STACK}`;
export const BODY_FONT = `400 26px ${FONT_STACK}`;
export const FOOTER_FONT = `500 24px ${FONT_STACK}`;

export const CANVAS_WIDTH = 1080;
export const CONTENT_PADDING_X = 96;
export const CONTENT_PADDING_Y = 128;
export const SECTION_SPACING = 48;
export const LINE_SPACING = 40;
export const FOOTER_HEIGHT = 176;
export const AVATAR_SIZE = 88;
export const ICON_SIZE = 72;
