/**
 * 背景：
 *  - Profile 与 Preferences 模块均需在上传前重命名用户头像文件，
 *    但此前逻辑散落在页面组件内，导致重复实现且难以维护。
 * 目的：
 *  - 提供集中化的头像文件名规范化工具，便于多处复用并统一扩展策略。
 * 关键决策与取舍：
 *  - 采用纯函数输出以保持可测试性，拒绝直接依赖 DOM 状态；
 *  - 支持常见图片 MIME 类型的扩展映射，未来若引入 HEIC 等格式可在此处增补。
 * 影响范围：
 *  - 所有触发头像上传的入口都会通过此函数生成安全的文件名。
 * 演进与TODO：
 *  - TODO: 如需接入版本号或用户 ID，可在调用侧通过装饰器模式扩展。
 */

const MIME_EXTENSION_MAP = Object.freeze({
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
});

const DEFAULT_FILE_NAME = "avatar.png";

/**
 * 意图：
 *  - 根据 MIME 类型推导安全的头像文件名，移除非法字符并附带正确扩展名。
 * 输入：
 *  - originalName?: 源文件名，可为空；
 *  - mimeType?: MIME 类型，用于判定扩展名。
 * 输出：
 *  - 经过清洗与补全扩展名后的文件名字符串。
 * 流程：
 *  1) 过滤非法字符、折叠多余的连接符；
 *  2) 根据 MIME 类型映射确定扩展名；
 *  3) 若原始文件名已包含正确扩展名则直接返回。
 * 错误处理：
 *  - 缺失 MIME 类型时回退到 png 扩展名。
 * 复杂度：O(n)，与文件名长度成线性关系。
 */
export function normalizeAvatarFileName(originalName, mimeType) {
  const fallbackBase = "avatar";
  const sanitized = (originalName || fallbackBase)
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
  const base = sanitized || fallbackBase;
  const extension = MIME_EXTENSION_MAP[mimeType] || "png";
  const lowerBase = base.toLowerCase();
  if (lowerBase.endsWith(`.${extension}`)) {
    return base;
  }
  const withoutExt = base.includes(".")
    ? base.slice(0, base.lastIndexOf("."))
    : base;
  const safeBase = withoutExt || fallbackBase;
  return `${safeBase}.${extension}`;
}

export function resolveAvatarFallbackName() {
  return DEFAULT_FILE_NAME;
}

export default normalizeAvatarFileName;
