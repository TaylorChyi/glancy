/**
 * 背景：
 *  - 前端单测会通过路径别名 `@shared/api/index` 引用真实 API 装配逻辑；
 *    在 Jest 环境下直接加载会触发网络依赖与副作用。
 * 目的：
 *  - 提供一个稳定的空对象桩，隔离对外依赖，确保组件与 hooks 测试聚焦于渲染逻辑。
 * 关键决策与取舍：
 *  - 采用单例空对象避免每次导入都创建新引用，方便在测试中复用或覆写属性；
 *  - 同时导出 `createApi` 以兼容旧有工厂模式调用，降低迁移成本。
 * 影响范围：
 *  - 所有通过 Jest 运行的模块化单测与快照。
 * 演进与TODO：
 *  - 若后续需要更细粒度的接口桩，可在此扩展具名方法或引入特性开关。
 */
const api = {};

function createApi() {
  return api;
}

module.exports = api;
module.exports.default = api;
module.exports.createApi = createApi;
