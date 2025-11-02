/**
 * 背景：
 *  - AvatarEditorModal 之前将状态管理、几何推导与事件处理全部堆叠在单一组件，
 *    文件体积庞大且难以测试，触发 lint 结构化债务豁免。
 * 目的：
 *  - 通过控制器钩子协调视口、指针、缩放与裁剪逻辑，保持展示层纯净。
 * 关键决策与取舍：
 *  - 依赖 useControllerDependencies 聚合子能力，再通过工厂函数输出统一结构；
 *  - 保持函数体 < 60 行，以满足结构化 lint 要求。
 * 影响范围：
 *  - AvatarEditorModal 组件的容器逻辑。
 * 演进与TODO：
 *  - 后续可引入键盘交互或特性开关，在此统一串联。
 */

import { useMemo } from "react";
import { createMergedLabels } from "../constants.js";
import controllerStateFactory from "./controllerStateFactory.js";
import useControllerDependencies from "./useControllerDependencies.js";

const useAvatarEditorController = (props) => {
  const mergedLabels = useMemo(
    () => createMergedLabels(props.labels),
    [props.labels],
  );
  const dependencies = useControllerDependencies(props);
  return controllerStateFactory({ ...dependencies, mergedLabels });
};

export default useAvatarEditorController;
