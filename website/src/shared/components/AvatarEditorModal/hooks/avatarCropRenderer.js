/**
 * 背景：
 *  - Canvas 绘制逻辑需在多处重用，放在 hook 内导致体积膨胀。
 * 目的：
 *  - 提供纯函数处理裁剪渲染，便于复用与单测。
 * 关键决策与取舍：
 *  - 保持输出 Blob 与预览地址的二元组；
 *  - 遇到 Canvas 初始化失败时抛出语义化错误，方便上层捕获。
 * 影响范围：
 *  - AvatarEditorModal 裁剪导出流程。
 * 演进与TODO：
 *  - 可在此处扩展更多导出格式或质量参数。
 */

import { OUTPUT_SIZE } from "../constants.js";
import { ensureCanvas } from "../utils.js";

const renderCroppedAvatar = async ({ image, cropRect }) => {
  const canvas = ensureCanvas();
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("avatar-editor-context-missing");
  }

  ctx.drawImage(
    image,
    cropRect.x,
    cropRect.y,
    cropRect.width,
    cropRect.height,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE,
  );

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) {
        resolve(result);
      } else {
        reject(new Error("avatar-editor-blob-null"));
      }
    }, "image/png");
  });

  return { blob, previewUrl: URL.createObjectURL(blob) };
};

export default renderCroppedAvatar;
