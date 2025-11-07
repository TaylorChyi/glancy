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
