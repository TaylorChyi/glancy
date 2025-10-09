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
      while (true) {
        const separatorIndex = buffer.indexOf("\n\n");
        if (separatorIndex === -1) break;
        const rawEvent = buffer.slice(0, separatorIndex);
        buffer = buffer.slice(separatorIndex + 2);
        log("event raw", preview(rawEvent));
        const event = { event: "message", data: "" };
        for (const line of rawEvent.split(/\r?\n/)) {
          const colonIndex = line.indexOf(":");
          if (colonIndex === -1) continue;
          const field = line.slice(0, colonIndex);
          const valuePart = extractFieldValue(line, colonIndex);
          if (field === "event") {
            event.event = valuePart;
          } else if (field === "data") {
            event.data += event.data ? `\n${valuePart}` : valuePart;
          }
        }
        if (event.data || event.event !== "message") {
          log("event parsed", event);
          yield event;
        }
      }
    }
    buffer = normalizeNewlines(buffer);
    if (buffer.trim()) {
      const event = { event: "message", data: "" };
      for (const line of buffer.split(/\r?\n/)) {
        const colonIndex = line.indexOf(":");
        if (colonIndex === -1) continue;
        const field = line.slice(0, colonIndex);
        const valuePart = extractFieldValue(line, colonIndex);
        if (field === "event") {
          event.event = valuePart;
        } else if (field === "data") {
          event.data += event.data ? `\n${valuePart}` : valuePart;
        }
      }
      if (event.data) {
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

function preview(str, len = 100) {
  return str.length > len ? `${str.slice(0, len)}…` : str;
}

/**
 * 背景：
 *  - SSE 协议仅要求剥离字段冒号后的首个空格，过度 trim 会误删模型为对齐输出补充的前导空格。
 * 目的：
 *  - 精确实现协议语义，仅在存在单个空格哨兵时移除它，确保 Doubao 等模型的词粒度空格得以保留。
 * 取舍：
 *  - 相比直接调用 trimStart，手动处理首字符虽略增代码，但避免破坏合法空白，符合“童子军”规范。
 */
function extractFieldValue(line, colonIndex) {
  const raw = line.slice(colonIndex + 1);
  if (raw.startsWith(" ")) {
    return raw.slice(1);
  }
  return raw;
}
