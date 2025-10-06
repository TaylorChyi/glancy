import { API_PATHS } from "@/config/api.js";
import { createJsonRequest } from "./client.js";

/**
 * 背景：
 *  - 举报通道需要独立的 API 客户端以便在不同上下文复用，并隔离调用协议。
 * 目的：
 *  - 提供专用的提交方法，未来可扩展查询、分页等能力。
 * 关键决策与取舍：
 *  - 与其他模块保持一致，优先暴露工厂函数以便测试时注入自定义 request。
 */
export function createWordReportsApi(request) {
  const jsonRequest = createJsonRequest(request);

  const submitWordReport = ({
    token,
    term,
    language,
    flavor,
    category,
    description,
    sourceUrl,
  }) =>
    jsonRequest(API_PATHS.wordReports, {
      method: "POST",
      token,
      body: {
        term,
        language,
        flavor,
        category,
        description,
        sourceUrl,
      },
    });

  return { submitWordReport };
}

export const { submitWordReport } = createWordReportsApi();
