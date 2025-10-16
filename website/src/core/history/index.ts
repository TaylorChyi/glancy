/**
 * 背景：历史模块新增多个策略与工具文件，需要统一出口以避免上层引用具体实现细节。
 * 目的：集中导出历史领域相关的类型、常量与策略，确保调用方仅依赖稳定接口。
 * 关键决策与取舍：采用扁平 re-export，便于未来在不修改调用方的情况下替换内部实现。
 * 影响范围：core/store 与 features 层可经由此文件获取所需能力。
 * 演进与TODO：可在此扩展服务对象或仓储接口，逐步迈向端口-适配器结构。
 */

export * from "./types.js";
export * from "./utils.js";
export * from "./recordMapper.js";
export * from "./retentionPolicy.js";
