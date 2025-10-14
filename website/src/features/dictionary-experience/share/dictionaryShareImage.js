/**
 * 背景：
 *  - 分享需求不再局限于复制链接，团队希望直接导出一张长图以适配移动端阅读与社交传播。
 * 目的：
 *  - 在浏览器侧生成与 UI 风格一致的白底黑字长图，并附带用户与品牌信息。
 * 关键决策与取舍：
 *  - 采用“建造者模式”分离数据整形与画布渲染：ShareDocumentBuilder 专注语义化分段，
 *    Canvas 渲染器只处理排版，便于未来扩展不同主题或导出格式；
 *  - 选用原生 Canvas API 避免额外依赖，降低体积与维护成本，同时通过 devicePixelRatio 适配高清屏；
 *  - 提前加载头像与图标并在失败时降级为首字母占位，确保跨域或缺失资源时仍可输出图片。
 * 影响范围：
 *  - DictionaryExperience 的分享菜单；引入分享图导出逻辑但不侵入核心查询流程。
 * 演进与TODO：
 *  - 后续可抽象主题配置、支持暗色主题或多语言排版，亦可扩展为导出 PDF。
 */
import appIconAsset from "@assets/glancy-web.svg";
import defaultAvatarAsset from "@assets/default-user-avatar.svg";
import { normalizeDictionaryMarkdown } from "@features/dictionary-experience/markdown/dictionaryMarkdownNormalizer.js";
import { stripMarkdownArtifacts } from "@features/dictionary-experience/markdown/dictionaryPlainTextSanitizer.js";

const FONT_STACK = `'Pretendard', 'Noto Sans SC', 'PingFang SC', 'Helvetica Neue', Arial, sans-serif`;
const TITLE_FONT = `600 48px ${FONT_STACK}`;
const SECTION_FONT = `600 28px ${FONT_STACK}`;
const BODY_FONT = `400 26px ${FONT_STACK}`;
const FOOTER_FONT = `500 24px ${FONT_STACK}`;
const CANVAS_WIDTH = 1080;
const CONTENT_PADDING_X = 96;
const CONTENT_PADDING_Y = 128;
const SECTION_SPACING = 48;
const LINE_SPACING = 40;
const FOOTER_HEIGHT = 176;
const AVATAR_SIZE = 88;
const ICON_SIZE = 72;

const toTrimmedString = (value) => {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  return String(value).trim();
};

class ShareDocumentBuilder {
  constructor() {
    this.title = "";
    this.sections = [];
  }

  setTitle(title) {
    const nextTitle = toTrimmedString(title);
    if (nextTitle) {
      this.title = nextTitle;
    }
    return this;
  }

  addSection(heading, lines) {
    const normalisedHeading = toTrimmedString(heading);
    const safeLines = Array.isArray(lines)
      ? lines
          .map((line) => toTrimmedString(line))
          .filter(
            (line, index, arr) =>
              line || (index === arr.length - 1 ? false : true),
          )
      : [];

    if (!normalisedHeading && safeLines.length === 0) {
      return this;
    }

    this.sections.push({ heading: normalisedHeading, lines: safeLines });
    return this;
  }

  build() {
    return Object.freeze({
      title: this.title,
      sections: this.sections.map((section) => ({
        heading: section.heading,
        lines: [...section.lines],
      })),
    });
  }
}

const buildFromMarkdown = (source) => {
  const trimmed = toTrimmedString(source);
  if (!trimmed) {
    return [];
  }
  return normalizeDictionaryMarkdown(trimmed)
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+$/g, ""));
};

const buildFromLegacyEntry = (entry, t) => {
  const sections = [];
  if (entry.phonetic) {
    sections.push({
      heading: t.phoneticLabel,
      lines: [stripMarkdownArtifacts(entry.phonetic)],
    });
  }
  if (Array.isArray(entry.definitions) && entry.definitions.length > 0) {
    sections.push({
      heading: t.definitionsLabel,
      lines: entry.definitions.map(
        (definition, index) =>
          `${index + 1}. ${stripMarkdownArtifacts(definition)}`,
      ),
    });
  }
  if (entry.example) {
    sections.push({
      heading: t.exampleLabel,
      lines: [stripMarkdownArtifacts(entry.example)],
    });
  }
  return sections;
};

const buildFromStructuredEntry = (entry, t) => {
  const sections = [];
  const phonetic = entry?.["发音"] || {};
  const phoneticLines = [];
  if (phonetic?.["英音"]) {
    phoneticLines.push(
      `${t.phoneticLabelEn ?? "英音"}: ${stripMarkdownArtifacts(phonetic["英音"])}`,
    );
  }
  if (phonetic?.["美音"]) {
    phoneticLines.push(
      `${t.phoneticLabelUs ?? "美音"}: ${stripMarkdownArtifacts(phonetic["美音"])}`,
    );
  }
  if (phoneticLines.length > 0) {
    sections.push({ heading: t.phoneticLabel, lines: phoneticLines });
  }

  const groups = Array.isArray(entry?.["发音解释"]) ? entry["发音解释"] : [];
  const definitionLines = [];
  const synLabel = t.synonymsLabel ?? "同义词";
  const antLabel = t.antonymsLabel ?? "反义词";
  const relLabel = t.relatedLabel ?? "相关词";

  groups.forEach((group, groupIndex) => {
    const senses = Array.isArray(group?.释义) ? group.释义 : [];
    senses.forEach((sense, senseIndex) => {
      const orderLabel = `${groupIndex + 1}.${senseIndex + 1}`;
      const senseText = [stripMarkdownArtifacts(sense?.定义), sense?.类别]
        .filter(Boolean)
        .join(" · ");
      if (senseText) {
        definitionLines.push(`${orderLabel} ${senseText}`);
      }
      const relations = sense?.关系词 || {};
      if (Array.isArray(relations.同义词) && relations.同义词.length > 0) {
        definitionLines.push(`${synLabel}: ${relations.同义词.join("、")}`);
      }
      if (Array.isArray(relations.反义词) && relations.反义词.length > 0) {
        definitionLines.push(`${antLabel}: ${relations.反义词.join("、")}`);
      }
      if (Array.isArray(relations.相关词) && relations.相关词.length > 0) {
        definitionLines.push(`${relLabel}: ${relations.相关词.join("、")}`);
      }
      const examples = Array.isArray(sense?.例句) ? sense.例句 : [];
      examples.forEach((example) => {
        const source = stripMarkdownArtifacts(example?.源语言);
        const translation = stripMarkdownArtifacts(example?.翻译);
        if (source) {
          definitionLines.push(`· ${source}`);
        }
        if (translation) {
          definitionLines.push(`  ${translation}`);
        }
      });
    });
  });
  if (definitionLines.length > 0) {
    sections.push({ heading: t.definitionsLabel, lines: definitionLines });
  }

  const variants = Array.isArray(entry?.["变形"]) ? entry["变形"] : [];
  if (variants.length > 0) {
    sections.push({
      heading: t.variantsLabel ?? "变形",
      lines: variants.map(
        (variant) =>
          `${stripMarkdownArtifacts(variant?.状态)}：${stripMarkdownArtifacts(variant?.词形)}`,
      ),
    });
  }

  const phrases = Array.isArray(entry?.["常见词组"]) ? entry["常见词组"] : [];
  if (phrases.length > 0) {
    sections.push({
      heading: t.phrasesLabel ?? "常见词组",
      lines: phrases.map((phrase) => {
        if (typeof phrase === "string") {
          return `• ${stripMarkdownArtifacts(phrase)}`;
        }
        const name = stripMarkdownArtifacts(phrase?.词组);
        const meaning = stripMarkdownArtifacts(phrase?.释义 ?? phrase?.解释);
        return meaning ? `• ${name} — ${meaning}` : `• ${name}`;
      }),
    });
  }

  return sections;
};

export function buildShareDocument({ term, entry, finalText, t }) {
  const builder = new ShareDocumentBuilder();
  builder.setTitle(term || entry?.term || "");

  const markdownSource =
    typeof entry?.markdown === "string" && entry.markdown.trim()
      ? entry.markdown
      : typeof finalText === "string"
        ? finalText
        : "";

  if (markdownSource.trim()) {
    builder.addSection("", buildFromMarkdown(markdownSource));
    return builder.build();
  }

  if (entry) {
    if (entry.phonetic || entry.definitions || entry.example) {
      buildFromLegacyEntry(entry, t).forEach((section) =>
        builder.addSection(section.heading, section.lines),
      );
      return builder.build();
    }
    if (entry["发音解释"] || entry["常见词组"]) {
      buildFromStructuredEntry(entry, t).forEach((section) =>
        builder.addSection(section.heading, section.lines),
      );
      return builder.build();
    }
  }

  builder.addSection("", buildFromMarkdown(finalText));
  return builder.build();
}

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

const wrapLine = (ctx, text, maxWidth) => {
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

const measureDocumentHeight = (ctx, documentModel) => {
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

const drawTextBlock = (ctx, text, font, x, y, contentWidth) => {
  ctx.font = font;
  const lines = wrapLine(ctx, text, contentWidth);
  lines.forEach((line, index) => {
    ctx.fillText(line, x, y + index * LINE_SPACING);
  });
  return y + lines.length * LINE_SPACING;
};

const loadImage = (source) =>
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

const drawAvatarFallback = (ctx, x, y, size, username) => {
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

const drawFooter = async ({ ctx, totalHeight, appName, user, shareLabel }) => {
  const footerY = totalHeight - FOOTER_HEIGHT + 32;
  const avatarX = CONTENT_PADDING_X;
  const avatarY = footerY + 16;
  const username =
    toTrimmedString(user?.username) || toTrimmedString(user?.name);

  let avatarSource = user?.avatar ? String(user.avatar) : defaultAvatarAsset;
  try {
    const avatarImage = await loadImage(avatarSource);
    if (avatarImage) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(
        avatarX + AVATAR_SIZE / 2,
        avatarY + AVATAR_SIZE / 2,
        AVATAR_SIZE / 2,
        0,
        Math.PI * 2,
      );
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatarImage, avatarX, avatarY, AVATAR_SIZE, AVATAR_SIZE);
      ctx.restore();
    } else {
      drawAvatarFallback(ctx, avatarX, avatarY, AVATAR_SIZE, username);
    }
  } catch {
    drawAvatarFallback(ctx, avatarX, avatarY, AVATAR_SIZE, username);
  }

  ctx.font = FOOTER_FONT;
  ctx.fillText(
    username || (shareLabel ?? "Glancy User"),
    avatarX + AVATAR_SIZE + 24,
    avatarY + AVATAR_SIZE / 2 - 12,
  );

  try {
    const icon = await loadImage(appIconAsset);
    if (icon) {
      const iconX = CANVAS_WIDTH - CONTENT_PADDING_X - ICON_SIZE;
      const iconY = footerY + 16;
      ctx.drawImage(icon, iconX, iconY, ICON_SIZE, ICON_SIZE);
      ctx.font = FOOTER_FONT;
      const labelX = iconX - ctx.measureText(appName).width - 24;
      ctx.fillText(appName, labelX, iconY + ICON_SIZE / 2 - 12);
    }
  } catch {
    ctx.font = FOOTER_FONT;
    const labelX =
      CANVAS_WIDTH - CONTENT_PADDING_X - ctx.measureText(appName).width;
    ctx.fillText(appName, labelX, footerY + ICON_SIZE / 2);
  }
};

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

  let cursorY = CONTENT_PADDING_Y;
  const contentWidth = CANVAS_WIDTH - CONTENT_PADDING_X * 2;
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

  await drawFooter({
    ctx,
    totalHeight,
    appName: appName || "Glancy",
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
  ShareDocumentBuilder,
  buildFromMarkdown,
  buildFromLegacyEntry,
  buildFromStructuredEntry,
  wrapLine,
  measureDocumentHeight,
});
