/**
 * 背景：
 *  - 头像上传需要在裁剪前确保原始图片方向正确，否则用户在不同设备上看到的预览与结果会出现偏差。
 * 目的：
 *  - 提供统一的图片方向归一化工具，将 EXIF 方向信息转化为真实像素数据，方便后续裁剪与上传流程复用。
 * 关键决策与取舍：
 *  - 优先使用浏览器原生的 createImageBitmap 以利用底层优化；若不可用，则解析 EXIF 并以 Canvas 方式手动旋转。拒绝引入第三方库以控制包体积。
 * 影响范围：
 *  - 头像裁剪、未来可能的图片编辑功能均可使用本工具输出的 Blob 与尺寸信息。
 * 演进与TODO：
 *  - TODO: 若后续接入 HEIC/AVIF，需要扩展 EXIF 解析策略与 MIME 支持。
 */
const DEFAULT_OUTPUT_TYPE = "image/png";

const ORIENTATION = Object.freeze({
  normal: 1,
});

const ensureCanvas = () => {
  if (typeof document === "undefined") {
    return null;
  }
  return document.createElement("canvas");
};

const toBlobFromCanvas = (canvas, type = DEFAULT_OUTPUT_TYPE) =>
  new Promise((resolve, reject) => {
    if (!canvas) {
      reject(new Error("avatar-editor-missing-canvas"));
      return;
    }
    const mimeType = typeof type === "string" && type.startsWith("image/") ? type : DEFAULT_OUTPUT_TYPE;
    if (typeof canvas.toBlob === "function") {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("avatar-editor-blob-empty"));
          }
        },
        mimeType,
        0.95,
      );
      return;
    }
    try {
      const dataUrl = canvas.toDataURL(mimeType, 0.95);
      const commaIndex = dataUrl.indexOf(",");
      const base64 = dataUrl.slice(commaIndex + 1);
      const binary = atob(base64);
      const buffer = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) {
        buffer[index] = binary.charCodeAt(index);
      }
      resolve(new Blob([buffer], { type: mimeType }));
    } catch (error) {
      reject(error);
    }
  });

const loadImageElement = (blob) =>
  new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("avatar-editor-missing-window"));
      return;
    }
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      resolve({ image, revoke: () => URL.revokeObjectURL(url) });
    };
    image.onerror = (event) => {
      URL.revokeObjectURL(url);
      reject(event instanceof Error ? event : new Error("avatar-editor-image-load"));
    };
    image.src = url;
  });

const drawImageWithOrientation = async (image, orientation, mimeType) => {
  const canvas = ensureCanvas();
  if (!canvas) {
    throw new Error("avatar-editor-canvas-unavailable");
  }
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("avatar-editor-context-unavailable");
  }
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  const swapDimensions = orientation >= 5 && orientation <= 8;
  canvas.width = swapDimensions ? height : width;
  canvas.height = swapDimensions ? width : height;

  context.save();
  switch (orientation) {
    case 2: {
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
      break;
    }
    case 3: {
      context.translate(canvas.width, canvas.height);
      context.rotate(Math.PI);
      break;
    }
    case 4: {
      context.translate(0, canvas.height);
      context.scale(1, -1);
      break;
    }
    case 5: {
      context.rotate(0.5 * Math.PI);
      context.scale(1, -1);
      break;
    }
    case 6: {
      context.rotate(0.5 * Math.PI);
      context.translate(0, -height);
      break;
    }
    case 7: {
      context.rotate(0.5 * Math.PI);
      context.translate(width, -height);
      context.scale(-1, 1);
      break;
    }
    case 8: {
      context.rotate(-0.5 * Math.PI);
      context.translate(-width, 0);
      break;
    }
    default:
      break;
  }
  context.drawImage(image, 0, 0);
  context.restore();
  const blob = await toBlobFromCanvas(canvas, mimeType);
  return { blob, width: canvas.width, height: canvas.height };
};

const readExifOrientation = async (blob) => {
  if (!(blob instanceof Blob)) {
    return ORIENTATION.normal;
  }
  try {
    const arrayBuffer = await blob.slice(0, 131072).arrayBuffer();
    const view = new DataView(arrayBuffer);
    if (view.byteLength < 2 || view.getUint16(0, false) !== 0xffd8) {
      return ORIENTATION.normal;
    }
    let offset = 2;
    while (offset + 9 < view.byteLength) {
      const marker = view.getUint16(offset, false);
      offset += 2;
      if (marker === 0xffe1) {
        const length = view.getUint16(offset, false);
        offset += 2;
        if (offset + length > view.byteLength) {
          break;
        }
        const exifHeader = view.getUint32(offset, false);
        if (exifHeader !== 0x45786966) {
          offset += length - 2;
          continue;
        }
        offset += 6;
        const littleEndian = view.getUint16(offset, false) === 0x4949;
        offset += 2;
        if (view.getUint16(offset, littleEndian) !== 0x002a) {
          break;
        }
        offset += 2;
        const firstIfdOffset = view.getUint32(offset, littleEndian);
        if (firstIfdOffset < 0x00000008) {
          break;
        }
        let ifdOffset = offset - 4 + firstIfdOffset;
        if (ifdOffset > view.byteLength) {
          break;
        }
        const numberOfEntries = view.getUint16(ifdOffset, littleEndian);
        for (let index = 0; index < numberOfEntries; index += 1) {
          const entryOffset = ifdOffset + 2 + index * 12;
          if (entryOffset + 12 > view.byteLength) {
            break;
          }
          const tag = view.getUint16(entryOffset, littleEndian);
          if (tag === 0x0112) {
            return view.getUint16(entryOffset + 8, littleEndian);
          }
        }
        break;
      }
      if ((marker & 0xff00) !== 0xff00) {
        break;
      }
      const segmentLength = view.getUint16(offset, false);
      offset += segmentLength;
    }
    return ORIENTATION.normal;
  } catch {
    return ORIENTATION.normal;
  }
};

const drawBitmap = async (bitmap, mimeType) => {
  const canvas = ensureCanvas();
  if (!canvas) {
    throw new Error("avatar-editor-canvas-unavailable");
  }
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("avatar-editor-context-unavailable");
  }
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  context.drawImage(bitmap, 0, 0);
  const blob = await toBlobFromCanvas(canvas, mimeType);
  return { blob, width: bitmap.width, height: bitmap.height };
};

export async function normalizeImageOrientation(blob) {
  if (!blob) {
    throw new Error("avatar-editor-empty-blob");
  }
  const mimeType = blob.type && blob.type.startsWith("image/") ? blob.type : DEFAULT_OUTPUT_TYPE;
  if (typeof window === "undefined") {
    return { blob, width: 0, height: 0 };
  }

  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(blob, { imageOrientation: "from-image" });
      const result = await drawBitmap(bitmap, mimeType);
      if (typeof bitmap.close === "function") {
        bitmap.close();
      }
      return result;
    } catch {
      // 回退到手动解析流程。
    }
  }

  const { image, revoke } = await loadImageElement(blob);
  try {
    const orientation =
      typeof blob.type === "string" && blob.type.toLowerCase() === "image/jpeg"
        ? await readExifOrientation(blob)
        : ORIENTATION.normal;
    const result = await drawImageWithOrientation(image, orientation, mimeType);
    return result;
  } finally {
    if (typeof revoke === "function") {
      revoke();
    }
  }
}

export default normalizeImageOrientation;
