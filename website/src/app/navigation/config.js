/**
 * 文件功能说明：
 * 本文件用于集中定义整个应用的“路由蓝图”（ROUTES_BLUEPRINT），
 * 即路径（path）与对应组件（component）的映射表。
 * 该配置文件会被 AppRouter 动态读取，用于生成 React Router 的路由规则。
 *
 * -----------------------------------------------------
 * 一、Object.freeze()
 * -----------------------------------------------------
 * - Object.freeze() 用于冻结对象，使其属性不可被修改、添加或删除。
 * - 这样可以防止在运行时对路由配置进行误改，保证路由表的稳定性与可预测性。
 * - const 锁定“名字与引用的绑定”；
 * - Object.freeze() 锁定“对象的结构与值”。
 * -----------------------------------------------------
 * 二、lazy() 函数（React 内置懒加载方法）
 * -----------------------------------------------------
 * - lazy() 是 React 提供的动态加载组件函数，支持代码分割（Code Splitting）。
 * - 写法：lazy(() => import("路径"))
 *   表示该组件不会在应用启动时立即加载，而是在真正访问对应路由时才按需加载。
 * - 这样可以显著减少首屏加载体积（即减少主包体积），提高页面加载性能。
 *
 * -----------------------------------------------------
 * 三、路由项结构说明（每个对象的含义）
 * -----------------------------------------------------
 * {
 *   path: "/",                             // 路由路径，对应浏览器地址栏中的 URL
 *   component: lazy(() => import(...)),    // 动态导入并懒加载的组件
 * }
 *
 * 示例：
 * - 当访问 "/" 时，动态加载并渲染 @app/pages/App 页面；
 * - 当访问 "/login" 时，加载登录页组件；
 * - 当访问 "/register" 时，加载注册页组件；
 * - 当访问任意未匹配路径 "*" 时，加载通用 FallbackRedirect 组件（即“404 重定向”逻辑）。
 *
 * -----------------------------------------------------
 * 四、export 与 export default 区别
 * -----------------------------------------------------
 * - `export const ROUTES_BLUEPRINT = ...`：
 *   导出一个命名变量，意味着可在其它文件中通过 `import { ROUTES_BLUEPRINT } from "./config"` 引入。
 *
 * - `export default ROUTES_BLUEPRINT;`
 *   导出默认对象，使得在其它文件中可以通过简写 `import ROUTES_BLUEPRINT from "./config"` 引入。
 *
 * 两者的区别：
 * - 命名导出（export）需要使用花括号导入；
 * - 默认导出（export default）无需花括号。
 * - 同一个文件可以有多个命名导出，但只能有一个默认导出。
 *
 * 这里同时使用两种导出形式是为了兼容不同的导入方式，
 * 便于在不同模块体系（ESM/CommonJS）或旧版本工具链中统一引用。
 */

import { lazy } from "react";

export const ROUTES_BLUEPRINT = Object.freeze([
  {
    path: "/",
    component: lazy(() => import("@app/pages/App")), // 懒加载主应用页面
  },
  {
    path: "/login",
    component: lazy(() => import("@app/pages/auth/Login")), // 懒加载登录页
  },
  {
    path: "/register",
    component: lazy(() => import("@app/pages/auth/Register")), // 懒加载注册页
  },
  {
    path: "*",
    component: lazy(() => import("@shared/components/FallbackRedirect.jsx")), // 未匹配路径时的兜底页（404）
  },
]);

// 默认导出，使其它文件可直接通过 import ROUTES_BLUEPRINT from "./config" 引入
export default ROUTES_BLUEPRINT;
