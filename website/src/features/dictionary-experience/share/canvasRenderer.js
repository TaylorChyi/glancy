/**
 * 背景：
 *  - 渲染流程从单体文件拆分后，需要一个协调入口调用布局算法与资源绘制。
 * 目的：
 *  - 提供高层渲染门面，负责创建 Canvas、填充背景并委托布局与页脚逻辑。
 * 关键决策与取舍：
 *  - 将测量与绘制子流程委托给独立模块，保持单一职责；
 *  - 保持 API 纯粹，仅暴露 renderShareDocument 供外部调用。
 * 影响范围：
 *  - 分享图片导出流程的渲染阶段。
 * 演进与TODO：
 *  - 日后可在此接入更多渲染策略（如 WebGL、SVG）。
 */

import {
  CANVAS_WIDTH,
  CONTENT_PADDING_X,
  CONTENT_PADDING_Y,
} from "./canvasTheme.js";
import {
  drawDocumentBody,
  measureDocumentHeight,
  wrapLine,
  drawTextBlock,
} from "./canvasLayout.js";
import { drawFooter, loadImage, drawAvatarFallback } from "./canvasAssets.js";

const createCanvasContext = (width, height) => {
  if (typeof document === "undefined") {
    throw new Error("canvas-unavailable");
  }
  const canvas = document.createElement("canvas");
  const scale = Math.min(window?.devicePixelRatio || 1, 2);
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("canvas-context-unavailable");
  }
  ctx.scale(scale, scale);
  ctx.textBaseline = "top";
  ctx.fillStyle = "#000";
  return { canvas, ctx, scale };
};

export async function renderShareDocument({
  documentModel,
  appName,
  user,
  shareLabel,
  assets,
}) {
  const measurementCanvas = document.createElement("canvas");
  const measurementCtx = measurementCanvas.getContext("2d");
  if (!measurementCtx) {
    throw new Error("canvas-context-unavailable");
  }
  measurementCtx.textBaseline = "top";
  measurementCtx.fillStyle = "#000";
  const totalHeight = measureDocumentHeight(measurementCtx, documentModel);
  const { ctx, canvas } = createCanvasContext(CANVAS_WIDTH, totalHeight);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, CANVAS_WIDTH, totalHeight);
  ctx.fillStyle = "#000";

  const contentWidth = CANVAS_WIDTH - CONTENT_PADDING_X * 2;
  drawDocumentBody({
    ctx,
    documentModel,
    contentWidth,
    startY: CONTENT_PADDING_Y,
  });

  await drawFooter({
    ctx,
    totalHeight,
    appName: appName || "Glancy",
    user,
    shareLabel,
    assets,
  });

  return { canvas, totalHeight };
}

export const __INTERNAL__ = Object.freeze({
  createCanvasContext,
  drawDocumentBody,
  drawTextBlock,
  measureDocumentHeight,
  drawFooter,
  loadImage,
  drawAvatarFallback,
  wrapLine,
});
