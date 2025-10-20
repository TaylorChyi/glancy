/**
 * 背景：
 *  - 页脚绘制涉及头像裁剪、品牌图标与异常降级策略，逻辑相对独立。
 * 目的：
 *  - 抽离资源加载与页脚渲染，确保主渲染流程专注于排版。
 * 关键决策与取舍：
 *  - 保持默认资产参数以兼容当前品牌，同时允许调用方传入自定义资源；
 *  - 头像降级逻辑集中处理，避免多处复制。
 * 影响范围：
 *  - 分享图页脚的绘制与资源加载。
 * 演进与TODO：
 *  - 可扩展更多社交品牌样式或动画效果。
 */

import appIconAsset from "@assets/brand-glancy-website.svg";
import defaultAvatarAsset from "@assets/default-user-avatar.svg";

import { toTrimmedString } from "./documentFormatting.js";
import {
  AVATAR_SIZE,
  CANVAS_WIDTH,
  CONTENT_PADDING_X,
  FOOTER_FONT,
  FOOTER_HEIGHT,
  ICON_SIZE,
  FONT_STACK,
} from "./canvasTheme.js";

export const loadImage = (source) =>
  new Promise((resolve, reject) => {
    if (!source) {
      resolve(null);
      return;
    }
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("image-load-failed"));
    image.src = source;
  });

export const drawAvatarFallback = (ctx, x, y, size, username) => {
  ctx.fillStyle = "#e5e7eb";
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#111";
  ctx.font = `600 ${Math.round(size * 0.45)}px ${FONT_STACK}`;
  const initial = (username?.[0] || "?").toUpperCase();
  const metrics = ctx.measureText(initial);
  const textX = x + size / 2 - metrics.width / 2;
  const textY = y + size / 2 - metrics.actualBoundingBoxAscent / 2;
  ctx.fillText(initial, textX, textY);
  ctx.fillStyle = "#000";
};

const selectAvatarSource = (user, assets) =>
  user?.avatar ? String(user.avatar) : assets.defaultAvatar;

const drawCircularImage = (ctx, image, x, y, size) => {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(image, x, y, size, size);
  ctx.restore();
};

const renderAvatar = async ({ ctx, avatarX, avatarY, username, assets, user }) => {
  const source = selectAvatarSource(user, assets);
  try {
    const avatarImage = await loadImage(source);
    if (avatarImage) {
      drawCircularImage(ctx, avatarImage, avatarX, avatarY, AVATAR_SIZE);
      return;
    }
  } catch {
    // 降级为占位符
  }
  drawAvatarFallback(ctx, avatarX, avatarY, AVATAR_SIZE, username);
};

const renderBranding = async ({ ctx, footerY, appName, assets }) => {
  try {
    const icon = await loadImage(assets.appIcon);
    if (icon) {
      const iconX = CANVAS_WIDTH - CONTENT_PADDING_X - ICON_SIZE;
      const iconY = footerY + 16;
      ctx.drawImage(icon, iconX, iconY, ICON_SIZE, ICON_SIZE);
      ctx.font = FOOTER_FONT;
      const labelX = iconX - ctx.measureText(appName).width - 24;
      ctx.fillText(appName, labelX, iconY + ICON_SIZE / 2 - 12);
      return true;
    }
  } catch {
    // fallback to text below
  }
  return false;
};

export const drawFooter = async ({
  ctx,
  totalHeight,
  appName,
  user,
  shareLabel,
  assets = { appIcon: appIconAsset, defaultAvatar: defaultAvatarAsset },
}) => {
  const footerY = totalHeight - FOOTER_HEIGHT + 32;
  const avatarX = CONTENT_PADDING_X;
  const avatarY = footerY + 16;
  const username = toTrimmedString(user?.username) || toTrimmedString(user?.name);

  await renderAvatar({ ctx, avatarX, avatarY, username, assets, user });

  ctx.font = FOOTER_FONT;
  ctx.fillText(
    username || (shareLabel ?? "Glancy User"),
    avatarX + AVATAR_SIZE + 24,
    avatarY + AVATAR_SIZE / 2 - 12,
  );

  const renderedIcon = await renderBranding({ ctx, footerY, appName, assets });
  if (!renderedIcon) {
    ctx.font = FOOTER_FONT;
    const labelX = CANVAS_WIDTH - CONTENT_PADDING_X - ctx.measureText(appName).width;
    ctx.fillText(appName, labelX, footerY + ICON_SIZE / 2);
  }
};
