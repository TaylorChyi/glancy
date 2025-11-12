#!/usr/bin/env node
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
const CATEGORY_ORDER = ['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security'];
const CATEGORY_RULES = [
  { category: 'Security', patterns: [/security/i, /漏洞/, /安全/] },
  { category: 'Fixed', patterns: [/^fix/i, /\bfix\b/i, /bug/i, /修复/, /缺陷/, /故障/, /回归/] },
  { category: 'Removed', patterns: [/remove/i, /删除/, /移除/, /下线/] },
  { category: 'Deprecated', patterns: [/deprecat/i, /废弃/, /弃用/] },
  { category: 'Added', patterns: [/^feat/i, /新增/, /添加/, /增加/, /支持/, /introduc/i, /\badd\b/i] },
  { category: 'Changed', patterns: [/change/i, /调整/, /优化/, /完善/, /更新/, /docs?/i, /chore/i, /refactor/i, /cleanup/i] },
];

async function runGit(args) {
  const { stdout } = await execFileAsync('git', args, {
    maxBuffer: 10 * 1024 * 1024,
  });
  return stdout;
}

function parseArgs(argv) {
  const options = {
    from: null,
    to: 'HEAD',
    repo: null,
    help: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case '--from':
        options.from = argv[++i];
        break;
      case '--to':
        options.to = argv[++i];
        break;
      case '--repo':
        options.repo = argv[++i];
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      default:
        throw new Error(`未知参数：${arg}`);
    }
  }
  return options;
}

function printHelp() {
  const usage = `
用法：node scripts/release/changelog-draft.mjs [--from <ref>] [--to <ref>] [--repo <owner/repo>]

说明：
  --from    起始（不包含）提交或 Tag，默认使用最新 Tag。
  --to      结束（包含）提交，默认为 HEAD。
  --repo    GitHub 仓库标识，形如 owner/repo。默认从 origin remote 推断。
`;
  console.log(usage.trim());
}

async function detectLatestTag() {
  try {
    const tag = await runGit(['describe', '--tags', '--abbrev=0']);
    return tag.trim();
  } catch {
    return null;
  }
}

function parseRepoFromUrl(url) {
  if (!url) {
    return null;
  }
  const httpMatch = url.match(/https?:\/\/[^/]+\/(.+?)(?:\.git)?$/);
  if (httpMatch) {
    return httpMatch[1];
  }
  const sshMatch = url.match(/.+:(.+?)(?:\.git)?$/);
  if (sshMatch) {
    return sshMatch[1];
  }
  return null;
}

async function resolveRepoSlug(explicitRepo) {
  if (explicitRepo) {
    return explicitRepo;
  }
  try {
    const remoteUrl = (await runGit(['config', '--get', 'remote.origin.url'])).trim();
    const parsed = parseRepoFromUrl(remoteUrl);
    if (parsed) {
      return parsed;
    }
  } catch {
    // ignore
  }
  if (process.env.GITHUB_REPOSITORY) {
    return process.env.GITHUB_REPOSITORY;
  }
  return 'TaylorChyi/glancy';
}

function buildRange(from, to) {
  if (from) {
    return `${from}..${to}`;
  }
  return to;
}

function splitCommitRecords(raw) {
  return raw
    .split('\x1e')
    .map((record) => record.trim())
    .filter(Boolean)
    .map((record) => {
      const [hash, subject, body = ''] = record.split('\x1f');
      return { hash, subject: subject || '', body };
    });
}

function firstBodyLine(body) {
  return body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0) || '';
}

function extractPrNumber(text) {
  const patterns = [
    /Merge pull request #(\d+)/i,
    /\(#(\d+)\)/,
    /PR[ _-]?#?(\d+)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}

function inferCategory(title) {
  for (const rule of CATEGORY_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(title))) {
      return rule.category;
    }
  }
  return 'Changed';
}

function formatEntry(entry, repoSlug) {
  const link = entry.prNumber
    ? `[#${entry.prNumber}](https://github.com/${repoSlug}/pull/${entry.prNumber})`
    : `[${entry.hash.slice(0, 7)}](https://github.com/${repoSlug}/commit/${entry.hash})`;
  const suffix = entry.prNumber ? '' : ' ⚠️ 未检测到 PR 号，请补充。';
  return `- ${entry.title} (${link})${suffix}`;
}

function formatDraft(rangeLabel, sections, repoSlug) {
  const lines = [];
  lines.push(`## Draft (${rangeLabel})`);
  lines.push('');

  for (const category of CATEGORY_ORDER) {
    const entries = sections[category];
    if (!entries || entries.length === 0) {
      continue;
    }
    lines.push(`### ${category}`);
    for (const entry of entries) {
      lines.push(formatEntry(entry, repoSlug));
    }
    lines.push('');
  }
  return lines.join('\n').trimEnd() + '\n';
}

async function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
      printHelp();
      return;
    }

    let fromRef = options.from;
    if (!fromRef) {
      fromRef = await detectLatestTag();
    }

    const repoSlug = await resolveRepoSlug(options.repo);
    const rangeArg = buildRange(fromRef, options.to);
    const logArgs = ['log', '--pretty=format:%H%x1f%s%x1f%b%x1e'];
    if (rangeArg) {
      logArgs.push(rangeArg);
    }
    const logOutput = await runGit(logArgs);
    if (!logOutput.trim()) {
      console.error(`未找到 ${rangeArg} 范围内的提交。`);
      return;
    }

    const records = splitCommitRecords(logOutput);
    const sections = Object.fromEntries(CATEGORY_ORDER.map((c) => [c, []]));
    const warnings = [];

    for (const record of records) {
      const candidateTitle = firstBodyLine(record.body);
      const titleSource = record.subject.startsWith('Merge pull request') && candidateTitle
        ? candidateTitle
        : record.subject;
      const title = titleSource.replace(/\s+/g, ' ').trim() || record.hash;
      const combinedText = `${record.subject}\n${record.body}`;
      const prNumber = extractPrNumber(combinedText);
      if (!prNumber) {
        warnings.push(`提交 ${record.hash.slice(0, 7)} 缺少 PR 号：${title}`);
      }
      const category = inferCategory(title);
      sections[category].push({
        hash: record.hash,
        title,
        prNumber,
      });
    }

    const nonEmpty = CATEGORY_ORDER.some((category) => sections[category].length > 0);
    if (!nonEmpty) {
      console.error(`未解析到 ${rangeArg} 范围内的有效提交。`);
      return;
    }

    process.stdout.write(formatDraft(rangeArg, sections, repoSlug));
    if (warnings.length > 0) {
      console.error('注意：以下提交缺少 PR 号，需要人工修正或补链：');
      warnings.forEach((warning) => console.error(`- ${warning}`));
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

main();
