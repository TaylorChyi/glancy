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
