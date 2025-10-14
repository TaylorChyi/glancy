import { useMemo } from "react";
import { useRoutes } from "react-router-dom";
import ROUTES_BLUEPRINT from "./config";

function AppRouter() {
  const routes = useMemo(
    () =>
      ROUTES_BLUEPRINT.map(({ path, component }) => {
        const RouteComponent = component;

        return {
          path,
          element: <RouteComponent />,
        };
      }),
    [],
  );

  return useRoutes(routes);
}

export default AppRouter;
