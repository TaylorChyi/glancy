/**
 * 背景：
 *  - 头像裁剪模态原先在 index.jsx 内散落常量定义，修改时需全文件查找，
 *    难以维持参数的一致性与复用。
 * 目的：
 *  - 提供集中配置点并暴露语义化创建函数，减少“魔法数字”对 UI 与几何逻辑的侵入。
 * 关键决策与取舍：
 *  - 采用常量 + 工厂函数组合：常量确保几何算法使用同一来源，
 *    工厂函数便于针对多语言覆盖默认标签；
 *  - 保持纯函数实现，避免引入额外状态以利于单测与未来扩展旋转/镜像能力。
 * 影响范围：
 *  - AvatarEditorModal 组件及后续可能复用头像裁剪逻辑的入口。
 * 演进与TODO：
 *  - 若新增更多可配置文案或参数，应在此集中维护并补充对应注释说明取值范围。
 */

export const DEFAULT_VIEWPORT_SIZE = 320;
export const OUTPUT_SIZE = 512;
export const MIN_ZOOM = 1;
export const MAX_ZOOM = 3;
export const ZOOM_STEP = 0.2;

const DEFAULT_LABELS = {
  title: "调整头像位置",
  description: "拖动图片以确认正方向，放大后可观察正方形及其内切圆的呈现。",
  zoomIn: "放大",
  zoomOut: "缩小",
  cancel: "取消",
  confirm: "确认",
};

/**
 * 意图：生成带有兜底值的本地化文案集合，避免在组件中散落手动合并逻辑。
 * 输入：labels - 外部传入的标签对象，可缺省；
 * 输出：合并后的标签对象，保持引用稳定性以方便 memo 化。
 * 流程：
 *  1) 若外部为空对象或 undefined，直接返回 DEFAULT_LABELS；
 *  2) 使用展开运算合并，后写覆盖前写，保证调用者可覆盖默认值。
 * 错误处理：无副作用，仅处理浅合并；
 * 复杂度：O(n) 与属性数量线性相关。
 */
export const createMergedLabels = (labels = {}) => ({
  ...DEFAULT_LABELS,
  ...labels,
});
