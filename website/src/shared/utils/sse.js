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
          const valuePart = line.slice(colonIndex + 1).trimStart();
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
        const valuePart = line.slice(colonIndex + 1).trimStart();
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
