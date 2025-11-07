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
