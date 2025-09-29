import type { MutableRefObject } from "react";
import {
  extractMarkdownPreview,
  polishDictionaryMarkdown,
  resolveShareTarget,
} from "@/utils";
import { attemptShareLink as baseAttemptShareLink } from "@/utils/share.js";

export type DictionaryEntry = {
  term?: string;
  markdown?: string;
  [key: string]: unknown;
} | null;

export type CopyPayloadSource = {
  entry: DictionaryEntry;
  finalText: string;
  streamText: string;
  fallbackTerm: string;
};

export function buildCopyPayload({
  entry,
  finalText,
  streamText,
  fallbackTerm,
}: CopyPayloadSource): string {
  const stringCandidates = [
    typeof entry?.markdown === "string" ? entry.markdown : null,
    typeof finalText === "string" ? finalText : null,
    typeof streamText === "string" ? streamText : null,
  ];

  for (const candidate of stringCandidates) {
    if (!candidate || !candidate.trim()) {
      continue;
    }
    const preview = extractMarkdownPreview(candidate);
    const normalized = preview == null ? candidate : preview;
    return polishDictionaryMarkdown(normalized);
  }

  if (entry && typeof entry === "object") {
    try {
      return JSON.stringify(entry, null, 2);
    } catch {
      return fallbackTerm;
    }
  }

  return fallbackTerm;
}

export type ShareTemplate = {
  template?: string;
  fallback?: string;
};

export function applyShareTemplate({
  template,
  fallback,
}: ShareTemplate & { fallback: string }): string {
  if (typeof template === "string" && template.length > 0) {
    return template.split("{term}").join(fallback);
  }
  return fallback;
}

export type AttemptShareParams = {
  term: string;
  template?: string;
  currentUrl?: string;
  resolveShareTargetFn?: typeof resolveShareTarget;
  attemptShareLinkFn?: typeof baseAttemptShareLink;
};

export type AttemptShareResult =
  | { status: "shared" }
  | { status: "copied" }
  | { status: "failed"; error?: unknown }
  | { status: "aborted" };

export async function attemptDictionaryShare({
  term,
  template,
  currentUrl,
  resolveShareTargetFn = resolveShareTarget,
  attemptShareLinkFn = baseAttemptShareLink,
}: AttemptShareParams): Promise<AttemptShareResult> {
  const shareUrl = resolveShareTargetFn({ currentUrl });
  const shareText = applyShareTemplate({ template, fallback: term });

  const result = await attemptShareLinkFn({
    title: term,
    text: shareText,
    url: shareUrl,
  });

  if (result.status === "shared") {
    return { status: "shared" };
  }

  if (result.status === "copied") {
    return { status: "copied" };
  }

  if (result.status === "aborted") {
    return { status: "aborted" };
  }

  return { status: "failed", error: result.error };
}

export type ReportTargetParams = {
  reportFormUrl?: string;
  supportEmail?: string;
  term: string;
  currentUrl?: string;
  windowOriginRef?: MutableRefObject<string | null>;
};

export function buildReportTarget({
  reportFormUrl,
  supportEmail,
  term,
  currentUrl,
  windowOriginRef,
}: ReportTargetParams): string {
  const safeTerm = term ?? "";
  const sourceUrl = currentUrl?.trim() ? currentUrl.trim() : "";
  const baseOrigin = windowOriginRef?.current ?? null;

  if (reportFormUrl) {
    try {
      const origin =
        baseOrigin ||
        (sourceUrl ? new URL(sourceUrl).origin : "http://localhost");
      const reportUrl = new URL(reportFormUrl, origin);
      reportUrl.searchParams.set("term", safeTerm);
      if (sourceUrl) {
        reportUrl.searchParams.set("source", sourceUrl);
      }
      return reportUrl.toString();
    } catch {
      // ignore and fallback to email
    }
  }

  if (supportEmail) {
    const subject = encodeURIComponent(`[Glancy] Report: ${safeTerm}`);
    const lines = [
      `Term: ${safeTerm}`,
      sourceUrl ? `Page: ${sourceUrl}` : null,
      "",
      "Describe the issue here:",
    ].filter(Boolean);
    const body = encodeURIComponent(lines.join("\n"));
    return `mailto:${supportEmail}?subject=${subject}&body=${body}`;
  }

  return "";
}
