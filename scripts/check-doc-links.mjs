#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';

const DOC_ROOT = path.resolve(process.cwd(), 'doc', '需求说明文档');

async function getMarkdownFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return getMarkdownFiles(entryPath);
    }
    if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      return [entryPath];
    }
    return [];
  }));
  return files.flat();
}

function normalizeLinkTarget(link) {
  let target = link.trim();
  if (target.startsWith('<') && target.endsWith('>')) {
    target = target.slice(1, -1);
  }
  return target;
}

async function readFirstHeading(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const match = /^#\s+(.+)$/.exec(line.trim());
    if (match) {
      return match[1].trim();
    }
  }
  return null;
}

function expectedHeadingForFile(filePath) {
  const relativePath = path.relative(DOC_ROOT, filePath).replace(/\\/g, '/');
  const baseName = path.basename(relativePath, path.extname(relativePath));
  if (relativePath.startsWith('Appendix/')) {
    return baseName;
  }
  return baseName;
}

async function validateHeadings(files) {
  const errors = [];
  for (const file of files) {
    const heading = await readFirstHeading(file);
    if (!heading) {
      errors.push({
        type: 'heading-missing',
        file,
        message: '未找到一级标题 (# )',
      });
      continue;
    }
    const expected = expectedHeadingForFile(file);
    if (heading !== expected) {
      errors.push({
        type: 'heading-mismatch',
        file,
        message: `标题与文件名不一致：期望 "${expected}"，实际 "${heading}"`,
      });
    }
  }
  return errors;
}

async function validateLinks(files) {
  const errors = [];
  for (const file of files) {
    const content = await fs.readFile(file, 'utf8');
    const relativeDir = path.dirname(file);
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    while ((match = linkRegex.exec(content)) !== null) {
      const [, text, rawTarget] = match;
      const target = normalizeLinkTarget(rawTarget);
      if (/^[a-z]+:/.test(target) || target.startsWith('#')) {
        continue; // 外部链接或本页锚点
      }
      const [filePart, anchorPart] = target.split('#');
      const resolvedPath = path.resolve(relativeDir, filePart);
      try {
        const stat = await fs.stat(resolvedPath);
        if (!stat.isFile()) {
          errors.push({
            type: 'link-not-file',
            file,
            message: `链接目标不是文件：${target}`,
          });
          continue;
        }
      } catch (err) {
        errors.push({
          type: 'link-missing',
          file,
          message: `找不到链接目标：${target}`,
        });
        continue;
      }
      if (!anchorPart) {
        const heading = await readFirstHeading(resolvedPath);
        if (heading && heading !== text.trim()) {
          errors.push({
            type: 'link-text-mismatch',
            file,
            message: `链接文本与目标标题不一致："${text.trim()}" -> "${heading}"`,
          });
        }
      }
    }
  }
  return errors;
}

async function main() {
  try {
    const files = await getMarkdownFiles(DOC_ROOT);
    const headingErrors = await validateHeadings(files);
    const linkErrors = await validateLinks(files);
    const errors = [...headingErrors, ...linkErrors];
    if (errors.length > 0) {
      console.error('发现以下问题：');
      for (const error of errors) {
        console.error(`- [${error.type}] ${path.relative(process.cwd(), error.file)}: ${error.message}`);
      }
      process.exit(1);
    }
    console.log('校验通过：所有标题与内部链接均正常。');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
