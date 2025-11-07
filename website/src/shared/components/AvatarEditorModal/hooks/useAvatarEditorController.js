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
