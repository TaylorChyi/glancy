/**
 * 背景：
 *  - 快捷键工具拆分为多模块后，需要一个集中常量定义处避免魔法字符串分散。
 * 目的：
 *  - 暴露修饰键集合与排序约束，供归一化、事件匹配等模块共享。
 * 关键决策与取舍：
 *  - 选择以 Set/数组结构承载，兼顾查找效率与序列稳定性；
 *  - 未引入类实例，保持纯数据结构便于日后在 server 侧复用同一常量。
 * 影响范围：
 *  - 所有快捷键相关工具模块引用此文件共享统一常量。
 * 演进与TODO：
 *  - 如需支持序列快捷键或平台自定义排序，可在此扩展配置接口。
 */
export const MODIFIER_SET = new Set(["MOD", "CONTROL", "META", "ALT", "SHIFT"]);

export const MODIFIER_ORDER = ["MOD", "CONTROL", "META", "ALT", "SHIFT"];
