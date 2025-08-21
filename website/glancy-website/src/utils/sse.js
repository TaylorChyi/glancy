export async function* parseSse(stream) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      while (true) {
        const separatorIndex = buffer.indexOf("\n\n");
        if (separatorIndex === -1) break;
        const rawEvent = buffer.slice(0, separatorIndex);
        buffer = buffer.slice(separatorIndex + 2);
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
          yield event;
        }
      }
    }
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
        yield event;
      }
    }
  } finally {
    reader.releaseLock();
  }
}
