import { parseSse } from "./sse.js";

test("parseSse yields events", async () => {
  const encoder = new TextEncoder();
  const sse =
    "data: one\n\n" +
    "event: error\ndata: boom\n\n" +
    "data: multi\ndata: line\n\n";
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(sse));
      controller.close();
    },
  });
  const events = [];
  for await (const evt of parseSse(stream)) {
    events.push(evt);
  }
  expect(events).toEqual([
    { event: "message", data: "one" },
    { event: "error", data: "boom" },
    { event: "message", data: "multi\nline" },
  ]);
});
