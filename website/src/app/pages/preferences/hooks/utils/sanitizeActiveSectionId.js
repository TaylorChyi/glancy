/**
 * 背景：
 *  - 偏好设置页面需在页面级与模态级共享分区数组，激活分区的回退逻辑之前散落各处。
 * 目的：
 *  - 将分区 id 清洗策略沉淀成纯函数，保证任何入口都能复用一致的兜底规则。
 * 关键决策与取舍：
 *  - 采用函数参数而非闭包依赖，降低对 React 环境的耦合；
 *  - 默认回退至首个未禁用分区，保持可访问性体验。
 * 影响范围：
 *  - 偏好设置页面与设置模态。
 * 演进与TODO：
 *  - 后续可支持优先级权重或根据用户权限过滤分区时在此扩展。
 */
export const sanitizeActiveSectionId = (candidateId, sections) => {
  if (!sections || sections.length === 0) {
    return "";
  }
  const fallback = sections.find((section) => !section.disabled) ?? sections[0];
  if (!candidateId) {
    return fallback.id;
  }
  const matched = sections.find(
    (section) => section.id === candidateId && !section.disabled,
  );
  return matched ? matched.id : fallback.id;
};
