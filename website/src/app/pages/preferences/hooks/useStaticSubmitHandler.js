/**
 * 背景：
 *  - 偏好设置表单需要阻止浏览器默认提交行为，逻辑若散落会导致重复实现。
 * 目的：
 *  - 提供稳定的 onSubmit 处理器，确保所有入口都能优雅阻止默认刷新。
 * 关键决策与取舍：
 *  - 采用 useCallback 保持引用稳定，以避免子组件重复渲染。
 * 影响范围：
 *  - 偏好设置页面及模态中的表单容器。
 * 演进与TODO：
 *  - 后续可在此扩展可观测性，例如埋点记录被阻止的提交事件。
 */
import { useCallback } from "react";

export const useStaticSubmitHandler = () =>
  useCallback((event) => {
    if (event && typeof event.preventDefault === "function") {
      event.preventDefault();
    }
  }, []);
