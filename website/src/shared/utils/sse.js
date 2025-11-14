import { logger } from "./logger.js";

export async function* parseSse(stream) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  const dev = typeof import.meta !== "undefined" && import.meta.env?.DEV;
  const log = (...args) => {
    if (dev) {
      logger.info("[parseSse]", ...args);
    }
  };

  try {
    let buffer = "";
    for await (const { events, buffer: updatedBuffer } of readStreamChunks(
      reader,
      decoder,
      log,
    )) {
      buffer = updatedBuffer;
      for (const event of events) {
        log("event parsed", event);
        yield event;
      }
    }

    for (const event of flushRemainingBuffer(buffer, log)) {
      log("event parsed", event);
      yield event;
    }
  } finally {
    reader.releaseLock();
  }
}

async function* readStreamChunks(reader, decoder, log) {
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    log("chunk", preview(chunk));
    buffer = normalizeNewlines(buffer + chunk);
    const { events, remaining } = drainBuffer(buffer, log);
    buffer = remaining;
    yield { events, buffer };
  }
}

function flushRemainingBuffer(buffer, log) {
  const normalized = normalizeNewlines(buffer || "");
  if (!normalized.trim()) return [];
  const event = assembleEvent(normalized);
  if (event && event.data) return [event];
  log?.("remaining buffer ignored", preview(normalized));
  return [];
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
  const event = { event: "message", data: "" };
  const context = { event, lastField: null };

  return {
    consume: createConsumeHandler(context),
    build() {
      return event;
    },
  };
}

function createConsumeHandler(context) {
  return function consume(line) {
    if (line == null) {
      return;
    }

    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) {
      context.lastField = handleContinuationLine(context, line);
      return;
    }

    const field = line.slice(0, colonIndex);
    const valuePart = line.slice(colonIndex + 1).trimStart();
    context.lastField =
      field === "event"
        ? handleEventField(context.event, valuePart)
        : field === "data"
          ? handleDataField(context.event, valuePart)
          : field;
  };
}

const handleEventField = (event, value) => (
  (event.event = value || event.event),
  "event"
);

const handleDataField = (event, value) => (
  (event.data += event.data ? `\n${value}` : value),
  "data"
);

const handleContinuationLine = (context, line) => (
  context.lastField === "data"
    ? ((context.event.data += `\n${line.trimStart()}`), "data")
    : context.lastField
);

function preview(str, len = 100) {
  return str.length > len ? `${str.slice(0, len)}…` : str;
}
