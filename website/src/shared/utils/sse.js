export async function* parseSse(stream) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  const dev = typeof import.meta !== "undefined" && import.meta.env?.DEV;
  const log = (...args) => {
    if (dev) console.info("[parseSse]", ...args);
  };
  let buffer = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      log("chunk", preview(chunk));
      buffer = normalizeNewlines(buffer + chunk);
      const parsed = drainBuffer(buffer, log);
      buffer = parsed.remaining;
      for (const event of parsed.events) {
        log("event parsed", event);
        yield event;
      }
    }
    buffer = normalizeNewlines(buffer);
    if (buffer.trim()) {
      const event = assembleEvent(buffer);
      if (event && event.data) {
        log("event parsed", event);
        yield event;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

function normalizeNewlines(str) {
  return str.replace(/\r\n?/g, "\n");
}

function drainBuffer(currentBuffer, log) {
  const events = [];
  let working = currentBuffer;
  while (true) {
    const separatorIndex = working.indexOf("\n\n");
    if (separatorIndex === -1) break;
    const rawEvent = working.slice(0, separatorIndex);
    working = working.slice(separatorIndex + 2);
    if (log) {
      log("event raw", preview(rawEvent));
    }
    const event = assembleEvent(rawEvent);
    if (event) {
      events.push(event);
    }
  }
  return { events, remaining: working };
}

/**
 * 背景：
 *  - Doubao SSE 在写入换行时会直接内嵌 `\n` 字符，导致单个数据段跨越多行且仅首行带有 `data:` 前缀。
 * 目的：
 *  - 通过显式的“有状态事件组装器”记录上一字段，实现对续行数据的捕获，恢复完整换行。
 * 关键决策与取舍：
 *  - 采用轻量状态模式（上一字段名称 + 缓冲）而非一次性正则，避免在高频流式场景下创建多余中间字符串；
 *  - 续行仅在上一字段为 data 时附加，确保 event/id 等字段不会被误合并。
 */
function assembleEvent(rawEvent) {
  const assembler = createSseEventAssembler();
  for (const line of rawEvent.split("\n")) {
    assembler.consume(line);
  }
  const event = assembler.build();
  if (event.data || event.event !== "message") {
    return event;
  }
  return null;
}

function createSseEventAssembler() {
  let lastField = null;
  const event = { event: "message", data: "" };

  /**
   * 意图：逐行消费 SSE 片段，保留 data 字段中的换行续行。
   * 输入：单行原始字符串，不包含行终止符。
   * 副作用：更新事件缓冲与上一字段指针。
   */
  function consume(line) {
    if (line == null) {
      return;
    }
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) {
      if (lastField === "data") {
        const continuation = line.trimStart();
        event.data += `\n${continuation}`;
      }
      return;
    }
    const field = line.slice(0, colonIndex);
    const valuePart = line.slice(colonIndex + 1).trimStart();
    if (field === "event") {
      event.event = valuePart || event.event;
      lastField = "event";
      return;
    }
    if (field === "data") {
      event.data += event.data ? `\n${valuePart}` : valuePart;
      lastField = "data";
      return;
    }
    lastField = field;
  }

  return {
    consume,
    build() {
      return event;
    },
  };
}

function preview(str, len = 100) {
  return str.length > len ? `${str.slice(0, len)}…` : str;
}
