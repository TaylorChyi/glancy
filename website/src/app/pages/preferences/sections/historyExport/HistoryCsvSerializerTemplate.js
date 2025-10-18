/**
 * 背景：
 *  - 偏好设置页面存在多种导出变体，需要统一的 CSV 序列化骨架。
 * 目的：
 *  - 定义模板方法基类，约束子类提供表头与数据行生成逻辑。
 * 关键决策与取舍：
 *  - 通过抽象类模式控制扩展点，避免散落的 util 函数难以维护；
 *  - 仍以函数式返回字符串，兼容现有下载流程。
 * 影响范围：
 *  - 所有依赖历史导出的 CSV 策略实现。
 * 演进与TODO：
 *  - 若未来支持流式写入，可在 serialize 中引入迭代器输出。
 */

import { toCsvRow } from "./csvPrimitives.js";

export class HistoryCsvSerializerTemplate {
  /**
   * 意图：驱动模板方法，组装表头与数据行并输出 CSV 字符串。
   * 输入：历史条目数组、上下文对象。
   * 输出：CSV 文本。
   * 流程：
   *  1) 生成表头；
   *  2) 迭代子类返回的数据行；
   *  3) 通过 csv 原语拼接为字符串。
   */
  serialize(historyItems, context) {
    const rows = [];
    const safeHistory = Array.isArray(historyItems) ? historyItems : [];
    const header = this.buildHeader(context);
    if (header && header.length > 0) {
      rows.push(header);
    }
    this.buildRows(safeHistory, context).forEach((row) => {
      if (Array.isArray(row) && row.length > 0) {
        rows.push(row);
      }
    });
    return rows.map((row) => toCsvRow(row)).join("\r\n");
  }

  buildHeader() {
    throw new Error(
      `${this.constructor.name} must implement buildHeader(context)`,
    );
  }

  buildRows() {
    throw new Error(
      `${this.constructor.name} must implement buildRows(historyItems, context)`,
    );
  }
}
