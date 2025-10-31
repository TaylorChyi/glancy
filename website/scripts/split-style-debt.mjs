#!/usr/bin/env node
/**
 * 背景：
 *  - 历史 CSS 模块长期堆积超出行数限制，影响 lint 守卫与日常维护。
 * 目的：
 *  - 自动将遗留的巨型 CSS 文件拆分为多个语义块，并生成聚合入口以保证调用方稳定。
 * 关键决策与取舍：
 *  - 采用基于空行的块切分策略，保持原始顺序避免视觉回归；
 *  - 为拆分后的文件自动补充文件头注释，符合团队“代码即文档”规范；
 *  - 输出门面（Facade）聚合器，替代逐个调整调用方的繁琐流程。
 * 影响范围：
 *  - scripts/check-lines.mjs 中维护的样式白名单；
 *  - 依赖这些 CSS 模块的页面与组件。
 * 演进与TODO：
 *  - TODO: 可根据注释语义或组件边界进一步增强自动分组策略，避免未来再次人工干预。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

const MAX_LINES_PER_CHUNK = 170;
const STYLE_DEBT_TARGETS = [
  {
    source: "src/app/pages/preferences/Preferences.module.css",
    kind: "module",
    facadeName: "Preferences",
    facadeDescription: "Preferences 页面与 SettingsModal", 
  },
  {
    source: "src/app/pages/profile/Profile.module.css",
    kind: "module",
    facadeName: "Profile",
    facadeDescription: "Profile 页面布局", 
  },
  {
    source: "src/features/dictionary-experience/components/ReportIssueModal.module.css",
    kind: "module",
    facadeName: "ReportIssueModal",
    facadeDescription: "词典体验问题上报模态", 
  },
  {
    source: "src/shared/components/Layout/Layout.module.css",
    kind: "module",
    facadeName: "Layout",
    facadeDescription: "共享 Layout 组件", 
  },
  {
    source: "src/shared/components/OutputToolbar/OutputToolbar.module.css",
    kind: "module",
    facadeName: "OutputToolbar",
    facadeDescription: "输出工具栏", 
  },
  {
    source: "src/shared/components/Profile/EmailBindingCard/EmailBindingCard.module.css",
    kind: "module",
    facadeName: "EmailBindingCard",
    facadeDescription: "邮箱绑定卡片", 
  },
  {
    source: "src/shared/components/form/AuthForm.module.css",
    kind: "module",
    facadeName: "AuthForm",
    facadeDescription: "认证表单组件族", 
  },
  {
    source: "src/shared/components/ui/ChatInput/ChatInput.module.css",
    kind: "module",
    facadeName: "ChatInput",
    facadeDescription: "对话输入组件", 
  },
  {
    source: "src/shared/theme/variables.css",
    kind: "global",
    facadeName: "ThemeVariables",
    facadeDescription: "主题设计令牌", 
  },
];

const ensureDirectory = (targetPath) => {
  fs.mkdirSync(targetPath, { recursive: true });
};

const readLines = (absolutePath) => {
  const content = fs.readFileSync(absolutePath, "utf8");
  return content.split(/\r?\n/);
};

const trimTrailingEmptyLines = (lines) => {
  let lastIndex = lines.length - 1;
  while (lastIndex >= 0 && lines[lastIndex].trim() === "") {
    lastIndex -= 1;
  }
  return lines.slice(0, lastIndex + 1);
};

const sanitiseToken = (value) => {
  if (!value) {
    return null;
  }
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
  return cleaned.length > 0 ? cleaned : null;
};

const toPascalCase = (value) =>
  value
    .split(/[^a-zA-Z0-9]/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join("");

const deriveTokenFromBlock = (blockLines) => {
  for (const rawLine of blockLines) {
    const line = rawLine.trim();
    if (line.length === 0) {
      continue;
    }
    if (line.startsWith("/*")) {
      continue;
    }
    const keyframesMatch = line.match(/^@keyframes\s+([a-zA-Z0-9_-]+)/);
    if (keyframesMatch) {
      return keyframesMatch[1];
    }
    const classMatch = line.match(/\.([a-zA-Z0-9_-]+)/);
    if (classMatch) {
      return classMatch[1];
    }
    if (line.startsWith(":root")) {
      return "root";
    }
    if (line.startsWith("@")) {
      // 继续扫描内层语句
      continue;
    }
  }
  return null;
};

const splitLinesIntoChunks = (lines) => {
  const segments = [];
  let current = [];
  let lineCount = 0;

  const flushCurrent = () => {
    if (current.length === 0) {
      return;
    }
    segments.push(trimTrailingEmptyLines(current));
    current = [];
    lineCount = 0;
  };

  for (const line of lines) {
    current.push(line);
    lineCount += 1;
    const isBreakable = line.trim() === "";
    if (lineCount >= MAX_LINES_PER_CHUNK && isBreakable) {
      flushCurrent();
    }
  }

  flushCurrent();
  return segments.filter((segment) => segment.length > 0);
};

const writeModuleChunks = ({ source, facadeName, facadeDescription }) => {
  const absoluteSource = path.join(PROJECT_ROOT, source);
  if (!fs.existsSync(absoluteSource)) {
    throw new Error(`未找到样式源文件: ${source}`);
  }

  const lines = readLines(absoluteSource);
  const chunks = splitLinesIntoChunks(lines);
  const stylesDir = path.join(path.dirname(absoluteSource), "styles");
  if (fs.existsSync(stylesDir)) {
    throw new Error(`目标目录已存在，避免覆盖: ${path.relative(PROJECT_ROOT, stylesDir)}`);
  }
  ensureDirectory(stylesDir);

  const moduleRecords = [];
  const usedNames = new Set();
  chunks.forEach((chunkLines, index) => {
    const token = sanitiseToken(deriveTokenFromBlock(chunkLines));
    const baseName = token ?? `segment-${index + 1}`;
    let fileName = `${baseName}.module.css`;
    let attempt = 1;
    while (usedNames.has(fileName)) {
      attempt += 1;
      fileName = `${baseName}-${attempt}.module.css`;
    }
    usedNames.add(fileName);
    const importName = `${toPascalCase(baseName)}Styles`;

    const headerComment = [
      "/**",
      " * 背景：",
      ` *  - 从 ${source} 拆分出的样式片段，聚焦 ${token ?? `第 ${index + 1} 段`} 的局部结构。`,
      " * 目的：",
      " *  - 维持原有声明顺序同时降低单文件体积，便于渐进式梳理。",
      " * 关键决策与取舍：",
      " *  - 通过自动拆分避免手工复制引入的人为回归；",
      " *  - 保留原注释与排版，确保比对差异时信息完整。",
      " * 影响范围：",
      ` *  - ${facadeDescription} 中引用的 className 映射。`,
      " * 演进与TODO：",
      " *  - TODO: 后续可进一步语义化命名或抽离为 tokens。",
      " */",
      "",
    ];

    const absoluteFilePath = path.join(stylesDir, fileName);
    const payload = [...headerComment, ...trimTrailingEmptyLines(chunkLines), ""];
    fs.writeFileSync(absoluteFilePath, payload.join("\n"), "utf8");

    moduleRecords.push({
      fileName,
      importName,
    });
  });

  fs.rmSync(absoluteSource);

  const aggregatorComment = [
    "/**",
    " * 背景：",
    ` *  - 原 ${source} 长期堆叠至超出行数上限，难以定位职责。`,
    " * 目的：",
    " *  - 以门面（Facade）模式聚合拆分后的 CSS Modules，对调用方保持稳定接口。",
    " * 关键决策与取舍：",
    " *  - 通过 createStyleFacade 构建冻结代理，兼容真实样式与 Jest 代理；",
    " *  - 与直接更新所有调用方相比，集中聚合减少改动面。",
    " * 影响范围：",
    ` *  - ${facadeDescription}。`,
    " * 演进与TODO：",
    " *  - TODO: 后续可引入更细粒度的主题/尺寸策略映射。",
    " */",
    "",
  ];

  const importLines = [
    "import createStyleFacade from \"@shared/styles/createStyleFacade.js\";",
    ...moduleRecords.map(
      ({ fileName, importName }) => `import ${importName} from "./${fileName}";`
    ),
  ];

  const facadeArgs = moduleRecords.map(({ importName }) => `  ${importName},`);

  const aggregatorLines = [
    ...aggregatorComment,
    ...importLines,
    "",
    "const styles = createStyleFacade([",
    ...facadeArgs,
    "]);",
    "",
    "export default styles;",
    "",
  ];

  const aggregatorPath = path.join(stylesDir, "index.js");
  fs.writeFileSync(aggregatorPath, aggregatorLines.join("\n"), "utf8");
};

const writeGlobalChunks = ({ source, facadeDescription }) => {
  const absoluteSource = path.join(PROJECT_ROOT, source);
  if (!fs.existsSync(absoluteSource)) {
    throw new Error(`未找到样式源文件: ${source}`);
  }

  const lines = readLines(absoluteSource);
  const chunks = splitLinesIntoChunks(lines);
  const baseName = path.basename(source, path.extname(source));
  const targetDir = path.join(path.dirname(absoluteSource), baseName);
  if (fs.existsSync(targetDir)) {
    throw new Error(`目标目录已存在，避免覆盖: ${path.relative(PROJECT_ROOT, targetDir)}`);
  }
  ensureDirectory(targetDir);

  const importRecords = [];
  const usedNames = new Set();
  chunks.forEach((chunkLines, index) => {
    const token = sanitiseToken(deriveTokenFromBlock(chunkLines));
    const base = token ?? `segment-${index + 1}`;
    let fileName = `${base}.css`;
    let attempt = 1;
    while (usedNames.has(fileName)) {
      attempt += 1;
      fileName = `${base}-${attempt}.css`;
    }
    usedNames.add(fileName);

    const headerComment = [
      "/**",
      " * 背景：",
      ` *  - 从 ${source} 拆分出的设计令牌片段，关注 ${token ?? `第 ${index + 1} 段`}。`,
      " * 目的：",
      " *  - 控制单文件体积并为未来主题拆分埋点。",
      " * 关键决策与取舍：",
      " *  - 继续沿用原 token 命名，避免一次性重命名造成风险。",
      " * 影响范围：",
      ` *  - ${facadeDescription}。`,
      " * 演进与TODO：",
      " *  - TODO: 结合主题模块化策略进一步分层。",
      " */",
      "",
    ];

    const absoluteFilePath = path.join(targetDir, fileName);
    const payload = [...headerComment, ...trimTrailingEmptyLines(chunkLines), ""];
    fs.writeFileSync(absoluteFilePath, payload.join("\n"), "utf8");

    importRecords.push({ fileName });
  });

  const aggregatorComment = [
    "/**",
    " * 背景：",
    ` *  - ${source} 聚合了全部主题变量，难以按模块演化。`,
    " * 目的：",
    " *  - 提供轻量入口并引入基于 @import 的分层，保持调用路径不变。",
    " * 关键决策与取舍：",
    " *  - 采用层级目录存放拆分片段，方便主题扩展与按需加载；",
    " *  - 保持原文件名，避免上层索引改动。",
    " * 影响范围：",
    ` *  - ${facadeDescription}。`,
    " * 演进与TODO：",
    " *  - TODO: 当夜间主题重构时，可进一步引入多入口聚合。",
    " */",
    "",
  ];

  const importLines = importRecords.map(
    ({ fileName }) => `@import url("./${baseName}/${fileName}");`
  );

  const aggregatorPayload = [...aggregatorComment, ...importLines, ""];
  fs.writeFileSync(absoluteSource, aggregatorPayload.join("\n"), "utf8");
};

STYLE_DEBT_TARGETS.forEach((target) => {
  if (target.kind === "module") {
    writeModuleChunks(target);
    return;
  }
  if (target.kind === "global") {
    writeGlobalChunks(target);
    return;
  }
  throw new Error(`未知的 target.kind: ${target.kind}`);
});

console.log("[split-style-debt] CSS 拆分完成，后续请更新组件引用并执行样式校验。");
