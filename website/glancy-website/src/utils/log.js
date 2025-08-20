/**
 * Unified streaming log helper for correlating frontend and backend events.
 *
 * Logs take the form:
 *   console.info(`[${tag}] ${stage}`, payload);
 * where `tag` identifies the stream (e.g. "streamWord" or "streamChat"),
 * `stage` is one of "start", "chunk", "end", or "error", and `payload`
 * is an object containing contextual details such as `term`, `userId`, or
 * `model`. This structured format allows log aggregators to link browser and
 * server activity by key fields.
 */
export function logStream(tag, stage, payload) {
  console.info(`[${tag}] ${stage}`, payload);
}
