/**
 * 背景：
 *  - 多处需要从 FileList 或可迭代对象中提取文件，之前散落的实现存在重复与易错判断。
 * 目的：
 *  - 提供集中且可组合的文件列表归一化工具，确保头像上传、图片裁剪等流程遵循同一约定。
 * 关键决策与取舍：
 *  - 函数保持纯净且不依赖 DOM，便于在 Node 环境的单测中复用；拒绝引入类库以维持轻量。
 * 影响范围：
 *  - 使用文件选择的 Hook 与组件可共享该工具，减少重复逻辑。 
 * 演进与TODO：
 *  - TODO: 若后续需要过滤文件类型或大小，可在此处扩展策略接口。
 */
export function normalizeFiles(candidates) {
  if (!candidates) {
    return [];
  }

  if (typeof candidates[Symbol.iterator] === "function") {
    return Array.from(candidates).filter(Boolean);
  }

  if (typeof candidates.length === "number") {
    return Array.from({ length: candidates.length }, (_, index) => candidates[index]).filter(Boolean);
  }

  return Array.isArray(candidates) ? candidates.filter(Boolean) : [candidates];
}

export default normalizeFiles;
