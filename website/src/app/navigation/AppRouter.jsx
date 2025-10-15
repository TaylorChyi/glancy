/**
 * 文件功能说明：
 * 该文件定义了整个应用的路由系统（AppRouter 组件），
 * 用于根据定义在 ROUTES_BLUEPRINT 配置文件中的路径（path）和组件（component），
 * 动态生成 React Router 的路由映射，并返回对应的可渲染结构。
 *
 * 核心功能与概念解释如下：
 *
 * 一、动态路由配置（Dynamic Routing Configuration）
 * --------------------------------------------
 * - 路由配置不是写死在代码中（如 <Route path="/home" element={<Home />} />），
 *   而是通过一个外部配置文件 ROUTES_BLUEPRINT 动态生成。
 * - ROUTES_BLUEPRINT 是一个数组，每个元素包含 path（路径）与 component（要渲染的组件）。
 * - 这样可以根据业务需求动态增删路由，而无需修改核心路由逻辑。
 *
 * 二、useRoutes Hook（react-router-dom 提供的 Hook）
 * --------------------------------------------
 * - useRoutes 是 React Router v6 提供的 Hook，用于根据传入的路由配置对象，
 *   返回对应的 React 元素树（即所有 <Route> 的组合结果）。
 * - 其返回值会根据当前浏览器地址自动匹配相应的组件。
 * - 语法层面，它取代了以前版本中手动书写多层 <Routes><Route /></Routes> 结构的方式。
 *
 * 三、useMemo Hook（React 内置 Hook）
 * --------------------------------------------
 * - useMemo 用于对计算结果进行缓存（Memoization），仅当依赖项变化时才重新计算。
 * - 在这里，useMemo 用于缓存路由数组（routes），防止每次组件重新渲染时重复 map 计算。
 * - 第二个参数 [] 表示该计算只会在初次渲染时执行一次。
 *
 * 四、动态绑定组件（Dynamic Component Binding）
 * --------------------------------------------
 * - 在 ROUTES_BLUEPRINT 中每个项的 component 字段本质上是一个 React 组件引用（函数或类）。
 * - const RouteComponent = component; 用于将其赋值给本地变量，
 *   以便在 JSX 中以 <RouteComponent /> 的形式动态渲染。
 * - 这属于“组件动态绑定”——即组件在运行时确定，而非在编译时写死。
 *
 * --------------------------------------------
 * 执行流程（逻辑顺序）：
 * 1. 从 ROUTES_BLUEPRINT 中读取所有路由定义。
 * 2. 使用 useMemo 缓存生成的路由结构：
 *    [
 *      { path: "/home", element: <Home /> },
 *      { path: "/about", element: <About /> },
 *      ...
 *    ]
 * 3. 将 routes 传入 useRoutes，自动匹配当前 URL 并渲染对应组件。
 * 4. 导出 AppRouter 作为整个应用的路由入口组件。
 */

import { useMemo } from "react";
import { useRoutes } from "react-router-dom";
import ROUTES_BLUEPRINT from "./config";

function AppRouter() {
  // useMemo 缓存路由结构，只在首次渲染时生成
  const routes = useMemo(
    () =>
      ROUTES_BLUEPRINT.map(({ path, component }) => {
        const RouteComponent = component; // 动态绑定组件引用
        return {
          path,
          element: <RouteComponent />, // 动态渲染组件
        };
      }),
    [], // 无依赖项，表示只执行一次
  );

  // useRoutes 根据当前 URL 匹配并返回对应的路由组件结构
  return useRoutes(routes);
}

export default AppRouter;
