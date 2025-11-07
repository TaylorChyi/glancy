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
