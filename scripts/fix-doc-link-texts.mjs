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

async function fixFile(file) {
  let content = await fs.readFile(file, 'utf8');
  let changed = false;
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const replacements = [];
  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    const [fullMatch, text, rawTarget] = match;
    const target = normalizeLinkTarget(rawTarget);
    const [filePart, anchorPart] = target.split('#');
    if (anchorPart || /^[a-z]+:/.test(target) || target.startsWith('#')) {
      continue;
    }
    const resolvedPath = path.resolve(path.dirname(file), filePart);
    try {
      const stat = await fs.stat(resolvedPath);
      if (!stat.isFile()) {
        continue;
      }
    } catch {
      continue;
    }
    const heading = await readFirstHeading(resolvedPath);
    if (!heading || text.trim() === heading) {
      continue;
    }
    replacements.push({ start: match.index, end: match.index + fullMatch.length, heading, rawTarget });
  }
  if (replacements.length === 0) {
    return false;
  }
  // apply replacements from end to start
  for (const replacement of replacements.sort((a, b) => b.start - a.start)) {
    const newText = `[${replacement.heading}](${replacement.rawTarget})`;
    content = content.slice(0, replacement.start) + newText + content.slice(replacement.end);
    changed = true;
  }
  if (changed) {
    await fs.writeFile(file, content, 'utf8');
  }
  return changed;
}

async function main() {
  const files = await getMarkdownFiles(DOC_ROOT);
  let totalChanged = 0;
  for (const file of files) {
    if (await fixFile(file)) {
      totalChanged += 1;
    }
  }
  console.log(`已处理 ${totalChanged} 个文件。`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
