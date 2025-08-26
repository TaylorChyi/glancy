package com.glancy.backend.llm.model;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ChatMessage {

  private String role;
  private String content;
}
