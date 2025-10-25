/**
 * 背景：
 *  - 文本换行与高度测量逻辑频繁被渲染器与测试复用，单文件维护不利于扩展。
 * 目的：
 *  - 封装布局相关的纯函数，统一文字排版与高度计算策略。
 * 关键决策与取舍：
 *  - 函数保持无副作用，依赖上下文参数注入，方便编写单测；
 *  - 与 canvasTheme 解耦，使不同主题可共用相同算法。
 * 影响范围：
 *  - 分享图渲染中的换行与高度测量步骤。
 * 演进与TODO：
 *  - 可进一步引入行高配置或中英混排优化。
 */

import { toTrimmedString } from "./documentFormatting.js";
import {
  BODY_FONT,
  CANVAS_WIDTH,
  CONTENT_PADDING_X,
  CONTENT_PADDING_Y,
  LINE_SPACING,
  SECTION_FONT,
  SECTION_SPACING,
  TITLE_FONT,
  FOOTER_HEIGHT,
} from "./canvasTheme.js";

export const wrapLine = (ctx, text, maxWidth) => {
  const source = toTrimmedString(text);
  if (!source) return [""];
  const words = source.split(/(\s+)/).filter((token) => token.length > 0);
  const lines = [];
  let current = "";

  const flush = () => {
    if (current) {
      lines.push(current.trimEnd());
      current = "";
    }
  };

  const pushLongToken = (token) => {
    let buffer = "";
    for (const char of token) {
      const candidate = buffer + char;
      if (ctx.measureText(candidate).width > maxWidth) {
        if (buffer) {
          lines.push(buffer);
        }
        buffer = char;
      } else {
        buffer = candidate;
      }
    }
    if (buffer) {
      lines.push(buffer);
    }
  };

  words.forEach((token) => {
    const candidate = current + token;
    if (ctx.measureText(candidate).width > maxWidth) {
      if (!current.trim()) {
        pushLongToken(token);
        current = "";
      } else {
        flush();
        if (ctx.measureText(token).width > maxWidth) {
          pushLongToken(token);
        } else {
          current = token.trimStart();
        }
      }
    } else {
      current = candidate;
    }
  });

  if (current.trim()) {
    lines.push(current.trimEnd());
  }

  return lines.length ? lines : [""];
};

export const measureDocumentHeight = (ctx, documentModel) => {
  const contentWidth = CANVAS_WIDTH - CONTENT_PADDING_X * 2;
  let y = CONTENT_PADDING_Y;

  if (documentModel.title) {
    ctx.font = TITLE_FONT;
    const titleLines = wrapLine(ctx, documentModel.title, contentWidth);
    y += titleLines.length * LINE_SPACING + SECTION_SPACING;
  }

  documentModel.sections.forEach((section) => {
    if (section.heading) {
      ctx.font = SECTION_FONT;
      const headingLines = wrapLine(ctx, section.heading, contentWidth);
      y += headingLines.length * LINE_SPACING;
    }
    if (section.lines.length > 0) {
      ctx.font = BODY_FONT;
      section.lines.forEach((line) => {
        const segments = wrapLine(ctx, line, contentWidth);
        y += segments.length * LINE_SPACING;
      });
    }
    y += SECTION_SPACING;
  });

  return y + FOOTER_HEIGHT;
};

export const drawTextBlock = (ctx, text, font, x, y, contentWidth) => {
  ctx.font = font;
  const lines = wrapLine(ctx, text, contentWidth);
  lines.forEach((line, index) => {
    ctx.fillText(line, x, y + index * LINE_SPACING);
  });
  return y + lines.length * LINE_SPACING;
};

export const drawDocumentBody = ({
  ctx,
  documentModel,
  contentWidth,
  startY,
}) => {
  let cursorY = startY;
  if (documentModel.title) {
    cursorY = drawTextBlock(
      ctx,
      documentModel.title,
      TITLE_FONT,
      CONTENT_PADDING_X,
      cursorY,
      contentWidth,
    );
    cursorY += SECTION_SPACING / 2;
  }

  documentModel.sections.forEach((section) => {
    if (section.heading) {
      cursorY = drawTextBlock(
        ctx,
        section.heading,
        SECTION_FONT,
        CONTENT_PADDING_X,
        cursorY,
        contentWidth,
      );
    }
    section.lines.forEach((line) => {
      cursorY = drawTextBlock(
        ctx,
        line,
        BODY_FONT,
        CONTENT_PADDING_X,
        cursorY,
        contentWidth,
      );
    });
    cursorY += SECTION_SPACING / 2;
  });

  return cursorY;
};
