/**
 * 背景：
 *  - 分享图导出流程原先集成数据整形与 Canvas 渲染在单一文件中，难以维护并阻碍结构化 lint 收敛。
 * 目的：
 *  - 作为门面（Facade）协调文档建造与渲染器，向外提供稳定的导出接口。
 * 关键决策与取舍：
 *  - 通过文档模型与渲染器两个子模块分离关注点，并在此聚合错误处理与下载副作用；
 *  - 保持现有 API 形态以兼容调用方，同时在 __INTERNAL__ 中再导出子模块能力，便于既有单测复用。
 * 影响范围：
 *  - DictionaryExperience 分享菜单；调用方无需感知内部拆分。
 * 演进与TODO：
 *  - 后续可在此接入不同导出策略（PDF/主题），并通过特性开关切换具体渲染器实现。
 */

import { buildShareDocument, __INTERNAL__ as DocumentInternal } from "./documentModel.js";
import { renderShareDocument, __INTERNAL__ as CanvasInternal } from "./canvasRenderer.js";
import { toTrimmedString } from "./documentFormatting.js";

export async function exportDictionaryShareImage({
  term,
  entry,
  finalText,
  t,
  user,
  appName,
}) {
  const documentModel = buildShareDocument({ term, entry, finalText, t });
  if (!documentModel.title && documentModel.sections.length === 0) {
    return { status: "empty" };
  }

  const { canvas } = await renderShareDocument({
    documentModel,
    appName,
    user,
    shareLabel: t.share || "Share",
  });

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) {
          resolve(result);
        } else {
          reject(new Error("blob-failed"));
        }
      },
      "image/png",
      0.95,
    );
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const safeTerm = toTrimmedString(term) || "glancy-entry";
  link.download = `${safeTerm}-glancy.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { status: "success" };
}

export const __INTERNAL__ = Object.freeze({
  ...DocumentInternal,
  ...CanvasInternal,
  buildShareDocument,
  renderShareDocument,
});
