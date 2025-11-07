import { API_PATHS } from "@core/config/api.js";
import { createJsonRequest } from "./client.js";


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
