/**
 * 背景：
 *  - 该文件曾承载完整的导出实现，体量巨大导致 lint 规则豁免。
 * 目的：
 *  - 保留向后兼容的入口，同时将实现迁移至 historyExport 模块化目录。
 * 关键决策与取舍：
 *  - 通过 re-export 降低文件复杂度，恢复 eslint 结构化校验；
 *  - 真实逻辑下沉后，可逐步在调用方改为直接指向新目录。
 * 影响范围：
 *  - 偏好设置数据导出的引用路径；其余逻辑保持不变。
 * 演进与TODO：
 *  - 待调用方完成路径切换后，可考虑移除此转发表。
 */

export {
  DefinitionsByChapterCsvSerializer,
  definitionsByChapterCsvSerializer,
  __INTERNAL__,
} from "./historyExport/index.js";
