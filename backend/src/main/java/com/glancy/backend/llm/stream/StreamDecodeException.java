package com.glancy.backend.llm.stream;

/** 表示流式事件在解析过程中出现问题，携带事件类型与原始负载，便于定位。 */
public class StreamDecodeException extends RuntimeException {

  private final String eventType;
  private final String payload;

  public StreamDecodeException(String eventType, String payload, Throwable cause) {
    super("Failed to decode event '" + eventType + "'", cause);
    this.eventType = eventType;
    this.payload = payload;
  }

  public String getEventType() {
    return eventType;
  }

  public String getPayload() {
    return payload;
  }
}
